# Docker Compose

## Local infrastructure (every project with a database)

```yaml
# docker-compose.yml (repo root)
name: app
services:
  postgres:
    image: postgres:17-alpine
    ports: ["5433:5432"]                  # non-default host port avoids clashing with a host Postgres
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

  # mysql:
  #   image: mysql:8.4
  #   ports: ["3307:3306"]
  #   environment: { MYSQL_ROOT_PASSWORD: root, MYSQL_DATABASE: app, MYSQL_USER: app, MYSQL_PASSWORD: app }
  #   command: --default-authentication-plugin=caching_sha2_password --character-set-server=utf8mb4 --collation-server=utf8mb4_0900_ai_ci
  #   volumes: [ "mysql-data:/var/lib/mysql" ]

  # redis:                                # only when the app actually uses it
  #   image: redis:7-alpine
  #   ports: ["6379:6379"]

  # mailpit:                              # catches outgoing email locally
  #   image: axllent/mailpit
  #   ports: ["8025:8025", "1025:1025"]

volumes:
  postgres-data:
```

```bash
docker compose up -d            # start
docker compose ps               # status/health
docker compose logs -f postgres
docker compose down             # stop, keep data
docker compose down -v          # stop, DELETE data
```

`DATABASE_URL=postgres://app:app@localhost:5433/app` in `.env.local`.

## Running the app in Compose (optional)

For teams that want one command to run everything:

```yaml
  api:
    build: { context: ., target: build }
    command: npm run dev -w apps/api
    environment:
      DATABASE_URL: postgres://app:app@postgres:5432/app
    env_file: .env.local
    ports: ["4000:4000"]
    volumes: ["./:/app", "/app/node_modules"]
    depends_on:
      postgres: { condition: service_healthy }
```

Most solo/small-team setups are faster running `npm run dev:api` on the
host against the Compose database. Choose one and document it in
`docs/LOCAL-SETUP.md`.

## Dev containers

`.devcontainer/devcontainer.json` pointing at this Compose file gives a
reproducible VS Code environment. Worth it for onboarding on teams; skip
for solo work.

## Rules

- Pin image majors (`postgres:17-alpine`), not `latest`.
- Named volumes for data; `down -v` is the reset.
- Health checks so `depends_on` waits for readiness.
- Never use Compose for production orchestration beyond a single-VM deployment.

## CI service containers

GitHub Actions `services:` with the same `postgres:17-alpine` image gives
tests a real database ([18-devops/ci-cd.md](../18-devops/ci-cd.md)).

## Related

- [dockerfile.md](dockerfile.md)
- [03-databases/connection-pooling.md](../03-databases/connection-pooling.md)
