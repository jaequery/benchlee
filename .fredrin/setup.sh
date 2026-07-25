#!/bin/sh
# Bootstrap a fresh Benchlee worktree. Fredrin runs this once per new worktree.
# Idempotent by design — safe to re-run.
set -e

echo "[setup] installing dependencies"
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile || pnpm install

if [ ! -f .env ]; then
  echo "[setup] creating .env from .env.example"
  cp .env.example .env
fi

# The database is optional at setup time: `pnpm build` never connects, and
# `docker compose up` provisions Postgres itself. Only migrate/seed if a
# database happens to be reachable already.
if command -v docker >/dev/null 2>&1 && docker compose ps db 2>/dev/null | grep -q "healthy"; then
  echo "[setup] postgres is up — migrating and seeding"
  DATABASE_URL="${DATABASE_URL:-postgres://benchlee:benchlee@localhost:5432/benchlee}" \
    node scripts/migrate.mjs && node scripts/seed.mjs
else
  echo "[setup] no running postgres; run 'docker compose up' to start the full stack"
fi

echo "[setup] done"
