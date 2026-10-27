# Operations Specification

## Purpose
Operation of the application: container stack, configuration, check at startup, health endpoint, hardening, reverse proxy and backup. Decisions: [ADR 0001](../../../docs/adr/0001-hosting-self-hosted.md), [ADR 0016](../../../docs/adr/0016-multi-arch-image-native-build.md), [ADR 0018](../../../docs/adr/0018-main-branch-protection.md), [ADR 0022](../../../docs/adr/0022-container-names-with-prefix.md).

## Requirements

### Requirement: Self-hosted in containers
The system SHALL run entirely in containers, only Docker SHALL be needed on the host; the stack consists of `db` (PostgreSQL 16, no published port) and `app` with the volumes `db-data` and `card-images`.
Source: User instruction 2026-10-04 09:59 ("everything via docker/containers"); README §Intro, §Quick start; KONZEPT §Hosting-Varianten | Origin: user requirement

#### Scenario: Start
- GIVEN Docker with Compose v2.24 or newer
- WHEN `docker compose up -d --build` runs
- THEN `db` and `app` run without further installation on the host

### Requirement: Migrations on every start
The system SHALL apply database migrations on every start; `SKIP_MIGRATIONS=1` skips them.
Source: README §Quick start; code app/docker-entrypoint.sh | Origin: derived

#### Scenario: New version
- GIVEN a new migration is present
- WHEN the container starts
- THEN it is applied

### Requirement: Configuration through environment variables
The system SHALL take its settings from environment variables in `.env`, not through the interface; `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, `SESSION_SECRET` and `USERS` are mandatory.
Source: User instruction 2026-10-10 20:40 ("not in the UI, in the .env"); README §Configuration | Origin: user requirement

#### Scenario: Mandatory value missing
- GIVEN `SESSION_SECRET` is missing
- WHEN the application starts
- THEN it aborts

### Requirement: Default values
The system SHALL use these default values: `APP_PORT` 3000, `APP_BIND_ADDRESS` 127.0.0.1, `PRICE_SOURCE` cardmarket, `MAX_UPLOAD_MB` 5, `CONTAINER_PREFIX` cardkeeper, `APP_DB_NAME` and `APP_DB_USER` cardkeeper.
Source: README §Configuration | Origin: derived

#### Scenario: Port
- GIVEN `APP_PORT` is not set
- WHEN the stack starts
- THEN the app listens on port 3000 at 127.0.0.1

### Requirement: Check of the configuration at startup
The system SHALL check at startup `SESSION_SECRET` (at least 32 characters), `USERS`, `DISPLAY_CURRENCY` (3 letters), positive numbers of the limits and the `PRICE_REFRESH_*` values and abort with a message on errors.
Source: Code app/server/lib/config.ts, duration.ts; test config.test.ts; README §Configuration | Origin: derived

#### Scenario: Too short
- GIVEN `SESSION_SECRET` has 10 characters
- WHEN the application starts
- THEN it aborts with a message

### Requirement: Database role without superuser
The system SHALL create an own database role for the app (no superuser) when the data directory is initialised for the first time; a later password change does not change an existing database.
Source: README §Configuration; KONZEPT §Sicherheitskonzept (confirmed by the user 2026-10-23); db/init/10-create-app-role.sh | Origin: user requirement

#### Scenario: Password changed
- GIVEN the database exists
- WHEN `APP_DB_PASSWORD` is changed
- THEN the password of the role stays unchanged

### Requirement: Start banner
The system SHALL write a banner (version, "Release image" or "Local build", Node version, architecture, start time UTC) in English to the log when the container starts; it SHALL NOT be in the README.
Source: User instruction 2026-10-10 21:38, 21:42; code app/docker-entrypoint.sh | Origin: user requirement

#### Scenario: Start
- GIVEN a release image
- WHEN the container starts
- THEN the log contains the banner with "Release image"

### Requirement: Health endpoint
The system SHALL return 200 under `GET /api/health` only when the database is reachable; the image SHALL contain a Docker `HEALTHCHECK`.
Source: Code app/server/api/health.get.ts, app/Dockerfile | Origin: derived

#### Scenario: Database off
- GIVEN the database is not reachable
- WHEN `/api/health` is called
- THEN the answer is not 200

### Requirement: Hardening and resources
The system SHALL start the app as user `node` with `no-new-privileges` and without capabilities, with `--max-old-space-size=256`, and PostgreSQL with `shared_buffers=128MB` and `max_connections=30`.
Source: Code docker-compose.yml, app/Dockerfile; KONZEPT §Deployment (partly changed) | Origin: derived

#### Scenario: Rights
- GIVEN the app container is running
- WHEN its user is checked
- THEN it is `node`

### Requirement: Reverse proxy
The system SHALL be operated behind a reverse proxy that only forwards and terminates TLS; `client_max_body_size` SHALL be a little above `MAX_UPLOAD_MB`, `X-Forwarded-Proto` SHALL be set.
Source: User instruction 2026-10-07 13:47, 15:31; README §Reverse proxy | Origin: user requirement

#### Scenario: HTTPS
- GIVEN TLS at the proxy with `X-Forwarded-Proto https`
- WHEN a login happens
- THEN the session cookie is `secure`

### Requirement: No telemetry in the containers
The system SHALL switch off telemetry and update notices of the tools in the containers (`CHECKPOINT_DISABLE`, `PRISMA_HIDE_UPDATE_MESSAGE`, `NUXT_TELEMETRY_DISABLED`).
Source: Code app/Dockerfile | Origin: derived

#### Scenario: Image
- GIVEN the built image
- WHEN its environment variables are read
- THEN all three variables are set

### Requirement: Upgrade without logins
The system SHALL take over on the upgrade of a version without logins, after `SESSION_SECRET` and `USERS` are added, the existing "players" as users with the initial password, who keep their cards.
Source: README (7f3d955) §Users and passwords | Origin: derived

#### Scenario: Upgrade
- GIVEN player Anna with 5 cards
- WHEN the new version starts
- THEN Anna is a user with her 5 cards

### Requirement: Backup only manual
The system SHALL leave the backup of the database (`pg_dump`) and the image volume to manual action; the README documents the commands, an automatic backup is not part of the application.
Source: Decision by the user (2026-10-23: manual only); README §Backup; KONZEPT (cron backup, superseded) | Origin: user requirement

#### Scenario: Instructions
- GIVEN the README
- WHEN §Backup is read
- THEN it names `pg_dump` and the image volume

#### Scenario: No cron
- GIVEN the stack is running
- WHEN the services are checked
- THEN there is no service for an automatic backup

### Requirement: Further variables of the app
The system SHALL evaluate `IMAGE_DIR`, `YGOPRODECK_API_URL`, `TCGDEX_API_URL`, `EXCHANGE_RATE_API_URL` and `SKIP_MIGRATIONS`; `docker-compose.yml` does not pass them on from `.env` (the development file only `YGOPRODECK_API_URL`).
Source: Code app/server/lib/config.ts, app/docker-entrypoint.sh, docker-compose.yml, docker-compose.dev.yml; README §Configuration | Origin: derived

#### Scenario: Entry in .env
- GIVEN `TCGDEX_API_URL` is in `.env`
- WHEN the stack starts
- THEN the app does not receive the value
