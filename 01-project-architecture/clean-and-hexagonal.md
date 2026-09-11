# Clean architecture and hexagonal (ports and adapters)

## What are they?

Two names for the same core idea: business logic sits at the centre with no
dependency on frameworks, databases, or transports. Everything external
(HTTP, database, email, storage) is an **adapter** that plugs into a **port**
(an interface) the core defines.

```text
           ┌───────────────────────────────┐
  HTTP ──► │  adapters (in)                │
  Queue ─► │    ┌─────────────────────┐    │
           │    │   core / use cases  │    │
           │    │   domain rules      │    │
           │    └──────────┬──────────┘    │
           │  adapters (out): DB, email,   │ ──► Postgres, R2, SMTP
           └───────────────────────────────┘
```

## Why does it matter?

The core idea (rules independent of infrastructure) is exactly what makes
services testable and lets you swap Express for Hono or Postgres for MySQL
without rewriting rules. The *full ceremony* (entities, use-case classes,
interface per repository, DTO mappers per layer, DI container) is where
JavaScript projects drown.

## When should I use it?

- Use the **principle** always: services take plain inputs, return plain outputs, know nothing about `req`/`res`.
- Use **explicit ports** (interfaces) only where a second adapter genuinely exists or is planned within the project's life: storage providers (R2 today, S3 tomorrow), email providers, payment gateways.

## When should I NOT use it?

- One database, one framework, one team: don't write `IUserRepository` with one implementation. A module of exported query functions is the port and the adapter at once, and tests can hit a real test database.
- Don't add mappers between "entity" and "DTO" and "row" when they are the same shape.

## Recommended approach: the useful 20%

```ts
// packages/storage/src/provider.ts  — a real port: two plausible adapters
export interface StorageProvider {
  getUploadUrl(key: string, contentType: string): Promise<string>;
  getDownloadUrl(key: string): Promise<string>;
  checkAccess(): Promise<boolean>;
}

// packages/storage/src/r2.ts — adapter
export class R2StorageProvider implements StorageProvider { /* S3-compatible calls */ }

// apps/api/src/lib/storage.ts — composition root
export const storage: StorageProvider = new R2StorageProvider(config);
```

```ts
// modules/items/items.service.ts — core: depends on the port, not the adapter
export async function createUploadUrl(actorId: string, input: CreateFileInput) {
  const owner = await resolveOwner(actorId, input.parentId);
  await assertQuota(owner.id, input.size);
  const row = await itemsRepo.insertFile({ ...input, ownerId: owner.id, storageKey: newKey() });
  const url = await storage.getUploadUrl(row.storageKey, input.mimeType);
  return { file: row, uploadUrl: url };
}
```

The service is testable by substituting `storage` with a fake in tests
(module mocking or passing it as a parameter). No container required.

## Bad example

```ts
// Avoid: ceremony without a second adapter
export class CreateUserUseCase {
  constructor(
    @inject('IUserRepository') private repo: IUserRepository,
    @inject('IPasswordHasher') private hasher: IPasswordHasher,
    @inject('IUserMapper') private mapper: IUserMapper,
    @inject('IEventBus') private bus: IEventBus,
  ) {}
  async execute(dto: CreateUserRequestDto): Promise<CreateUserResponseDto> { /* ... */ }
}
```

Four interfaces, four single implementations, a container, and a mapper for
a shape that is the same on both sides.

## Common mistakes

- Interfaces for everything "so we can mock it". Mock at the boundary you actually replace (network, storage), not at every function.
- Domain "entities" as classes with getters/setters that mirror table rows.
- DTO mapping layers that copy fields one-to-one.

## Checklist

- [ ] Services depend on nothing framework-specific.
- [ ] A port (interface) exists only where a second adapter is real or imminent.
- [ ] Composition happens in one place (`lib/` or `app.ts`), not via a container.
- [ ] Tests replace adapters at the boundary, not every function.

## Related

- [layered-architecture.md](layered-architecture.md)
- [04-drizzle-orm/repository-pattern.md](../04-drizzle-orm/repository-pattern.md)
- [00-engineering-principles/abstraction-guidelines.md](../00-engineering-principles/abstraction-guidelines.md)
