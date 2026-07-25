// Shared Postgres helper for the ops scripts (migrate / seed / wait / bench run).
// Plain .mjs on purpose: these run inside the slim production image, which has no
// TypeScript toolchain — only the traced `pg` dependency from the Next.js build.
import pg from "pg";

export function connectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env, or run via `docker compose up`.",
    );
  }
  return url;
}

export async function withClient(fn) {
  const client = new pg.Client({ connectionString: connectionString() });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export function log(...args) {
  console.log("[benchlee]", ...args);
}
