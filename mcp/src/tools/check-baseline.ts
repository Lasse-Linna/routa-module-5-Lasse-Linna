import { readFileSync } from "node:fs";
import { getSettings } from "../platform.ts";
import type { Settings } from "../platform.ts";
import { requireToken } from "../token-check.ts";

type Baseline = { access: Record<string, string[]>; policies: Record<string, boolean | number | string> };

const say = (value: unknown) => (typeof value === "string" ? `"${value}"` : String(value));

// Compares the settings with the baseline and says each difference in plain words. Changes nothing.
export function differences(settings: Settings, baseline: Baseline): string[] {
  const lines: string[] = [];
  for (const { group, apps } of settings.access) {
    const wanted = baseline.access[group];
    if (!wanted) {
      lines.push(`${group} is not in the baseline, but it reaches ${apps.length ? apps.join(", ") : "nothing"}.`);
      continue;
    }
    for (const app of apps.filter((a) => !wanted.includes(a))) lines.push(`${group} can reach ${app}, but the baseline says it should not.`);
    for (const app of wanted.filter((a) => !apps.includes(a))) lines.push(`${group} cannot reach ${app}, but the baseline says it should.`);
  }
  for (const group of Object.keys(baseline.access)) {
    if (!settings.access.some((a) => a.group === group)) lines.push(`${group} is in the baseline but not on the platform.`);
  }
  for (const { id, label, value } of settings.policies) {
    if (!(id in baseline.policies)) lines.push(`${label} (${id}) is not in the baseline; it is ${say(value)}.`);
    else if (baseline.policies[id] !== value) lines.push(`${label} (${id}) is ${say(value)}, but the baseline says ${say(baseline.policies[id])}.`);
  }
  for (const id of Object.keys(baseline.policies)) {
    if (!settings.policies.some((p) => p.id === id)) lines.push(`${id} is in the baseline but not on the platform.`);
  }
  return lines;
}

export function readBaseline(): Baseline {
  return JSON.parse(readFileSync(new URL("../../../client/security-baseline.json", import.meta.url), "utf8"));
}

export const checkBaselineTool = {
  name: "check_baseline",
  description: "Read-only. List every setting that differs from Routa's security baseline, in plain words. Works with a read-only token and changes nothing.",
  inputSchema: { type: "object", properties: {} },
  async handler() {
    await requireToken();
    const lines = differences(await getSettings(), readBaseline());
    if (!lines.length) return "Every setting matches the baseline.";
    return `${lines.length} settings differ from the baseline:\n${lines.map((l) => `- ${l}`).join("\n")}`;
  },
};
