import { Pool, type QueryResultRow } from "pg";

// A single pool per Node process. In dev, Next.js hot-reloads modules, so the
// pool is parked on globalThis to avoid leaking a new pool on every reload.
const globalForPg = globalThis as unknown as { benchleePool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Run `docker compose up`, or copy .env.example to .env.",
    );
  }
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  });
}

export function pool(): Pool {
  if (!globalForPg.benchleePool) {
    globalForPg.benchleePool = createPool();
  }
  return globalForPg.benchleePool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
