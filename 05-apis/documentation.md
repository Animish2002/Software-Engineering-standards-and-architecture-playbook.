# API documentation

## Principle

Documentation generated from the code's own schemas stays correct. Hand-
written docs drift by the second release.

## Recommended approach

- **OpenAPI 3.1** generated from the Zod request/response schemas.
  - Hono: `@hono/zod-openapi` defines routes with schemas and emits the spec.
  - Express: `zod-openapi` / `@asteasolutions/zod-to-openapi` to build the document from the same schemas the controllers parse with.
- Serve the spec at `GET /openapi.json` and a UI (Scalar or Swagger UI) at `/docs`, behind auth or disabled in production if the API is private.
- Keep a short human-written `docs/api.md` for the things a spec can't say: auth flow, pagination style, error codes, rate limits, versioning policy. Link to the generated spec for the endpoint list.

## What every endpoint entry needs

- Summary (one line), tag (module), auth requirement, permission key.
- Request schema (params, query, body) with examples.
- Response schema for 2xx and the error codes it can return.

## Example (Hono)

```ts
const route = createRoute({
  method: 'post', path: '/folders', tags: ['items'], security: [{ bearer: [] }],
  request: { body: { content: { 'application/json': { schema: createFolderSchema } } } },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: okSchema(folderSchema) } } },
    400: { description: 'Validation failed', content: { 'application/json': { schema: errorSchema } } },
  },
});
app.openapi(route, async (c) => { /* handler */ });
```

## Don't

- Maintain a Postman collection as the source of truth.
- Document endpoints that don't exist yet.
- Publish internal-only endpoints in a public spec.

## Related

- [request-validation.md](request-validation.md)
- [08-hono/validation.md](../08-hono/validation.md)
