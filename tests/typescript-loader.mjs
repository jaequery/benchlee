// Test-only TS/TSX loader; production still uses Next's compiler.
import { readFile, access } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import ts from "typescript";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/link" || specifier === "next/navigation") return nextResolve(`${specifier}.js`, context);
  if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
  if (specifier.startsWith("@/")) specifier = pathToFileURL(`${process.cwd()}/src/${specifier.slice(2)}`).href;
  if (specifier.startsWith(".") || specifier.startsWith("file:")) {
    const base = new URL(specifier, context.parentURL);
    for (const suffix of ["", ".ts", ".tsx"]) {
      const url = new URL(base.href + suffix);
      try { await access(url); return { url: url.href, shortCircuit: true }; } catch { /* Try next extension. */ }
    }
  }
  return nextResolve(specifier, context);
}
export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) return { format: "module", source: `export default ${await readFile(new URL(url), "utf8")}`, shortCircuit: true };
  if (/\.tsx?$/.test(url)) return {
    format: "module", shortCircuit: true,
    source: ts.transpileModule(await readFile(new URL(url), "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
  };
  return nextLoad(url, context);
}
