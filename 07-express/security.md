# Express security setup

Full material: [15-security/](../15-security/README.md). The Express
wiring:

```ts
app.disable('x-powered-by');
app.set('trust proxy', 1);                                   // exact hop count; never `true` on a public host

app.use(helmet({
  contentSecurityPolicy: false,                              // API serves JSON; set CSP on the frontend host instead
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

app.use(cors({
  origin: config.CORS_ORIGIN,                                // exact origin, or an allow-list function
  credentials: true,                                         // only because the refresh cookie needs it
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 600,
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// rate limits
app.use(globalLimiter);                                      // loose, keyed by req.ip
authRouter.post('/login', loginLimiter, c.login);            // strict, keyed by ip + email
```

## `trust proxy`

Behind one load balancer, `1`. Behind Cloudflare + a platform proxy, `2`
or a list of trusted ranges. Wrong values make `req.ip` either the proxy
(everyone shares a rate-limit bucket) or spoofable (attackers set
`X-Forwarded-For`).

## Cookies

- Refresh token: `httpOnly`, `secure` in production, `sameSite: 'lax'`, `path: '/auth'`.
- If the API and frontend are on different registrable domains (`api.example.com` vs `app.example.com` share a site; `api.other.com` does not), `sameSite: 'none'` + `secure: true` is required, and CSRF protection must be considered ([15-security/csrf.md](../15-security/csrf.md)).

## Static and file handling

- Don't serve user uploads from the API; presigned object-storage URLs.
- If serving static files, `express.static` with `dotfiles: 'ignore'` and no directory listing; better, serve them from the CDN.

## Checklist

- [ ] `helmet`, exact-origin CORS, body limit, cookie flags.
- [ ] `trust proxy` set to the real hop count.
- [ ] Rate limits on auth and public routes; global loose limit.
- [ ] `x-powered-by` disabled.
- [ ] No uploads/downloads proxied through the API.

## Related

- [05-apis/api-security.md](../05-apis/api-security.md)
- [15-security/security-checklist.md](../15-security/security-checklist.md)
