// Every change is shown before it is applied: a tool that calls patchSettings
// must also call showChange. apply-change.ts is exempt: it applies a change
// that preview-change already showed.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = "mcp/src/tools";
const exempt = new Set(["apply-change.ts"]);
const calls = (code: string, name: string) => new RegExp(`\\b${name}\\s*\\(`).test(code);

const failures: string[] = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts") && !exempt.has(f)).sort()) {
  const code = readFileSync(join(dir, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  if (calls(code, "patchSettings") && !calls(code, "showChange")) {
    failures.push(`${join(dir, file)}: calls patchSettings without calling showChange`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("lint: every tool that applies a change shows it first");
