# SQL injection

## What is it?

User input concatenated into a SQL string changes the query's meaning.
`' OR 1=1 --` in a login form is the classic; blind and time-based
variants exist. It leads to data theft, corruption, and sometimes RCE.

## The control: parameters, always

Values travel separately from the SQL text; the database never parses
them as SQL.

```ts
// Recommended (Drizzle builder): always parameterised
db.select().from(users).where(eq(users.email, email));

// Recommended (raw with the sql tag): interpolations become $1, $2 parameters
db.execute(sql`select id from users where lower(email) = lower(${email})`);

// Avoid: string building
db.execute(sql.raw(`select id from users where email = '${email}'`));
pool.query("select * from users where email = '" + email + "'");
```

`sql.raw()` and string concatenation are the only ways to get injected
with Drizzle; grep for them in review.

## Identifiers and dynamic structure

Parameters can't replace table/column names or `ORDER BY` directions.
Whitelist them:

```ts
const sortColumns = { name: files.name, createdAt: files.createdAt, sizeBytes: files.sizeBytes } as const;
const col = sortColumns[input.sort];               // input.sort validated by z.enum(['name','createdAt','sizeBytes'])
query.orderBy(input.order === 'asc' ? asc(col) : desc(col));
```

Never `sql.raw(\`order by ${req.query.sort}\`)`.

## `LIKE` patterns

Escape `%` and `_` in user input used as a pattern, or the user controls
the wildcard:

```ts
const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
ilike(files.name, `%${escaped}%`)
```

## Defense in depth

- Database role for the app has only DML on its schema (no `DROP`, no superuser, no `pg_read_file`).
- `statement_timeout` limits time-based blind attacks.
- Input validation bounds lengths and formats before the query.
- Errors from the database never reach the client (no schema leakage).

## Other injections with the same shape

- **Command injection**: never `exec` with user input; use `execFile` with an args array.
- **Path traversal**: never build file paths from user input; use server-generated storage keys.
- **Header injection**: strip `\r\n` from values placed in headers (`Content-Disposition`).
- **NoSQL/JSON injection**: validate shapes so `{ $gt: '' }`-style objects can't reach a query.

## Related

- [input-validation.md](input-validation.md)
- [04-drizzle-orm/queries.md](../04-drizzle-orm/queries.md)
