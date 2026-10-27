# cardkeeper

A self-hosted, game-agnostic trading card collection manager with price history and ownership tracking.

Supported games: **Yu-Gi-Oh!** (card data and prices from [YGOPRODeck](https://ygoprodeck.com/api-guide/)) and
**Pokémon** (card data and prices from [TCGdex](https://tcgdex.dev), free and without an API key).
Further games plug in through a small adapter interface without touching the core schema or the UI.

Everything runs in containers: there is nothing to install on the host except Docker.

## Features

- Yu-Gi-Oh! and Pokémon in one collection, each game with its own filters and sort orders
- Add cards by name, card id or (Yu-Gi-Oh!) set code, or by set and number (Pokémon); a whole set at once with a wizard
- Overview with filters, search across all languages, sorting, total value of the active cards, and paging through the
  cards in the order of the overview
- Card page with German and English texts (Pokémon also Japanese), corrected set code and edition, images with zoom,
  status (active, sold, traded, gifted, lost) with date and counterpart, owner, and price history
- Login with ownership: everybody sees all cards, only the owner changes a card and can hand it over
- Prices per marketplace in its currency, an optional display currency (e.g. CHF), and a scheduled reload in small tranches
- CSV export of the current selection for Excel
- Light and dark appearance, interface in German and English
- Card images are downloaded once and stored on a volume, never hotlinked
- Semantic releases, multi-arch (amd64 + arm64) Docker images, automated dependency updates

Every behaviour is specified in [`openspec/specs/`](openspec/specs/) (one file per topic); the reasons for the main
decisions are in [`docs/adr/`](docs/adr/), and the structure of the app is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Quick start

Requirements: Docker Engine with Compose v2.24 or newer.

```bash
cp .env.example .env
# Set POSTGRES_PASSWORD and APP_DB_PASSWORD. Use URL-safe values, e.g.: openssl rand -hex 24
docker compose up -d --build
```

The app listens on <http://localhost:3000>. Database migrations are applied automatically on every start.

Once a release exists, the published image can be used instead of building (much faster on a Raspberry Pi):

```bash
docker compose pull && docker compose up -d
```

The stack consists of two services, `db` (PostgreSQL 16, no published port) and `app`
(Nuxt/Nitro server). Data lives in two named volumes: `db-data` and `card-images`.

### Configuration

All settings are environment variables in `.env`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | – (required) | PostgreSQL superuser password, only used on first start to create the application role |
| `APP_DB_PASSWORD` | – (required) | Password of the application's own database role (no superuser) |
| `APP_DB_NAME` / `APP_DB_USER` | `cardkeeper` | Database and role name |
| `APP_PORT` | `3000` | Port published on the host |
| `APP_BIND_ADDRESS` | `127.0.0.1` | Address the port is bound to; keep it on localhost when a reverse proxy runs on the same host |
| `PRICE_SOURCE` | `cardmarket` | Marketplace for list prices and totals: `cardmarket`, `tcgplayer`, `ebay`, `amazon`, `coolstuffinc` |
| `DISPLAY_CURRENCY` | – (not set: prices as received) | Currency the prices are shown in as well, e.g. `CHF` |
| `MAX_UPLOAD_MB` | `5` | Maximum size of a manually uploaded image |
| `SESSION_SECRET` | – (required) | At least 32 random characters (`openssl rand -hex 32`) that seal the login cookies; the app refuses to start with less. Changing it logs everybody out |
| `USERS` | – (required) | Comma separated user names, e.g. `anna,max`; missing users are created at startup (see [Users and passwords](#users-and-passwords)) |
| `PRICE_REFRESH_AFTER` | `1w` | Age after which the prices of a card are reloaded; `off` switches the reload off (see [Scheduled price reload](#scheduled-price-reload)) |
| `PRICE_REFRESH_BATCH_SIZE` | `300` | Cards reloaded in one tranche; a larger tranche only takes longer, keep it below about 1000 Pokémon cards |
| `PRICE_REFRESH_BATCH_EVERY` | `1d` | Least time between two tranches (at least `1h`) |
| `PRICE_REFRESH_DELAY_MS` | `500` | Pause between two requests to a card database (at least `100`) |
| `CONTAINER_PREFIX` | `cardkeeper` | Prefix of the container names (`cardkeeper_app`, `cardkeeper_db`) |
| `APP_IMAGE` | `ghcr.io/qaldak/cardkeeper:latest` | Image to run, e.g. to pin a version |

Further variables are read by the app but not passed on by `docker-compose.yml`, so they have no effect in `.env`: `IMAGE_DIR`
(fixed to `/data/card-images` in the image), the base URLs `YGOPRODECK_API_URL`, `TCGDEX_API_URL` and `EXCHANGE_RATE_API_URL`
(they replace the API addresses; the development overlay passes on `YGOPRODECK_API_URL`) and `SKIP_MIGRATIONS=1` (skips the migrations at start).
`BUILD_KIND` is a build argument that only the release workflow sets; it decides what the start banner says.

The database role is created by [`db/init/10-create-app-role.sh`](db/init/10-create-app-role.sh) when the data directory is
initialized for the first time. Changing the passwords later does not alter an existing database.

### Scheduled price reload

The app reloads the prices of the cards by itself. Only prices are written; texts, images and everything you entered stay
as they are. Every reload adds a price per marketplace to the history, also when the price has not changed.

- A card is **due** when its prices are older than `PRICE_REFRESH_AFTER` (a number and `h`, `d`, `w` or `mo`, e.g. `12h`,
  `1w`; `off` switches the reload off). Only active cards are reloaded.
- It is done in **tranches** of at most `PRICE_REFRESH_BATCH_SIZE` due cards, the oldest prices first, the next tranche at
  the earliest `PRICE_REFRESH_BATCH_EVERY` later. The defaults cover up to 2100 cards a week; a tranche is recorded in the
  database, so a restart neither skips nor repeats one.
- **Limits of the card databases:** YGOPRODeck allows 20 requests per second and blocks above that for an hour. The request
  rate depends on `PRICE_REFRESH_DELAY_MS`, not on the tranche size; a tranche takes a few seconds per 100 Yu-Gi-Oh! cards
  and about 0.5 to 1 second per Pokémon card (TCGdex answers one card per request and publishes no limit).
- If a card database refuses further requests, the tranche stops and the rest follows with the next one; the app then shows
  "The card database has reached its request limit, please wait a while". The log tells more:
  `docker logs cardkeeper_app 2>&1 | grep '\[prices\]'`.

### Users and passwords

The app has its own login. Everybody who is logged in sees all cards, but only the **owner** of a card can change it; the
person who adds a card is its owner and can hand it over to another user.

- **Creating users:** list the names in `USERS` in the `.env` file and restart. Missing users are created with the
  initial password `cardkeeper` and have to choose their own at the first login. There is no admin role. Removing a name
  from `USERS` deletes nothing.
- **Resetting a password:** the operator sets the hash back to `NULL`; the user then logs in with `cardkeeper` again and
  has to choose a new password.

  ```bash
  docker compose exec db psql -U postgres -d cardkeeper -c "UPDATE users SET password_hash = NULL WHERE name = 'anna';"
  ```

- **Cards without an owner** (from before the logins existed) can be seen by everybody, but nobody can change them until
  an owner is set:

  ```bash
  docker compose exec db psql -U postgres -d cardkeeper -c "UPDATE cards SET owner_user_id = (SELECT id FROM users WHERE name = 'anna') WHERE owner_user_id IS NULL;"
  ```

Upgrading from a version without logins: add `SESSION_SECRET` and `USERS` to the `.env` file (the stack does not start
without them). The existing players become users with the initial password and keep their cards; add everybody else to
`USERS`. The rules for passwords, sessions and the lock after failed logins are in
[`users-access`](openspec/specs/users-access/spec.md); HTTPS, HSTS and a content security policy are for the reverse proxy.

### Reverse proxy

The app does its own login, so a reverse proxy only has to forward the requests (and terminate TLS). Two settings matter:
nginx rejects uploads over 1 MB by default, so set `client_max_body_size` a little above `MAX_UPLOAD_MB` (default 5), and
pass `X-Forwarded-Proto $scheme` so that the login cookie is marked `secure` for https. Keep the port on localhost
(`APP_BIND_ADDRESS=127.0.0.1`) when the proxy runs on the same host.

### Backup

```bash
# database
docker compose exec -T db pg_dump -U postgres -d cardkeeper > cardkeeper-$(date +%F).sql
# card images
docker run --rm -v cardkeeper_card-images:/data -v "$PWD":/backup alpine \
  tar czf /backup/card-images-$(date +%F).tgz -C /data .
```

## Development

Nothing is installed on the host; the source is bind mounted into a container and `node_modules` lives in a volume.
The `make` targets are thin wrappers around `docker compose -f docker-compose.yml -f docker-compose.dev.yml`.

| Command | What it does |
| --- | --- |
| `make dev` | Dev server with hot reload on <http://localhost:3000> (applies migrations first) |
| `make test` | Lint, type check, unit and integration tests in a container, against a separate `cardkeeper_test` database |
| `make lint` / `make typecheck` | ESLint / TypeScript check only |
| `make migration name=add_x` | Create a new Prisma migration after editing `app/prisma/schema.prisma` |
| `make shell` | Shell inside the dev container |

After changing `package.json`, rebuild the dev image and drop the `node_modules` volume:
`docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v` (this also removes the dev database).

To try a branch next to your real installation, see [`docs/development.md`](docs/development.md).

**Tests:** unit tests (`app/tests/unit`) cover the pure logic; integration tests (`app/tests/integration`) run the services
against a real PostgreSQL with a fake card API. They need `TEST_DATABASE_URL`, truncate all tables and therefore never use
`DATABASE_URL`. `npm run test:coverage` (in `app/`) writes a coverage report to `app/coverage/`. The GitHub workflow
[`tests.yml`](.github/workflows/tests.yml) runs lint, type check, all tests, a Docker build check and a Compose
validation on every pull request, and as the first stage of every release.

## Releases

Releases are fully automatic: every push to `main` runs the tests and then
[semantic-release](https://github.com/semantic-release/semantic-release)
([`release.yml`](.github/workflows/release.yml), [`.releaserc.json`](.releaserc.json)). It determines the version from
the commit messages ([Conventional Commits](https://www.conventionalcommits.org/)), updates `CHANGELOG.md` and
`app/package.json`, creates the `release: x.y.z` commit, the `vX.Y.Z` tag and a GitHub release, and publishes the Docker
image (`linux/amd64`, `linux/arm64`) to `ghcr.io/qaldak/cardkeeper` as `X.Y.Z`, `X.Y`, `X` and `latest`.

Only minor and patch releases are created during normal development. A new major version needs an explicit breaking change.

| Commit | Release |
| --- | --- |
| `feat: …` | minor |
| `fix: …`, `perf: …`, `refactor: …`, `chore: …` | patch |
| `feat!: …`, `fix!: …`, any type with `!`, or a `BREAKING CHANGE:` footer | **major** |
| `build: …`, `ci: …`, `docs: …`, `style: …`, `test: …` | none |

To start at `0.1.0` instead of semantic-release's default `1.0.0`, the release workflow tags the first commit as `v0.0.0`
once (only if the repository has no version tag yet).

One-time repository setup:

- Secret `RELEASE_TOKEN`: a personal access token with `contents: write`, needed if the `main` branch is protected so the
  release commit can be pushed. Without it the workflow falls back to the default `GITHUB_TOKEN`.
- Package visibility of `ghcr.io/qaldak/cardkeeper` (private by default) in the repository's package settings.

[Dependabot](.github/dependabot.yml) checks weekly. Updates of production dependencies use the `chore:` prefix and
therefore trigger a patch release (they change the image); development-only updates and the Docker/Compose/Actions updates
use `build:` and do not. Prisma packages are grouped, and major bumps of Node.js, PostgreSQL and TypeScript are ignored on
purpose (LTS only, a Postgres major needs a dump/restore, `vue-tsc` support).

## Architecture and documentation

Stack: Nuxt 4 (TypeScript, Vue 3, Nitro), Nuxt UI + Tailwind CSS, Prisma 7 with PostgreSQL 16, Vitest, Node 24 (Alpine).
The Nuxt app is in `app/` (default layout, so the pages are in `app/app/`); `docker-compose.yml` is the production stack,
`docker-compose.dev.yml` the development and test overlay.

| Where | What |
| --- | --- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Context, containers, building blocks and the main runtime flows |
| [`openspec/specs/`](openspec/specs/) | Requirements per topic: the valid state of what the app does |
| [`docs/adr/`](docs/adr/) | Architecture decision records: why it is built this way |
| [`docs/development.md`](docs/development.md) | Trying out a branch next to the real installation |
| [`docs/KONZEPT.md`](docs/KONZEPT.md) | The original concept (historical, German) |
| [`CLAUDE.md`](CLAUDE.md) | Working rules for Claude Code (keep spec and code in step) |

### Adding a game

1. Implement the `CardAdapter` interface (`server/tcg/types.ts`): `fetchCardById`, `fetchCardByName`, `searchCards`,
   `mapToCommonSchema`; see `server/tcg/ygo/` and `server/tcg/tcgdex/` for complete examples. Language dependent data beyond
   name and description goes to `details`.
2. Register it in `server/tcg/registry.ts`.
3. Describe how its printing behaves in `shared/utils/game-config.ts`, show its data in the card page and its filters in the
   overview (`app/pages`), and add the labels to `i18n/locales/*.json`.

No schema change and no change in the core services is required.

## Roadmap

- Export: copy the cards for an AI prompt (deck building), printable list as PDF or Word

## License

[PolyForm Noncommercial License 1.0.0](LICENSE): free to use, copy and change for any noncommercial purpose (private use,
hobby, research, education, charitable and similar organizations); commercial use is not permitted. The license is not
an open source license in the sense of the OSI. The copyright notice that has to be passed on with the software is in
[`NOTICE`](NOTICE).

Versions released before this change were published under the GNU AGPL v3 and stay available under it for everybody
who received them.
