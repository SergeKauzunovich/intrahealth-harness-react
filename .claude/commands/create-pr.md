Create a pull request for the completed work in the current worktree.

---

## Steps

### 1. Read state files

```bash
WORKTREE=$(cat .claude/current-worktree)
ISSUE=$(cat .claude/current-issue)
```

### 2. Parse the JSONL log

Read `logs/issue-${ISSUE}.jsonl` to extract:
- Number of quality gate entries (lines where `"stage":"gate"`)
- Whether the final test run passed (`"exit_code":0` on an `npm test` entry)
- Session count

### 3. Stage and commit all changes in the worktree

```bash
git -C "$WORKTREE" add -A
git -C "$WORKTREE" commit -m "feat: DrugInteractionPanel React component (AI-generated, closes #${ISSUE})"
```

### 4. Push the branch (skip if no remote is configured)

```bash
git -C "$WORKTREE" push -u origin "feature/issue-${ISSUE}"
```

If `git remote` returns empty, note in the PR body: "Branch not pushed — local demo run."

### 5. Create the PR

```bash
gh pr create \
  --title "feat: DrugInteractionPanel React component (issue #${ISSUE})" \
  --body "$(cat <<'EOF'
## What this does

Implements the DrugInteractionPanel React component — accepts a patient ID and a proposed
medication; fetches active MedicationRequest FHIR resources via Medplum SDK; calls the drug
interaction backend API; renders 4 visual states (loading, no interactions, has interactions,
error) with severity badges and a clinician acknowledgment button.

## Quality gates

- [x] npm run build (TypeScript strict)
- [x] npm test -- --run (Vitest + RTL)
- [x] npm run lint (ESLint)

## AI generation metadata

- Gate attempts: [N — from JSONL log]
- Judge assessment: COMPLETE / GAPS [fill in]
- Run log: logs/issue-[N].jsonl

## Known gaps

[From judge concerns, or "None"]
EOF
)" \
  --base master \
  --head "feature/issue-${ISSUE}"
```

Fill in the `[N]` placeholders from the JSONL data before running.

### 6. Clean up the worktree

```bash
git worktree remove "$WORKTREE"
```

### 7. Report

Print the PR URL returned by `gh pr create`, or the branch name if no GitHub remote.
