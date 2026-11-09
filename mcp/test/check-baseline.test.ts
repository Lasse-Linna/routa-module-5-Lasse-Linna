import assert from "node:assert/strict";
import { test } from "node:test";
import { checkBaselineTool, differences } from "../src/tools/check-baseline.ts";
import { fakePlatform } from "./fake-platform.ts";

const settings = {
  access: [
    { group: "contractors", apps: ["timesheets", "finance"] },
    { group: "staff", apps: ["documents"] },
  ],
  policies: [
    { id: "session-length-hours", label: "Session length in hours", value: 24 },
    { id: "guest-access", label: "Guest access", value: "open" },
  ],
};
const baseline = {
  access: { contractors: ["timesheets"], staff: ["documents", "timesheets"], ghosts: [] },
  policies: { "session-length-hours": 8, "guest-access": "open", "legacy-sign-in": false },
};

test("differences says each one in plain words", () => {
  assert.deepEqual(differences(settings, baseline), [
    "contractors can reach finance, but the baseline says it should not.",
    "staff cannot reach timesheets, but the baseline says it should.",
    "ghosts is in the baseline but not on the platform.",
    "Session length in hours (session-length-hours) is 24, but the baseline says 8.",
    "legacy-sign-in is in the baseline but not on the platform.",
  ]);
});

test("check_baseline works with a read-only token and changes nothing", async () => {
  const { patches } = fakePlatform("read");
  const answer = await checkBaselineTool.handler();
  assert.match(answer, /settings differ from the baseline/);
  assert.equal(patches.length, 0);
});

test("check_baseline needs a valid token", async () => {
  fakePlatform();
  globalThis.fetch = (async () => Response.json({ detail: "bad token" }, { status: 401 })) as typeof fetch;
  await assert.rejects(checkBaselineTool.handler(), /401/);
});
