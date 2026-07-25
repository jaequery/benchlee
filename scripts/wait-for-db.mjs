// Exit 0 as soon as Postgres accepts a query; exit 1 otherwise.
// The container entrypoint loops on this.
import { withClient } from "./db.mjs";

try {
  await withClient((c) => c.query("SELECT 1"));
  process.exit(0);
} catch {
  process.exit(1);
}
