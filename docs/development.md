# Trying out a branch

Nothing is installed on the host for development; see [Development](../README.md#development) for the `make` targets.

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
