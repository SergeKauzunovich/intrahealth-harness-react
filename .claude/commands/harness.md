You are the AI harness orchestrator. Your job is to take a GitHub Issue and produce a
pull request by coordinating the react-ui-builder agent, the judge, and quality gates.

Arguments: $ARGS (GitHub issue URL like https://github.com/org/repo/issues/42, or "issue-42" for local demo)

---

## Steps

### 1. Parse the issue number

Extract the numeric ID from $ARGS:
- From URL: last path segment (e.g. ".../issues/42" → "42")
- From "issue-42" format: strip "issue-"

Write it: `echo "42" > .claude/current-issue`

### 2. Fetch the issue body

If $ARGS is a GitHub URL:
```bash
gh issue view 42 --json title,body,number
```

If running locally (demo mode) — check for a fixture file:
```bash
cat tests/fixtures/issue-42.json
```
If neither exists, stop and report: "No issue source found for issue #42."

### 3. Create a git worktree

```bash
git worktree add worktrees/issue-42 -b feature/issue-42 master
echo "$(pwd)/worktrees/issue-42" > .claude/current-worktree
```

If the branch already exists: `git worktree add worktrees/issue-42 feature/issue-42`

### 4. Load L1 context

Read `CLAUDE.md` and `harness-context/context-map.md`. These are always injected.

### 5. Identify relevant L2 docs + observations

From the context-map, select which pattern docs apply to this ticket. For a React UI
component ticket, all four L2 docs are relevant:
- harness-context/patterns/medplum-types.md
- harness-context/patterns/ui-builder-example.md
- harness-context/patterns/react-testing-patterns.md
- harness-context/examples/mock-fhir-data.md

Also check the `observations/` directory:
```bash
ls observations/*.md 2>/dev/null
```
If any observation files exist, read them all. They contain lessons from previous runs
that the agent must know before it writes any setup or scaffold code.

### 6. Spawn the react-ui-builder agent

Use the Agent tool to spawn `react-ui-builder`. Pass it:
- The full issue title and body
- The content of CLAUDE.md
- The content of harness-context/context-map.md
- The content of all four L2 docs
- The content of all observation files (if any exist in `observations/`)
- The absolute path to the worktree as its working directory
- This explicit instruction: **"Do not signal completion until `npm run build` and
  `npm test -- --run` both pass. Run them yourself and self-correct on failures."**

### 7. Spawn the improvement-agent

After the react-ui-builder returns, spawn the `improvement-agent`. Pass it:
- The react-ui-builder's full completion report
- The worktree path
- The absolute path to the `observations/` directory

The improvement-agent will create or update files in `observations/` for any
systemic issues the react-ui-builder had to fix.

### 8. Run /code-annotator

After the improvement-agent returns, invoke `/code-annotator` with the path to
the worktree's source directory:

```bash
<worktree>/src/DrugInteractionUI/src
```

This adds JSDoc to all exported TypeScript symbols. Verify `npm run build` still
passes after annotation.

### 9. Evaluate completeness with /judge

When annotation is complete, invoke `/judge` with:
- The original ticket acceptance criteria (from the issue body)
- The worktree path

Track attempt count (starts at 1).

### 10. Handle judge result

**If `complete: true`:** proceed to step 11.

**If `complete: false` and attempts < 3:**
- Re-run the react-ui-builder (step 6) with the judge's `missing` and `concerns` appended:
  "Known gaps from previous attempt: [judge.missing]. Address all of these."

**If attempts = 3 and still incomplete:**
```bash
gh issue edit 42 --add-label "needs-human-review"  # skip if no GitHub
```
Proceed to step 11 with the PR marked as draft.

### 11. Create the PR

Invoke `/create-pr`.

### 12. Clean up

```bash
rm -f .claude/current-issue .claude/current-worktree
```

Report the PR URL to the user (or worktree path if running locally without GitHub).
