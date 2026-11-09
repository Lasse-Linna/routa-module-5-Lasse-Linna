---
name: verify
description: Check whether the MCP server is done. Use after each build step, and before saying the work is done.
---

Run the checks below. Report each failing check with its error, or say that every check passed. Don't fix anything here, and don't reset anything.

## Input

- **Criteria file:** the file the security judge reads the server against. It defaults to `client/security-criteria.md`. If the user or a calling skill names another file, use that one instead. Nothing else in this skill depends on what the file says, so it can be swapped.

## The checks

1. **The tests pass:** `npm test`.
2. **A live run, as IT would:** `npm run live-check`, with the test environment running. It takes the two tokens from `ROUTA_TOKEN` and `ROUTA_READONLY_TOKEN`, which are already in the environment. Don't read the token files.
3. **The security judge finds nothing high or critical:** start a fresh agent with the Agent tool (`general-purpose`, not a fork), so it carries none of this session's context and didn't build the server. Brief it with the criteria file's path, and with this instruction, word for word apart from the path:

   > You are a security judge for an MCP server. You did not build it. Read the server's code in `mcp/src` (every file, including `mcp/src/tools`) against the criteria in `<criteria file>`. Read the criteria file in full first and judge by its rules, not your own. For every finding, give: a rating of exactly one of `low`, `medium`, `high` or `critical`, as the criteria define them; the file and line, with the line quoted; the rule it breaks; and one sentence on why. A finding without a file, line and quote doesn't count. Don't fix anything and don't edit any file. Don't read token files, `.env*`, `test-environment/.data` or anything under `~/.routa`, and never print a token's value. If you find nothing, say so, and say which files you read. End with one line: `VERDICT: FAIL` if any finding is high or critical, otherwise `VERDICT: PASS`.

   Report the judge's findings as it returned them, ranked most severe first. The check fails if any finding is high or critical, whatever the judge's own verdict line says. Low and medium findings are listed but don't fail the check. If the judge returns a finding without a quoted file and line, or no ratings, send it back rather than accepting it.
