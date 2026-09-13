# Account linking

## What is it?

Deciding what happens when someone signs in with Google using an email that
already has a password account — or a Microsoft account, or both.

## Why does it matter?

This is the one genuinely hard decision in OAuth, and it is a security
decision disguised as a UX decision. Link too eagerly and a provider that
lies about an email hands over an existing account. Link too reluctantly and
users end up with duplicate accounts, missing data, and a support ticket.

## The rule

**Automatic linking requires a verified email from the provider, and nothing
else ever links automatically.**

```ts
// auth/oauth/link.ts
export async function linkOrCreateUser(provider: Provider, identity: Identity) {
  // 1. Known provider identity → that user. The common path, and the only one keyed on `sub`.
  const existing = await oauthAccountsRepo.findByProviderUserId(provider, identity.providerUserId);
  if (existing) return usersRepo.findById(existing.userId);

  // 2. Unverified email → never match an existing account.
  if (!identity.emailVerified) throw new AppError('EMAIL_UNVERIFIED', 'Verify your email with the provider first', 400);

  return db.transaction(async (tx) => {
    const byEmail = await usersRepo.findByEmail(identity.email, tx);

    // 3. Verified email matching an existing user → link.
    if (byEmail) {
      await oauthAccountsRepo.create({ userId: byEmail.id, provider, providerUserId: identity.providerUserId, email: identity.email }, tx);
      await audit.record('user.oauth_linked', { userId: byEmail.id, provider }, tx);
      return byEmail;
    }

    // 4. Nobody → create, with no password.
    const user = await usersRepo.create({ email: identity.email, name: identity.name, passwordHash: null, emailVerifiedAt: new Date() }, tx);
    await oauthAccountsRepo.create({ userId: user.id, provider, providerUserId: identity.providerUserId, email: identity.email }, tx);
    return user;
  });
}
```

Run steps 3 and 4 in one transaction. Two concurrent first-time logins from
the same person — a double-clicked button — otherwise race to create two
users. The unique index on `(provider, provider_user_id)` is what actually
stops the duplicate; the transaction is what makes the loser fail cleanly.

## Why `sub` and not email

| | `sub` | `email` |
| --- | --- | --- |
| Changes | Never | Users change them; companies rename domains |
| Reuse | Never reassigned | Corporate addresses are reassigned to new employees |
| Trust | Asserted by the provider | Only meaningful with `email_verified` |

Keying on email means that when `a.smith@corp.com` leaves and a new A. Smith
is hired, the new employee signs in to the old employee's account.

## The eager-linking attack

If you link on an unverified email:

1. Attacker signs up at a provider that does not verify emails, using `victim@example.com`.
2. Attacker signs in to your app with that provider.
3. Your code finds the victim's existing account by email and links it.
4. The attacker is now inside the victim's account.

The `emailVerified` check at step 2 of the code above is the entire defence.
It is one line and it is not optional.

## Variations

| Policy | When | Trade-off |
| --- | --- | --- |
| **Auto-link on verified email** (default) | Consumer and most B2B products | Depends on trusting the provider's `email_verified` |
| **Require re-authentication before linking** | Financial, health, admin-heavy products | The user signs in with their password first, then links from settings. Safest, and more friction. |
| **Never auto-link** | High-assurance | Duplicate accounts and a support burden |
| **Domain-based provisioning** | Enterprise SSO | `@customer.com` verified through the customer's IdP joins that customer's tenant automatically |

If you pick anything other than the default, write down why, because the code
will look over-cautious to whoever reads it next.

## Unlinking

```ts
export async function unlinkProvider(userId: string, provider: Provider) {
  const [accounts, user] = await Promise.all([oauthAccountsRepo.listForUser(userId), usersRepo.findById(userId)]);

  const wouldBeLastCredential = accounts.length === 1 && !user.passwordHash;
  if (wouldBeLastCredential) {
    throw new AppError('LAST_LOGIN_METHOD', 'Set a password before removing your last sign-in method', 409);
  }

  await oauthAccountsRepo.delete(userId, provider);
  await audit.record('user.oauth_unlinked', { userId, provider });
}
```

Locking a user out of their own account by letting them remove their only
credential is a real and frequent bug.

## Showing it in the UI

The account settings page should list linked providers, their email at link
time, and when they were linked; offer "Connect" for the rest; and disable
unlink for the last credential with an explanation rather than an error after
the click.

## Common mistakes

- Linking on an unverified email. The account takeover above.
- Keying on email instead of `sub`.
- Creating the user and the `oauth_accounts` row in separate transactions.
- Overwriting the user's profile name and avatar from the provider on every login. Set them at creation; after that they are the user's to edit.
- Allowing the last credential to be removed.
- Not recording linking and unlinking in the audit log. These are account-security events.
- Assuming one user has one provider. The schema above allows many; the UI should too.

## Production considerations

- Email the user when a provider is linked or unlinked, as you would for a password change.
- If a user's provider email changes, do not rewrite your `users.email`. The account is keyed on `sub`; your email is your own record.
- For enterprise SSO, deciding that a verified domain implies membership of a tenant is a policy decision — make it explicitly, per customer.

## Checklist

- [ ] `oauth_accounts` keyed on `(provider, provider_user_id)` with a unique index.
- [ ] Lookup order: provider identity → verified email → create.
- [ ] Unverified provider email never links or creates.
- [ ] User creation and account linking share a transaction.
- [ ] Unlink refuses to remove the last credential.
- [ ] Link and unlink are audited and emailed.
- [ ] Profile fields are not overwritten from the provider on every login.

## Related

- [implementation.md](implementation.md)
- [security.md](security.md)
- [15-security/authentication.md](../15-security/authentication.md)
