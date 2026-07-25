// Runs a real benchmark against provider APIs and stores the artifacts.
//
//   pnpm bench:run                          all tasks x all models with keys set
//   pnpm bench:run --task saas-pricing      one task
//   pnpm bench:run --model claude-opus-5    one model
//   pnpm bench:run --dry-run                show what would run, call nothing
//
// Rows written here carry provenance='live' and render without the Demo badge.
// The script NEVER fabricates a result: with no API key for a provider, that
// provider's models are skipped and reported, not filled in.
//
// Model -> API wiring lives in PROVIDERS below. The `api_model` for each catalog
// model is read from db/seed/models.runtime.json so you can point a catalog
// entry at whatever model id your account actually has access to.
import { readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { withClient, log } from "./db.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const seedDir = join(here, "..", "db", "seed");

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : (args[i + 1] ?? "");
};
const dryRun = args.includes("--dry-run");
const onlyTask = flag("task");
const onlyModel = flag("model");

// --------------------------------------------------------------------------
// Providers. Each returns { text, inputTokens, outputTokens } or throws.
// --------------------------------------------------------------------------
const PROVIDERS = {
  anthropic: {
    envKey: "ANTHROPIC_API_KEY",
    async call({ apiModel, prompt, apiKey }) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: apiModel,
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return {
        text: (data.content ?? [])
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join(""),
        inputTokens: data.usage?.input_tokens ?? null,
        outputTokens: data.usage?.output_tokens ?? null,
      };
    },
  },

  openai: {
    envKey: "OPENAI_API_KEY",
    async call({ apiModel, prompt, apiKey }) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: apiModel,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`openai ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return {
        text: data.choices?.[0]?.message?.content ?? "",
        inputTokens: data.usage?.prompt_tokens ?? null,
        outputTokens: data.usage?.completion_tokens ?? null,
      };
    },
  },

  google: {
    envKey: "GOOGLE_API_KEY",
    async call({ apiModel, prompt, apiKey }) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        apiModel,
      )}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!res.ok) throw new Error(`google ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return {
        text: (data.candidates?.[0]?.content?.parts ?? [])
          .map((p) => p.text ?? "")
          .join(""),
        inputTokens: data.usageMetadata?.promptTokenCount ?? null,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? null,
      };
    },
  },
};

/** Models often wrap a file in ```html fences. Strip them; keep everything else. */
function extractHtml(text) {
  const fenced = text.match(/```(?:html?)?\s*\n([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  return body;
}

function publicId(prefix) {
  return `${prefix}_${createHash("sha256")
    .update(randomUUID())
    .digest("hex")
    .slice(0, 10)}`;
}

// --------------------------------------------------------------------------

let runtimeMap = {};
try {
  runtimeMap = JSON.parse(
    await readFile(join(seedDir, "models.runtime.json"), "utf8"),
  );
} catch {
  log("no db/seed/models.runtime.json — every model will be skipped");
}

await withClient(async (client) => {
  const { rows: models } = await client.query(
    `SELECT id, slug, name FROM models ${onlyModel ? "WHERE slug = $1" : ""} ORDER BY position`,
    onlyModel ? [onlyModel] : [],
  );
  const { rows: tasks } = await client.query(
    `SELECT id, slug, title, prompt FROM tasks ${onlyTask ? "WHERE slug = $1" : ""} ORDER BY position`,
    onlyTask ? [onlyTask] : [],
  );

  if (models.length === 0 || tasks.length === 0) {
    log("nothing to run (check --task / --model and that the DB is seeded)");
    return;
  }

  let ran = 0;
  let skipped = 0;
  let failed = 0;

  for (const model of models) {
    const wiring = runtimeMap[model.slug];
    if (!wiring) {
      log(`skip ${model.slug}: no entry in models.runtime.json`);
      skipped += tasks.length;
      continue;
    }
    const provider = PROVIDERS[wiring.provider];
    if (!provider) {
      log(`skip ${model.slug}: unknown provider '${wiring.provider}'`);
      skipped += tasks.length;
      continue;
    }
    const apiKey = process.env[provider.envKey];
    if (!apiKey) {
      log(`skip ${model.slug}: ${provider.envKey} is not set`);
      skipped += tasks.length;
      continue;
    }

    for (const task of tasks) {
      if (dryRun) {
        log(`would run ${model.slug} x ${task.slug} via ${wiring.provider}/${wiring.api_model}`);
        continue;
      }

      log(`running ${model.slug} x ${task.slug}...`);
      const startedAt = Date.now();
      let result;
      try {
        result = await provider.call({
          apiModel: wiring.api_model,
          prompt: task.prompt,
          apiKey,
        });
      } catch (err) {
        failed += 1;
        log(`  FAILED: ${err.message.slice(0, 200)}`);
        await client.query(
          `INSERT INTO runs (public_id, model_id, task_id, provenance, status, latency_ms, error_text)
           VALUES ($1,$2,$3,'live','error',$4,$5)`,
          [publicId("run"), model.id, task.id, Date.now() - startedAt, err.message.slice(0, 2000)],
        );
        continue;
      }

      const latency = Date.now() - startedAt;
      const html = extractHtml(result.text);
      if (!html) {
        failed += 1;
        log("  FAILED: model returned no usable content");
        continue;
      }

      const cost =
        wiring.usd_per_mtok_in != null && wiring.usd_per_mtok_out != null
          ? ((result.inputTokens ?? 0) * wiring.usd_per_mtok_in +
              (result.outputTokens ?? 0) * wiring.usd_per_mtok_out) /
            1_000_000
          : null;

      await client.query("BEGIN");
      try {
        const { rows } = await client.query(
          `INSERT INTO runs (public_id, model_id, task_id, provenance, status,
                             latency_ms, input_tokens, output_tokens, cost_usd, temperature)
           VALUES ($1,$2,$3,'live','ok',$4,$5,$6,$7,$8)
           RETURNING id`,
          [
            publicId("run"), model.id, task.id, latency,
            result.inputTokens, result.outputTokens, cost, wiring.temperature ?? null,
          ],
        );
        await client.query(
          `INSERT INTO artifacts (public_id, run_id, kind, title, content, byte_size)
           VALUES ($1,$2,'html',$3,$4,$5)`,
          [
            publicId("art"), rows[0].id, `${task.slug}.html`, html,
            Buffer.byteLength(html, "utf8"),
          ],
        );
        await client.query("COMMIT");
        ran += 1;
        log(`  ok — ${latency}ms, ${Buffer.byteLength(html, "utf8")} bytes`);
      } catch (err) {
        await client.query("ROLLBACK");
        failed += 1;
        log(`  FAILED to store: ${err.message}`);
      }
    }
  }

  log(`done — ${ran} stored, ${skipped} skipped (no key/wiring), ${failed} failed`);
  if (ran === 0 && !dryRun) {
    log(
      "No live runs were produced. Set provider API keys and wire models in db/seed/models.runtime.json.",
    );
  }
});
