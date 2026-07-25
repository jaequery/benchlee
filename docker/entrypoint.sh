#!/bin/sh
# Benchlee container entrypoint: wait for Postgres, migrate, seed, then exec the app.
# Every step is idempotent, so restarting the container is always safe.
set -e

echo "[benchlee] waiting for postgres..."
attempt=0
until node scripts/wait-for-db.mjs; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "[benchlee] postgres did not become ready in time" >&2
    exit 1
  fi
  sleep 1
done

echo "[benchlee] applying migrations..."
node scripts/migrate.mjs

if [ "${BENCHLEE_AUTO_SEED:-1}" = "1" ]; then
  echo "[benchlee] seeding benchmark data..."
  node scripts/seed.mjs
else
  echo "[benchlee] BENCHLEE_AUTO_SEED=0, skipping seed"
fi

echo "[benchlee] starting app on :${PORT:-3000}"
exec "$@"
