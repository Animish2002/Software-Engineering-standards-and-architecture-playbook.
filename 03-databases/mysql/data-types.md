# MySQL data types

| Need | Use | Notes |
| --- | --- | --- |
| Short text | `varchar(n)` with a deliberate `n` | `varchar(255)` by habit wastes index key space and sort buffers; size it |
| Long text | `text` / `mediumtext` | Not indexable in full without a prefix length; can't be in `ORDER BY` efficiently |
| Identifier | `bigint unsigned auto_increment` or `binary(16)` UUID | See [innodb.md](innodb.md) on clustered keys |
| Whole numbers | `int` / `bigint`, `unsigned` where negative is impossible | |
| Money | `decimal(12,2)` or integer minor units | Never `float`/`double` |
| Booleans | `tinyint(1)` / `boolean not null default 0` | Alias of `tinyint(1)` |
| Timestamps | `datetime(6)` stored in UTC | `timestamp` is limited to 2038 and converts by session zone; `datetime` does not convert |
| Auto timestamps | `datetime(6) not null default current_timestamp(6)`; `updated_at ... on update current_timestamp(6)` | Built-in `updated_at` maintenance |
| Closed sets | `enum('a','b')` or `varchar` + `CHECK` (8.0.16+) | `enum` changes require `ALTER TABLE`; `CHECK` is easier to evolve |
| JSON | `json` | Validated on write; index via generated columns |
| Email (case-insensitive) | `varchar(254)` with a `_ci` collation | Uniqueness is case-insensitive under `utf8mb4_0900_ai_ci`; use a `_bin`/`_cs` collation where case must matter |
| Binary | Object storage + key | Same as Postgres |

## Character sets and collations

- `utf8mb4` everywhere; `utf8mb4_0900_ai_ci` (accent- and case-insensitive) is the 8.0 default and fine for most text.
- Pick `utf8mb4_0900_as_cs` or `utf8mb4_bin` for columns where case/accent must be distinct (tokens, slugs).
- All joined columns must share a collation or the index is unusable.

## Index key length

Index key size is limited (3072 bytes with InnoDB `DYNAMIC` rows). A
`varchar(768)` in `utf8mb4` fills it. Use prefix indexes for long text
(`index (col(50))`) only when necessary; prefer sized `varchar`.

## Related

- [innodb.md](innodb.md)
- [differences-from-postgres.md](differences-from-postgres.md)
