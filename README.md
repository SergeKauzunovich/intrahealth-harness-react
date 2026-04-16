# AI Engineering Harness — Track B (React / Medplum)

An autonomous AI engineering harness that takes a GitHub Issue and produces a pull request
containing a React/TypeScript UI component. Same architecture as Track A (.NET) — hooks,
commands, specialist agent, progressive disclosure context — adapted for a frontend stack
(Vite, Vitest, MSW, Prettier instead of dotnet).

**Live repo:** https://github.com/SergeKauzunovich/intrahealth-harness-react
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
  2. git worktree add worktrees/issue-N -b feature/issue-N
  3. Load L1 context: CLAUDE.md + context-map.md
  4. Load L2 context: medplum-types, ui-builder-example, react-testing-patterns, mock-fhir-data
  5. Spawn react-ui-builder agent → works in worktree until build + tests pass
  6. /judge evaluates completeness (fresh context, no memory of generation)
  7. If gaps → retry react-ui-builder with gap list (max 3 attempts)
  8. /create-pr assembles metadata + opens PR
  9. git worktree remove (cleanup)
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
    validate-write-path.sh      ← block outside-worktree writes (verbatim from Track A)
    block-destructive.sh        ← block destructive commands (verbatim from Track A)
    log-bash-output.sh          ← npm gate results → JSONL (adapted: npm vs dotnet)
    format-ts-files.sh          ← Prettier on .ts/.tsx edits (adapted: replaces dotnet format)
    on-stop.sh                  ← session-end JSONL entry (verbatim from Track A)
  commands/
    harness.md                  ← /harness <issue-url>
    judge.md                    ← /judge — checks 14-point React acceptance checklist
    create-pr.md                ← /create-pr
  agents/
    react-ui-builder.md         ← specialist agent (implements the React component)
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
.github/
  workflows/
    harness.yml                 ← GitHub Actions trigger
tests/
  test-hooks.sh                 ← 11 unit tests for hook scripts
  fixtures/
    issue-1.json                ← local demo issue
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

The Track B context challenge: Medplum's React SDK is non-trivial. The harness delivers
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

## Quality gates

```bash
cd src/DrugInteractionUI
npm run build        # TypeScript strict — zero errors
npm test -- --run    # Vitest, all tests pass
npm run lint         # ESLint, zero warnings
```

**No `any` types allowed.** TypeScript strict mode is enforced by `npm run build`.

---

## Differences from Track A

| Aspect | Track A (.NET) | Track B (React) |
|--------|----------------|-----------------|
| Stack | .NET 8, xUnit, dotnet format | Vite, Vitest, Prettier |
| log hook | watches `dotnet (build\|test\|format)` | watches `npm (build\|test\|run)` |
| format hook | `dotnet format` on `.cs` | `npx prettier` on `.ts/.tsx` |
| Agent | `drug-checker.md` | `react-ui-builder.md` |
| Scaffold | `dotnet new webapi` | `npm create vite@latest` |
| Network mock | WebApplicationFactory DI override | MSW (Mock Service Worker) |
| Context docs | C# types + xUnit patterns | TS types + RTL + FHIR shapes |
| Verbatim hooks | `validate-write-path.sh`, `block-destructive.sh`, `on-stop.sh` | Same 3 scripts |

---

## Observability

```json
{"ts":"2026-04-16T15:01:12Z","stage":"gate","cmd":"npm run build","exit_code":0}
{"ts":"2026-04-16T15:01:28Z","stage":"gate","cmd":"npm test -- --run","exit_code":1}
{"ts":"2026-04-16T15:03:45Z","stage":"gate","cmd":"npm test -- --run","exit_code":0}
{"ts":"2026-04-16T15:03:49Z","stage":"gate","cmd":"npm run lint","exit_code":0}
{"ts":"2026-04-16T15:03:51Z","stage":"stop","message":"Claude Code session ended"}
```
