# React Harness — Context Map

Progressive disclosure index. Read this file first, then read only the docs you need.

---

## Available docs

### `patterns/medplum-types.md`
**Read if:** implementing the component, hooks, or TypeScript types.
Contains: `DrugInteractionPanelProps`, `ProposedMedication`, `Interaction`, `InteractionCheckResponse`,
Medplum FHIR resource shapes (`MedicationRequest`, `CodeableConcept`, `Coding`),
`useMedplum()` and `useSearchResources()` hook signatures.

### `patterns/ui-builder-example.md`
**Read if:** unsure about file layout, component structure, or how to wire Medplum hooks.
Contains: scaffold directory tree, skeleton `DrugInteractionPanel.tsx`, skeleton
`useInteractionCheck.ts` hook, corrected `vite.config.ts` and tsconfig snippets.

### `patterns/react-testing-patterns.md`
**Read if:** writing tests or setting up the Vitest + RTL + MSW test environment.
Contains: `renderWithMedplum()` helper, MSW handler setup for the drug interaction API,
test for each of the 4 visual states, naming convention examples.

### `examples/mock-fhir-data.md`
**Read if:** implementing mock data, writing test scenarios, or wiring MSW handlers.
Contains: 3 patient scenarios (no interactions, moderate, major), sample
`MedicationRequest` FHIR resources, expected `InteractionCheckResponse` for each scenario.

---

## Observations (past-run lessons)

### `observations/`
**Read before scaffolding.** Contains one `.md` file per systemic problem encountered in
previous runs. Each file has a **Prevention** section with exact commands or config to
apply upfront. The harness loads all observation files and passes them to you — apply
their prevention steps before you run the first `npm install`.

---

## How to use this map

The agent will:
1. Always read `CLAUDE.md` (already injected as L1 context)
2. Read this file to understand what's available
3. Read all observation files before writing any setup code
4. Pull L2 pattern docs only when relevant to the current implementation step
5. Never read all docs at once — pull what you need, when you need it
