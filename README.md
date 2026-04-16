# AI Engineering Harness — React / Medplum

An autonomous AI engineering harness that takes a GitHub Issue and produces a pull request
containing a React/TypeScript UI component. Built on Claude Code native primitives: hooks
enforce quality at every tool call, slash commands define the pipeline stages, and a specialist
sub-agent does the implementation work inside an isolated git worktree.

Just ask it to implement a feature and give it github or other project management software like Jira the issue link.

**Harness repo:** https://github.com/SergeKauzunovich/intrahealth-harness-react
**Work order (Issue #1):** https://github.com/SergeKauzunovich/intrahealth-harness-react-test/issues/1
**Work order:** DrugInteractionPanel — clinician-facing interaction review component

---

## How it works

```
GitHub Issue labeled 'ai-agent'
        │
        ▼
GitHub Actions (.github/workflows/harness.yml)
  claude --print "/harness <issue-url>"
        │
        ▼
/harness command orchestrates:
  1. Fetch issue body (GitHub API or local fixture)
  ⛔ STOP 1 — human confirms requirements understanding
  2. Load L1 + L2 context + observations
  3. Draft implementation plan → saved to implementation-plans/issue-N.md
  ⛔ STOP 2 — human confirms implementation plan
  4. git worktree add worktrees/issue-N -b feature/issue-N
  5. Spawn react-ui-builder agent → works in worktree until build + tests pass
  6. Spawn improvement-agent → captures self-corrections as observation files
  7. /code-annotator → adds JSDoc to all exported TypeScript symbols
  8. /judge evaluates completeness (fresh context, no memory of generation)
  9. If gaps → retry react-ui-builder with gap list (max 3 attempts)
  ⛔ STOP 3 — human confirms branch, base, file list before commit
 10. /create-pr assembles metadata + opens PR
 11. git worktree remove (cleanup)
```

Hooks fire at every tool call:
- **PreToolUse[Write]** — block writes outside the worktree
- **PreToolUse[Bash]** — block destructive commands
- **PostToolUse[Bash]** — log `npm build/test/run` results to JSONL
- **PostToolUse[Edit]** — auto-format `.ts/.tsx` files with Prettier
- **Stop** — append session end marker to JSONL

---

## File structure

```
.claude/
  settings.json                 ← hook wiring
  hooks/
    validate-write-path.sh      ← block outside-worktree writes
    block-destructive.sh        ← block destructive commands (rm -rf, git reset --hard, etc.)
    log-bash-output.sh          ← npm gate results → JSONL
    format-ts-files.sh          ← Prettier on .ts/.tsx edits
    on-stop.sh                  ← session-end JSONL entry
  commands/
    harness.md                  ← /harness <issue-url>
    judge.md                    ← /judge — checks 14-point React acceptance checklist
    create-pr.md                ← /create-pr
    code-annotator.md           ← /code-annotator — adds JSDoc to exported TS symbols
  agents/
    react-ui-builder.md         ← specialist agent (implements the React component)
    improvement-agent.md        ← captures self-corrections → writes observation files
  current-issue                 ← runtime state (gitignored)
  current-worktree              ← runtime state (gitignored)
CLAUDE.md                       ← React/TypeScript project contract (≤200 lines)
harness-context/
  context-map.md                ← progressive disclosure index
  patterns/
    medplum-types.md            ← TypeScript interfaces + Medplum SDK hook signatures
    ui-builder-example.md       ← component/hook skeleton + file layout
    react-testing-patterns.md   ← Vitest + RTL + MSW patterns
  examples/
    mock-fhir-data.md           ← 3 FHIR patient scenarios (none/moderate/major interaction)
observations/                   ← past-run lessons; loaded as context on every future run
  medplum-react-peer-deps.md    ← install Mantine suite + react-hooks with --legacy-peer-deps
  vitest-vite-config.md         ← import defineConfig from vitest/config; add vitest/globals types
  eslint-flat-config.md         ← ESLint 9 flat config: use eslint . not --ext
  react-hooks-setstate-in-effect.md ← don't call setState synchronously at effect top-level
  testing-library-dom.md        ← install @testing-library/dom explicitly
.github/
  workflows/
    harness.yml                 ← GitHub Actions trigger
tests/
  test-hooks.sh                 ← 11 unit tests for hook scripts
  fixtures/
    issue-1.json                ← local demo issue
implementation-plans/           ← saved at Checkpoint 2, confirmed before implementation starts
logs/                           ← JSONL per issue (gitignored)
worktrees/                      ← git worktrees (gitignored)
```

---

## Getting started

### Prerequisites

- [Claude Code CLI](https://claude.ai/code): `npm install -g @anthropic-ai/claude-code`
- Node.js 20+
- `ANTHROPIC_API_KEY` set

### Run against the local demo fixture

```bash
cd dev/react-harness
claude --print "/harness issue-1"
```

The harness reads `tests/fixtures/issue-1.json`, creates a worktree, scaffolds the Vite
project, and has the `react-ui-builder` agent implement the `DrugInteractionPanel` component.

### Run hook tests

```bash
bash tests/test-hooks.sh
# Results: 11 passed, 0 failed
```

### Trigger via GitHub Actions

Apply the `ai-agent` label to Issue #1 in this repo. The workflow fires, runs the harness,
and opens a PR with the implemented component.

---

## The component: DrugInteractionPanel

```typescript
interface DrugInteractionPanelProps {
  patientId: string;
  proposedMedication: { rxNormCode: string; name: string };
  apiBaseUrl?: string;       // defaults to '/api'
  onAcknowledge?: () => void;
}
```

Four visual states the agent must implement:

| State | `data-testid` | Condition |
|-------|---------------|-----------|
| Loading | `loading-state` | While fetching medications or calling API |
| No interactions | `no-interactions-state` | API returns `{ interactions: [] }` |
| Has interactions | `interactions-state` | API returns interactions |
| Error | `error-state` | API returns 503 or network failure |

The `HasInteractions` state shows severity badges (major=red, moderate=amber, minor=yellow),
mechanism text, consequence text, recommended action, and an acknowledge button.

---

## Context delivery — FHIR/Medplum cold-start

The Medplum context challenge: Medplum's React SDK is non-trivial. The harness delivers
structured context so the agent doesn't need to explore `node_modules` or docs:

**`medplum-types.md`** — Complete TypeScript type definitions: component props, FHIR
`MedicationRequest` shape, `useMedplum()` / `useSearchResources()` hook signatures,
helper functions for extracting medication name/code from FHIR resources.

**`mock-fhir-data.md`** — Three patient scenarios (no interactions, moderate, major) with
concrete `MedicationRequest` FHIR JSON that the agent can drop into `src/mocks/mockData.ts`.

**`react-testing-patterns.md`** — Complete test file template: MSW server setup, the
`renderWithMedplum()` wrapper, and five test cases ready to copy.

The agent never needs to discover Medplum's API structure — it's all pre-extracted and
delivered via the context map.

---

## Self-improving harness — observations

After every implementation, the `improvement-agent` runs and inspects what the
`react-ui-builder` had to fix. Any systemic problem — missing peer dep, wrong config key,
lint rule violation — becomes a file in `observations/`.

On the next run, the harness loads all observation files and passes them to the agent
before it writes a single line of setup code. The agent reads their **Prevention** sections
and applies them upfront.

The harness gets better with every run, without any human curation.

```
Run 1: agent hits 5 setup problems → improvement-agent creates 5 observation files
Run 2: agent reads observations → applies all prevention steps → 0 setup problems
Run 3: agent reads observations → any new problems → new observation files added
```

---

## Code annotation — /code-annotator

After the implementation agent finishes, `/code-annotator` adds JSDoc to every exported
TypeScript symbol in the generated code:

- Interfaces and type aliases — one-line description of the concept
- Hooks — `@param` per argument, `@returns` describing the discriminated union
- Components — one-line UI description
- MSW handler arrays and mock data exports — purpose description

Annotations are added before the judge evaluates, so the PR always ships documented code.

---

## Quality gates

```bash
cd src/DrugInteractionUI
npm run build        # TypeScript strict — zero errors
npm test -- --run    # Vitest, all tests pass
npm run lint         # ESLint, zero warnings
```

**No `any` types allowed.** TypeScript strict mode is enforced by `npm run build`.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node 20, Vite, React 19, TypeScript strict |
| Tests | Vitest + React Testing Library + MSW |
| Formatting | Prettier (auto-applied by hook on every `.ts/.tsx` edit) |
| Agent | `react-ui-builder.md` specialist |
| Scaffold | `npm create vite@latest src/DrugInteractionUI -- --template react-ts` |
| Network mock | MSW (Mock Service Worker) — no real calls in tests |
| FHIR context | Pre-extracted types + hook signatures in `medplum-types.md` |
| Self-improvement | `improvement-agent.md` → `observations/` — learned from each run |
| Documentation | `/code-annotator` — JSDoc on all exported TS symbols |

---

## Observability

```json
{"ts":"2026-04-16T15:01:12Z","stage":"gate","cmd":"npm run build","exit_code":0}
{"ts":"2026-04-16T15:01:28Z","stage":"gate","cmd":"npm test -- --run","exit_code":1}
{"ts":"2026-04-16T15:03:45Z","stage":"gate","cmd":"npm test -- --run","exit_code":0}
{"ts":"2026-04-16T15:03:49Z","stage":"gate","cmd":"npm run lint","exit_code":0}
{"ts":"2026-04-16T15:03:51Z","stage":"stop","message":"Claude Code session ended"}
```
