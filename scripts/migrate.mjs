// Forward-only SQL migration runner.
//
//   node scripts/migrate.mjs           apply every pending migration
//   node scripts/migrate.mjs --reset   drop the public schema first (destructive)
//
// Each file in db/migrations is applied once, inside a transaction, and recorded
// in schema_migrations. Re-running is a no-op, so the container entrypoint can
// call it on every boot.
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { withClient, log } from "./db.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "db", "migrations");
const reset = process.argv.includes("--reset");

await withClient(async (client) => {
  if (reset) {
    log("--reset: dropping schema public");
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const { rows } = await client.query("SELECT version FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.version));

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(join(migrationsDir, file), "utf8");
    log(`applying ${file}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (version) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");
      count += 1;
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`migration ${file} failed: ${err.message}`, { cause: err });
    }
  }

  log(count === 0 ? "schema already up to date" : `applied ${count} migration(s)`);
});
