#!/bin/sh
# Applies pending database migrations, then starts the given command (the web server by default).
set -eu

if [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
  echo "Applying database migrations ..."
  (cd /opt/migrate && ./node_modules/.bin/prisma migrate deploy)
fi

exec "$@"
