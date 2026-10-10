#!/bin/sh
# Shows which version starts, applies pending database migrations, then starts the given command (the web server by default).
set -eu

# The version is the one of the build (package.json at the release); only the release workflow builds with BUILD_KIND=release.
APP_DIR="${APP_DIR:-/app}"
VERSION="$(node -p "require('$APP_DIR/.output/server/package.json').version" 2>/dev/null || echo unknown)"
case "${BUILD_KIND:-local}" in
  release) KIND="Release image" ;;
  *) KIND="Local build (may be newer than the version)" ;;
esac
RULE="  ──────────────────────────────────────────────"
echo
echo "$RULE"
echo "   Cardkeeper  v$VERSION"
echo "   $KIND"
echo "   Node $(node -v) · $(uname -m) · started $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "$RULE"
echo

if [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
  echo "Applying database migrations ..."
  (cd /opt/migrate && ./node_modules/.bin/prisma migrate deploy)
fi

exec "$@"
