# Local Database Development

This guide is the shared source of truth for running Grade Tracker's PostgreSQL database during local development. Both team members should follow the same steps and use the repository's `compose.yaml` rather than creating separate PostgreSQL configurations.

Prisma manages the application schema and committed migration history. The current schema contains the `User` model described in the Milestone 0 report and the PostgreSQL-backed session table required for authentication. Additional application models and seed data will be added later.

## Standard local configuration

The development database will use these values:

| Setting | Value |
|---------|-------|
| Docker Compose service | `postgres` |
| Host | `localhost` |
| Port | `5432` |
| Database | `grade_tracker` |
| Username | `postgres` |
| Password | `postgres` |
| Connection URL | `postgresql://postgres:postgres@localhost:5432/grade_tracker` |

These credentials are intentionally simple and are only for local development. Supabase and other deployed environments must use separate credentials supplied through environment variables.

## Prerequisites

Install the following before continuing:

1. Node.js 24 or newer.
2. Docker Desktop.
3. Git.

Start Docker Desktop and wait until it reports that the Docker engine is running. Verify it from a terminal:

```bash
docker --version
docker compose version
```

Both commands must print version information without an error.

## First-time setup

Run all commands from the repository root.

1. Install the JavaScript dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file.

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   macOS or Linux:

   ```bash
   cp .env.example .env
   ```

3. Confirm that `.env` contains the local connection URL:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/grade_tracker
   ```

4. Start PostgreSQL:

   ```bash
   npm run db:start
   ```

   The underlying Docker command is `docker compose up -d --wait postgres`. The command waits for PostgreSQL's health check before returning.

5. Confirm that the container is running and healthy:

   ```bash
   docker compose ps
   ```

6. Apply the committed Prisma migrations and generate the Prisma client:

   ```bash
   npm run db:migrate
   ```

7. Verify that PostgreSQL accepts a connection:

   ```bash
   docker compose exec postgres psql -U postgres -d grade_tracker -c "SELECT current_database(), current_user;"
   ```

8. Start the application:

   ```bash
   npm run dev
   ```

Following these steps should give both developers the same PostgreSQL version, application schema, database name, user, and connection settings.

## Normal daily workflow

Start the database before starting the application:

```bash
npm run db:start
npm run dev
```

Stop the application with `Ctrl+C`. Stop PostgreSQL when it is no longer needed:

```bash
npm run db:stop
```

Stopping the container does not delete the database. Docker stores its data in a named volume so it remains available the next time the container starts.

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run db:start` | Start the PostgreSQL container in the background |
| `npm run db:stop` | Stop the containers without deleting their data |
| `npm run db:logs` | Follow PostgreSQL startup and error logs |
| `npm run db:status` | Show the PostgreSQL container and health status |
| `npm run db:generate` | Generate the typed Prisma client from the schema |
| `npm run db:migrate` | Apply committed migrations and create a development migration when the schema changes |
| `npm run db:deploy` | Apply committed migrations without creating new ones; intended for deployment |
| `npm run db:studio` | Open Prisma Studio to inspect local data |
| `docker compose ps` | Show container and health status |

## Updating after pulling database changes

When another team member commits a Prisma migration:

```bash
git pull
npm install
npm run db:start
npm run db:migrate
```

Do not edit an already-shared migration. Create a new migration for later schema changes so every environment has the same migration history.

## Resetting the local database

Resetting deletes all local development data. It does not affect the other developer or the deployed Supabase database.

Only reset when sample data can be recreated safely:

```bash
docker compose down -v
npm run db:start
npm run db:migrate
```

The `-v` option deletes the named database volume. Do not include it during normal shutdown.

## Troubleshooting

### Docker is not running

Start Docker Desktop, wait for the engine to become ready, and rerun:

```bash
npm run db:start
```

### Port 5432 is already in use

Another PostgreSQL installation or container may already be using the standard port. Check existing containers first:

```bash
docker compose ps
docker ps
```

Stop the conflicting local service instead of giving each team member a different project port. If the port must change, update `compose.yaml`, `.env.example`, and this guide in the same commit.

### The application cannot connect

Check the following in order:

1. Docker Desktop is running.
2. `docker compose ps` reports the `postgres` service as healthy.
3. `.env` exists in the repository root.
4. `DATABASE_URL` matches the standard local connection URL.
5. The Prisma migrations have been applied.

Then review the database logs:

```bash
npm run db:logs
```

### The schema differs between teammates

Confirm both developers are on the same Git commit, run `npm install`, and apply all committed migrations. Do not manually change tables through Prisma Studio or a SQL client.

## Team rules

- Never commit `.env` or deployed database credentials.
- Commit `.env.example`, `compose.yaml`, the Prisma schema, and every migration.
- Use local PostgreSQL for routine development; do not share one development database.
- Do not use the deployed Supabase database for tests or seed development data into it.
- Test each new migration locally before opening or merging a pull request.
- Update this guide whenever database setup or commands change.
