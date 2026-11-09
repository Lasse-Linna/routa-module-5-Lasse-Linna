// PreToolUse hook: refuse any change to mcp/src/token-check.ts.
// Exit 2 blocks the tool call and shows stderr to Claude.
const PROTECTED = /token-check\.ts/;

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
const input = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
const tool: string = input.tool_name ?? "";
const args = input.tool_input ?? {};

function block(why: string): never {
  console.error(`Blocked: ${why}. mcp/src/token-check.ts is protected and must not be changed.`);
  process.exit(2);
}

// A shell segment writes to the file if the file is a redirect target, or the
// target/subject of a command that modifies files. Commands that only mention
// it (git add, cat, grep, ...) pass.
function segmentWrites(segment: string): boolean {
  if (!PROTECTED.test(segment)) return false;
  if (/>>?\s*["']?\S*token-check\.ts/.test(segment)) return true;
  const words = segment.trim().split(/\s+/);
  let i = 0;
  while (i < words.length && (/^\w+=/.test(words[i]) || words[i] === "sudo" || words[i] === "env")) i++;
  const cmd = (words[i] ?? "").replace(/^.*\//, "");
  const rest = words.slice(i + 1);
  const last = rest[rest.length - 1] ?? "";
  if (["tee", "rm", "mv", "truncate", "shred", "unlink", "ed", "ex"].includes(cmd)) return true;
  if (["cp", "install", "ln"].includes(cmd)) return PROTECTED.test(last);
  if (["sed", "perl", "ruby"].includes(cmd)) return rest.some((w) => /^-\w*i/.test(w) || w.startsWith("--in-place"));
  if (cmd === "dd") return rest.some((w) => w.startsWith("of=") && PROTECTED.test(w));
  if (cmd === "git") return rest.some((w) => ["checkout", "restore", "apply", "stash", "reset", "rm", "mv", "clean"].includes(w));
  // Inline scripts or interpreters that open the file for writing.
  if (/\b(writeFile|appendFile|createWriteStream|rename|unlink|copyFile|truncate|open\s*\([^)]*['"][wa+])/.test(segment)) return true;
  return false;
}

if (["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(tool)) {
  const path: string = args.file_path ?? args.notebook_path ?? "";
  if (PROTECTED.test(path)) block(`${tool} on ${path}`);
} else if (tool === "Bash") {
  const command: string = args.command ?? "";
  for (const segment of command.split(/&&|\|\||;|\||\n/)) {
    if (segmentWrites(segment)) block(`shell command writes to the file (${segment.trim()})`);
  }
}
process.exit(0);
