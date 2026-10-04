#!/bin/sh
# Runs once, when the PostgreSQL data directory is initialized (see the postgres image docs).
# The application never connects as the superuser: it gets its own role that owns only its
# own database. CREATEDB (needed by `prisma migrate dev` for its shadow database) is granted
# in development only (APP_DB_DEV=1).
set -eu

role_options="NOCREATEDB"
if [ "${APP_DB_DEV:-0}" = "1" ]; then
  role_options="CREATEDB"
fi

psql -v ON_ERROR_STOP=1 \
  -v app_user="$APP_DB_USER" \
  -v app_password="$APP_DB_PASSWORD" \
  -v app_db="$APP_DB_NAME" \
  -v role_options="$role_options" \
  --username "$POSTGRES_USER" --dbname postgres <<'EOSQL'
CREATE ROLE :"app_user" LOGIN :role_options PASSWORD :'app_password';
CREATE DATABASE :"app_db" OWNER :"app_user";
EOSQL

# Separate database for the integration tests, which truncate all of their tables.
if [ "${APP_DB_DEV:-0}" = "1" ]; then
  psql -v ON_ERROR_STOP=1 \
    -v app_user="$APP_DB_USER" \
    -v test_db="${APP_DB_NAME}_test" \
    --username "$POSTGRES_USER" --dbname postgres <<'EOSQL'
CREATE DATABASE :"test_db" OWNER :"app_user";
EOSQL
fi
