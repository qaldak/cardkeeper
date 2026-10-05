# cardkeeper

A self-hosted, game-agnostic trading card collection manager with price history and ownership tracking.

The first version supports **Yu-Gi-Oh!** (card data and prices from [YGOPRODeck](https://ygoprodeck.com/api-guide/)).
Other games (Pokémon is next) plug in through a small adapter interface without touching the core schema or the UI.

Everything runs in containers: there is nothing to install on the host except Docker.

## Features

- Collection overview with filters for status, player, card type, monster type, attribute, rarity and a level range
  (dropdowns are filled from the collection); the search box matches names in every language, set code and set name;
  sortable by recently added, name, level, purchase date and price (ascending/descending; cards without a value come
  last); total value of the active cards
- Card detail page: texts in German and English with a language switch (German first, a language the card does not
  have is disabled), the set code and edition can be corrected (e.g. German or Japanese prints, applies to all
  languages), manual image upload, status handling (active, sold, traded, gifted, lost) with date and counterpart,
  assignment to players, price history
- "Update from API" refreshes texts, attributes and prices of a card; set code, edition, status, assignment,
  purchase date and images are never touched
- "Add card" lookup by name or passcode against the card database, including the exact printing (set and rarity). There
  is no language to choose: the search looks for German first and falls back to English, and both languages are
  stored where available
- Card images are downloaded once and stored on a volume, never hotlinked
- Prices are stored per marketplace in the currency of that marketplace and are **not converted**
  (Cardmarket in EUR, TCGplayer/eBay/Amazon/CoolStuffInc in USD); the list uses the marketplace set in `PRICE_SOURCE`
- Changes made by users are written to an audit log, and the card page shows "modified on" next to the origin as soon
  as a user has changed anything (printing, status, assignment, purchase date, images; a refresh does not count)
- User interface in German and English
- Semantic releases, multi-arch (amd64 + arm64) Docker images, automated dependency updates

Not part of this first version (see [`docs/KONZEPT.md`](docs/KONZEPT.md) for the full concept): scheduled price refresh,
PDF/CSV/Markdown export, an `/admin` area and a login. See [Roadmap](#roadmap).

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
| `MAX_UPLOAD_MB` | `5` | Maximum size of a manually uploaded image |
| `AUTH_USER_HEADER` | `x-remote-user` | Request header with the user name set by the reverse proxy (used as `changed_by`) |
| `APP_IMAGE` | `ghcr.io/qaldak/cardkeeper:latest` | Image to run, e.g. to pin a version |

The database role is created by [`db/init/10-create-app-role.sh`](db/init/10-create-app-role.sh) when the data directory is
initialized for the first time. Changing the passwords later does not alter an existing database.

### Reverse proxy and access control

The app has no login of its own; it is meant to run in a home network or behind a VPN. It trusts the header named by
`AUTH_USER_HEADER` for the audit log. Therefore never expose the app port directly to untrusted networks, and let the
reverse proxy set (not pass through) the header. Example for nginx:

```nginx
server {
    listen 443 ssl;
    server_name ygo.example.home;

    client_max_body_size 6m;   # a bit more than MAX_UPLOAD_MB

    location / {
        auth_basic           "cardkeeper";
        auth_basic_user_file /etc/nginx/cardkeeper.htpasswd;

        proxy_pass         http://127.0.0.1:3000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   X-Remote-User     $remote_user;
    }
}
```

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

### Tests

- **Unit tests** (`app/tests/unit`) cover the pure logic: status rules, filters, manual override tracking, image
  validation and download safety, request validation, and the Yu-Gi-Oh! adapter against a fixture of the documented API shape.
- **Integration tests** (`app/tests/integration`) run the services against a real PostgreSQL with a fake card API and
  a temporary image directory. They need `TEST_DATABASE_URL` and are skipped without it. They truncate all tables, which is
  why they never use `DATABASE_URL`.

The GitHub workflow [`tests.yml`](.github/workflows/tests.yml) runs lint, type check and all tests (with a PostgreSQL
service), a Docker build check and a Compose validation on every pull request, and as the first stage of every release.

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

### Dependency updates

[Dependabot](.github/dependabot.yml) checks weekly: npm (app and release tooling), the Dockerfile, the Compose file and
GitHub Actions. Updates of production dependencies use the `chore:` prefix and therefore trigger a patch release (they change
the image); development-only updates and the Docker/Compose/Actions updates use `build:` and do not. Prisma packages are
grouped (CLI and client must match), and major bumps of Node.js, PostgreSQL and TypeScript are ignored on purpose
(LTS only, a Postgres major needs a dump/restore, `vue-tsc` support).

## Architecture

```
app/                      Nuxt web app (UI + API routes), one Docker image
  app/                    Vue pages, components, composables (Nuxt UI, Tailwind)
  i18n/locales/           German and English translations
  server/api/             Thin HTTP handlers
  server/services/        Business logic (cards, images, players), framework independent
  server/tcg/             Adapter interface, registry and the Yu-Gi-Oh! adapter
  server/lib/             Pure helpers (config, status rules, filters, image files, ...)
  shared/                 Types and rules shared by server and UI
  prisma/                 Schema and migrations
  tests/                  Unit and integration tests
db/init/                  PostgreSQL first-start script (application role)
docs/                     Original concept and UI mockups
docker-compose.yml        Production stack
docker-compose.dev.yml    Development and test overlay
```

**Stack:** Nuxt 4 (TypeScript, Vue 3, Nitro), Nuxt UI + Tailwind CSS, Prisma 7 with PostgreSQL 16, Vitest, Node 24 (Alpine).

### Data model

`games`, `cards` (one row per physical card), `card_sets`, `price_history`, `status_history`, `players`, `api_snapshots`
(immutable raw API responses), `card_images` (files live on the `card-images` volume, the table stores relative paths),
`audit_log`. Game specific values (ATK/DEF/level, later HP/types, ...) are JSONB in `cards.game_specific_attributes`.

Differences from the original concept:

- Card status is stored as a language neutral enum (`ACTIVE`, `SOLD`, `TRADED`, `GIFTED`, `LOST`) and translated in the UI.
- Language dependent texts live in `card_translations` (one row per card and language: German and English).
  `cards.name` is the display name in the preferred language (German, else English). Language independent attributes
  (type, monster type, attribute, ATK, DEF, level) come from the English response. `api_snapshots` has one raw
  response per language.
- Names, texts and attributes are read-only in the UI, so there are no manual overrides of API data (`manual_overrides`
  was dropped). `card_sets` holds the printing of the physical card; its set code and edition are the only editable
  card data and apply to all languages. `cards.user_modified_at` records the last change made by a user.
- `card_sets.edition` holds the manually entered edition (e.g. "1st Edition"), which the API does not provide.
- Prices keep their source currency instead of being shown in CHF.
- The Nuxt app is the Nuxt 4 default layout, so its pages are in `app/app/`.

### Adding a game

1. Implement the `CardAdapter` interface (`server/tcg/types.ts`): `fetchCardById`, `fetchCardByName`, `searchCards`,
   `mapToCommonSchema`; see `server/tcg/ygo/` for a complete example.
2. Register it in `server/tcg/registry.ts`.
3. Add its editable attributes to `shared/utils/game-fields.ts` and the matching labels to `i18n/locales/*.json`.

No schema change and no change in the services is required.

### Notes on the card API

- The YGOPRODeck API is rate limited and asks not to hotlink images; the app makes one request per
  lookup or refresh and downloads each image once. Images are only downloaded from the hosts an adapter declares.
- The adapter follows the documented API v7 response shape. Its tests use a hand-written fixture of that shape, not
  recorded live data, so check a real lookup after the first deployment.
- The API reports every error as HTTP 400 with `{ "error": "<message>" }`. Only "No card matching …" means an empty
  result; any other error text is passed on in the 502 message and the cause of network failures is kept in the logs.
- Every card is requested twice (`language=de` and English). If the API answers a German request for an untranslated card
  with the English card instead of "not found", that copy is detected (same name and text as the English one) and not
  stored as a German translation.

## Roadmap

- Scheduler container for periodic price refresh (`node-cron`)
- Export as PDF, CSV and Markdown
- `/admin` area (games, players) behind HTTP basic auth and audit log view
- Decision on a login (currently none; access control is the network and the reverse proxy)
- Pokémon adapter (pokemontcg.io)

## License

[GNU AGPL v3](LICENSE)
