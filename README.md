# cardkeeper

A self-hosted, game-agnostic trading card collection manager with price history and ownership tracking.

Supported games: **Yu-Gi-Oh!** (card data and prices from [YGOPRODeck](https://ygoprodeck.com/api-guide/)) and
**Pokémon** (card data and prices from [TCGdex](https://tcgdex.dev), free and without an API key).
Further games plug in through a small adapter interface without touching the core schema or the UI.

Everything runs in containers: there is nothing to install on the host except Docker.

## Features

- Yu-Gi-Oh! and Pokémon in one collection: the game is chosen when adding a card (the last choice is remembered per
  browser in a cookie, so adding several Pokémon cards in a row needs no switching), the overview shows one game or all
  games (all games on the first visit, afterwards the last choice of that browser), and each game has its own filters (Yu-Gi-Oh!: card type, type, attribute, rarity, level range; Pokémon: category,
  type, stage, rarity, variant, HP range) and sort orders (level for Yu-Gi-Oh!, HP for Pokémon)
- Light and dark appearance: follows the device by default (light if the device says nothing); a switch in the header
  chooses light, dark or system and is remembered in the browser
- Collection overview with filters for status, owner, card type, monster type, attribute, rarity and a level range
  (dropdowns are filled from the collection); the search box matches names in every language, set code and set name;
  sortable by recently added, name, level, purchase date and price (ascending/descending; cards without a value come
  last); total value of the active cards
- Card detail page: texts in German and English with a language switch (German first, a language the card does not
  have is disabled), the set code (always capitals) and edition can be corrected (e.g. German or Japanese prints, applies to all
  languages), manual image upload, click on the image to see it enlarged (a click on the enlarged image closes it, wide areas beside it and the arrow keys go through several images, a button downloads it; "Save image as" in the right-click menu works as well and suggests the card name), status handling (active, sold, traded, gifted, lost) with date and counterpart,
  the owner (who can hand the card over to another user), price history
- "Update from API" refreshes texts, attributes and prices of a card; set code, edition, status, owner,
  purchase date and images are never touched
- "Add card" lookup by name or passcode against the card database, including the exact printing (set and rarity). For
  Yu-Gi-Oh! the set code of a print works as well ("LOB-EN005", "L5DD-ENA15"; asked at YGOPRODeck's
  `cardsetsinfo.php`): a code of another language ("L5DD-DEA15") that finds nothing is looked up with its English code
  ("L5DD-ENA15") instead. The print is preselected in the form when it is the only one with that code (several rarities
  of one code leave the choice open), and the code typed, which is the one printed on the card, is stored as the set
  code, while set and rarity come from the chosen print. There
  is no language to choose: the search looks for German first and falls back to English, and both languages are
  stored where available. For Yu-Gi-Oh! the edition printed on the card (1st Edition, Limited Edition, shown in the
  The search for Yu-Gi-Oh! and Pokémon (by name), the Pokémon set filter and the search in your own collection also find
  a name with "ß" when it is typed with "ss" ("weisser" finds "weißer"), as it is written in Switzerland, and the other
  way round
  language of the interface) is a one-click choice next to the printing; nothing chosen means Unlimited, which is not
  printed on the card. On the card page the same choice is a dropdown
- Card images are downloaded once and stored on a volume, never hotlinked
- Prices are stored per marketplace in the currency of that marketplace and are **not converted**
  (Cardmarket in EUR, TCGplayer/eBay/Amazon/CoolStuffInc in USD); the list uses the marketplace set in `PRICE_SOURCE`
- Changes made by users are written to an audit log, and the card page shows "modified on" next to the origin as soon
  as a user has changed anything (printing, status, assignment, purchase date, images; a refresh does not count)
- User interface in German and English
- Semantic releases, multi-arch (amd64 + arm64) Docker images, automated dependency updates

Not part of this first version (see [`docs/KONZEPT.md`](docs/KONZEPT.md) for the full concept): scheduled price refresh and PDF/CSV/Markdown export. See [Roadmap](#roadmap).

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
| `SESSION_SECRET` | – (required) | At least 32 random characters (`openssl rand -hex 32`) that seal the login cookies; the app refuses to start with less. Changing it logs everybody out |
| `USERS` | – (required) | Comma separated user names, e.g. `anna,max`; missing users are created at startup (see [Users and passwords](#users-and-passwords)) |
| `CONTAINER_PREFIX` | `cardkeeper` | Prefix of the container names (`cardkeeper_app`, `cardkeeper_db`) |
| `APP_IMAGE` | `ghcr.io/qaldak/cardkeeper:latest` | Image to run, e.g. to pin a version |

The database role is created by [`db/init/10-create-app-role.sh`](db/init/10-create-app-role.sh) when the data directory is
initialized for the first time. Changing the passwords later does not alter an existing database.

### Users and passwords

The app has its own login. Everybody who is logged in sees all cards, but a card can only be changed (data, status,
images, "Update from API", deleting) by its **owner**; the person who adds a card is its owner, and the owner can hand it
over to another user, after which only that user can change it.

- **Creating users:** list the names in `USERS` in the `.env` file and restart. Missing users are created with the
  initial password `cardkeeper`; at the first login they have to choose their own (at least 8 characters, not
  `cardkeeper`). There is no admin role in the app. Removing a name from `USERS` deletes nothing: the account, its
  password and its cards stay, so the list can be changed freely. Passwords are stored as scrypt hashes.
- **Resetting a password:** the operator sets the hash back to `NULL`; the user then logs in with `cardkeeper` again and
  has to choose a new password. Every login that was made with the old password ends.

  ```bash
  docker compose exec db psql -U postgres -d cardkeeper -c "UPDATE users SET password_hash = NULL WHERE name = 'anna';"
  ```

- **Cards without an owner:** cards that were not assigned to a player before the logins existed have no owner. They can
  be seen by everybody, but nobody can change them until an owner is set:

  ```bash
  docker compose exec db psql -U postgres -d cardkeeper -c "UPDATE cards SET owner_user_id = (SELECT id FROM users WHERE name = 'anna') WHERE owner_user_id IS NULL;"
  ```

- **Safeguards:** a user name is blocked for 15 minutes after 10 failed logins (the initial password is public, so it
  could otherwise be guessed for every name); a login lasts 30 days; changing or resetting a password logs the other
  browsers out. Removing a user in the database leaves their cards without an owner.

Upgrading from a version without logins: add `SESSION_SECRET` and `USERS` to the `.env` file (the stack does not start
without them). The existing players become users with the initial password and keep their cards; add everybody else to
`USERS`. The reverse proxy no longer has to authenticate anybody.

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

### Trying out a branch

Run the branch next to your real installation under another project name. A separate project has its own containers,
network and volumes, so the real data stays untouched and the migrations of the branch only touch the test database:

```bash
git fetch origin && git checkout <branch>
cp .env.example .env.test        # other passwords are fine; set APP_PORT=3001 and CONTAINER_PREFIX=cardkeeper-test
docker compose -p cardkeeper-test --env-file .env.test up -d --build
# open http://localhost:3001

docker compose -p cardkeeper-test --env-file .env.test down -v    # remove it again, including its data
```

To try the branch with a copy of your real data (this also tests the upgrade of the database), start only the database,
load a dump, and then start the app, which applies the new migrations:

```bash
docker compose exec -T db pg_dump -U postgres -d cardkeeper > real.sql          # in the real installation
docker compose -p cardkeeper-test --env-file .env.test up -d db
docker compose -p cardkeeper-test --env-file .env.test exec -T db psql -U postgres -d cardkeeper < real.sql
docker compose -p cardkeeper-test --env-file .env.test up -d --build
```

The containers are named `cardkeeper_app` and `cardkeeper_db` (prefix `CONTAINER_PREFIX`); the test stack therefore needs its own prefix, as
above. The `make dev` and `make test` targets use the default project name and therefore the same volumes as the real
installation; use `-p` as above (or a separate checkout) when you do not want that. Docker images are only published for
releases, not for branches.

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
  server/services/        Business logic (cards, images, users), framework independent
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

`games`, `cards` (one row per physical card), `card_sets`, `price_history`, `status_history`, `users`, `api_snapshots`
(immutable raw API responses), `card_images` (files live on the `card-images` volume, the table stores relative paths),
`audit_log`. Game specific values (ATK/DEF/level, HP/types/stage, ...) are JSONB in `cards.game_specific_attributes`,
so a new game does not need a schema change.

Differences from the original concept:

- Card status is stored as a language neutral enum (`ACTIVE`, `SOLD`, `TRADED`, `GIFTED`, `LOST`) and translated in the UI.
- Language dependent texts live in `card_translations` (one row per card and language: German and English).
  `cards.name` is the display name in the preferred language (German, else English). Language independent attributes
  (type, monster type, attribute, ATK, DEF, level) come from the English response. `api_snapshots` has one raw
  response per language.
- Names, texts and attributes are read-only in the UI, so there are no manual overrides of API data (`manual_overrides`
  was dropped). `card_sets` holds the printing of the physical card; its set code and edition are the only editable
  card data and apply to all languages. `cards.user_modified_at` records the last change made by a user.
- `card_sets.edition` holds the edition of a Yu-Gi-Oh! card, which the API does not provide. The editions printed on
  the card are stored as the keys `FIRST_EDITION` and `LIMITED_EDITION` and translated when shown (`edition.<KEY>` in
  the locale files, like `status.<KEY>`); "Unlimited" is not printed, so it is NULL. Older values that start with `1st` or `1.` became
  `FIRST_EDITION` by a migration; any other value is left as it is and listed in the log of the app container at every
  start (`[editions] ...`, with an `UPDATE` to copy), so that it can be fixed with SQL. A new edition is one more key in
  `shared/utils/editions.ts` and its labels. For Pokémon the column holds the variant key of the physical card
  (`normal`, `reverse`, ... translated through `variant.<key>`, see below).
- `card_translations.details` (JSONB) holds further language dependent data of a card: for Pokémon the attack and
  ability texts and the localized names of types, stage and rarity. It is null for Yu-Gi-Oh!.
- Prices keep their source currency instead of being shown in CHF.
- The Nuxt app is the Nuxt 4 default layout, so its pages are in `app/app/`.

### Pokémon

The data model is explicit and typed in [`shared/types/pokemon.ts`](app/shared/types/pokemon.ts):

- **`PokemonAttributes`** (language independent, `cards.game_specific_attributes`): category (`Pokemon`, `Trainer`,
  `Energy`), set id and number, HP, energy types, stage, evolves from, Pokédex numbers, retreat cost, regulation mark,
  illustrator, trainer and energy type, legality and the `variants` the card exists in. They always come from the English
  response, so filters and sorting use one spelling (`Fire`, `Stage1`) whatever language is shown. The dropdowns show these
  values translated.
- **`PokemonDetails`** (language dependent, `card_translations.details`, German and English): the texts of attacks,
  abilities, weakness and resistance, the rules text of Trainer and Energy cards, and the localized type, stage and
  rarity names.
- The printing (`card_sets`): the set code is the card id (`swsh3-136`), the set name and rarity come from the API and
  `edition` is the variant of the physical card: `normal`, `reverse`, `holo`, `firstEdition` or `wPromo`. One printing is
  offered per variant the card exists in. The variant is chosen when adding the card and can be changed afterwards among
  the variants of that card; the card id cannot be changed, because the same card has the same id in every language.
- Prices: `cardmarket` (EUR, price trend or average), `cardmarket-holo` where the API has a separate holo price, and
  `tcgplayer-<variant>` (USD, market price) for every variant TCGplayer lists. The list and the total use `PRICE_SOURCE`
  (default `cardmarket`) for both games.
- Searching: by name (German first, then English) or by card id such as `swsh3-136`; the results show small images
  loaded from `assets.tcgdex.net` (only in the result list, the card image itself is downloaded and stored locally).

- **Finding a card by set and number**: a Pokémon card has no set code, only a set symbol and a number such as `040/088`.
  When adding a card, "By set and number" lets you pick the card database language (German by default, or English or Japanese), type the
  number as printed and pick the set by its name or logo (the set symbol is not shown: TCGdex does not serve it for every set). The part after the slash is the *printed* size of the set
  (TCGdex `cardCount.official`, which can be smaller than the real number of cards because of secret rares), and it narrows
  the set list down. Several sets can have the same size, so check the set name. The slash is optional: `040088` or
  `040 088` become `040/088` when the field is left (only digit counts that split evenly, 3+3 or 4+4, are recognized;
  the API itself does not need the slash, it only serves to narrow down the set list). The number is matched
  without leading zeros (`040` = `40`, `TG01` = `tg01`). The chosen card is shown with its number, set and image before it
  is added; the set and its card list come from `GET /api/sets` and `GET /api/sets/<id>` and are cached for six hours.
- **Japanese cards** live in their own TCGdex database with their own ids (`SV9-040`), they are not translations of the
  English cards. Japanese is therefore a third stored language, and a card that exists only in Japanese keeps only its
  Japanese text. TCGdex cannot search Japanese cards by Latin text, so they are found by set and number or by card id; a
  Japanese name search needs Japanese characters. Japanese category, type, stage and trainer/energy type values are mapped to the
  English spellings so the filters work across languages; a value that is not in the mapping stays as delivered.

How the printing behaves per game is configured in [`shared/utils/game-config.ts`](app/shared/utils/game-config.ts).

### Adding a game

1. Implement the `CardAdapter` interface (`server/tcg/types.ts`): `fetchCardById`, `fetchCardByName`, `searchCards`,
   `mapToCommonSchema`; see `server/tcg/ygo/` and `server/tcg/tcgdex/` for complete examples. Language dependent data beyond
   name and description goes to `details`.
2. Register it in `server/tcg/registry.ts`.
3. Describe how its printing behaves in `shared/utils/game-config.ts`, show its data in the card page and its filters in the
   overview (`app/pages`), and add the labels to `i18n/locales/*.json`.

No schema change and no change in the core services is required.

### Notes on the card API

- The YGOPRODeck API is rate limited and asks not to hotlink images; the app makes one request per
  lookup or refresh and downloads each image once. Images are only downloaded from the hosts an adapter declares.
- The "add card" lookup shows the small card image for Yu-Gi-Oh! as well. YGOPRODeck asks not to hotlink its images, so
  the browser never loads them from there: the app downloads each small image once, the first time a card is shown, keeps
  it in the image volume (`thumbnails/ygo/`) and serves its own copy (`/api/thumbnails/ygo/<passcode>`). At most four are
  downloaded at once. TCGdex allows its images to be used directly, so Pokémon images are loaded from there.
- The adapter follows the documented API v7 response shape. Its tests use a hand-written fixture of that shape, not
  recorded live data, so check a real lookup after the first deployment.
- A field of a YGOPRODeck card with an unexpected value (e.g. a Link monster's missing level or DEF delivered as
  `null`) is left out and logged once as `[ygo] Card <id> "<name>": ignored unexpected values ...`; only a card without
  id or name is refused. One unusable card does not break a search for the others.
- The API reports every error as HTTP 400 with `{ "error": "<message>" }`. Only "No card matching …" means an empty
  result; any other error text is passed on in the 502 message and the cause of network failures is kept in the logs.
- TCGdex (`https://api.tcgdex.net/v2/<language>/cards`) needs no key. The adapter follows the documented card shape and
  its tests use hand-written fixtures, not recorded live data, so check a real search after the first deployment.
  A card that does not exist in a language answers 404 and that language is left out. The search returns brief cards (id,
  number, name, image) and at most 50 hits; narrow a broad name down with the card id. Which prices exist depends on the
  card, so a card may have none.
- Every card is requested once per stored language (`de`, `en`, `ja` for Pokémon). If the API answers a German request for an untranslated card
  with the English card instead of "not found", that copy is detected (same name and text as the English one) and not
  stored as a German translation.
- The set browser and the Japanese data are not yet checked against the live TCGdex API (it is not reachable from the
  development environment). Some set symbols were found to be missing (HTTP 400), so only the logo is shown; images in the set picker fall
  back to png and then to an empty box. Assumptions to verify after deploying: set logos are served as `<url>.webp`, the brief
  set list contains `cardCount`, `localId` is padded as printed (`040`), and the Japanese categorical values match the
  mapping in `server/tcg/tcgdex/normalize.ts`.

## Roadmap

- Scheduler container for periodic price refresh (`node-cron`)
- Export as PDF, CSV and Markdown
- Pokémon: a list price that depends on the variant (holo and reverse holo have their own prices), paging through the search
  results, more filters (set, illustrator, regulation mark)

## License

[PolyForm Noncommercial License 1.0.0](LICENSE): free to use, copy and change for any noncommercial purpose (private use,
hobby, research, education, charitable and similar organizations); commercial use is not permitted. The license is not
an open source license in the sense of the OSI. The copyright notice that has to be passed on with the software is in
[`NOTICE`](NOTICE).

Versions released before this change were published under the GNU AGPL v3 and stay available under it for everybody
who received them.
