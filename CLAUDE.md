# DrugInteractionPanel — React Project Contract

## What this project is

A React 18 + TypeScript + Vite component that gives clinicians a visual drug interaction
review panel. Accepts a patient ID and a proposed medication; fetches the patient's active
medications from Medplum's FHIR API; calls the drug interaction backend; renders findings
with severity badges and an acknowledgment button.

## Scaffold commands (run these if src/ does not exist yet)

```bash
npm create vite@latest src/DrugInteractionUI -- --template react-ts
cd src/DrugInteractionUI
npm install
npm install @medplum/core @medplum/react
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
cd ../..
```

Add to `src/DrugInteractionUI/package.json` scripts:
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "test": "vitest",
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0"
  }
}
```

Add to `src/DrugInteractionUI/vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: { globals: true, environment: 'jsdom', setupFiles: './src/test/setup.ts' },
})
```

## Directory layout

```
src/DrugInteractionUI/
  src/
    components/          React components (PascalCase, .tsx)
    hooks/               Custom hooks (camelCase, useXxx.ts)
    types/               TypeScript interfaces (index.ts or named files)
    mocks/               MSW handlers + mock FHIR data
    test/
      setup.ts           vitest setup (import @testing-library/jest-dom)
tests/DrugInteractionUI.Tests/   (if separate test project needed)
```

## Naming conventions

- Components: `DrugInteractionPanel.tsx`, `InteractionSeverityBadge.tsx`
- Hooks: `useInteractionCheck.ts`, `usePatientMedications.ts`
- Test files: co-located — `DrugInteractionPanel.test.tsx` next to the component
- Types: `src/types/index.ts` — all shared interfaces here

## Key component contract — do not change the props signature

```typescript
export interface ProposedMedication {
  rxNormCode: string;
  name: string;
}

export interface DrugInteractionPanelProps {
  patientId: string;
  proposedMedication: ProposedMedication;
  apiBaseUrl?: string;       // defaults to '/api'
  onAcknowledge?: () => void;
}
```

## Four required visual states

```
Loading       — spinner or skeleton while fetching
NoInteractions — green banner: "No interactions found"
HasInteractions — list of interaction cards grouped by severity (major first)
Error          — red banner: "Unable to check interactions. Please try again."
```

Each interaction card must show:
- Severity badge (color-coded: major=red, moderate=amber, minor=yellow)
- `conflictingMedication` name
- `mechanism` text
- `consequence` text
- `recommendedAction` text

## API integration

```
GET  medplum FHIR: MedicationRequest?patient={patientId}&status=active
POST /api/drug-interactions/check
     Body: { patientContext: { medications: [...], allergies: [], demographics: {...} },
             proposedMedication: { rxNormCode, name } }
     200: { interactions: Interaction[] }
     503: DrugServiceUnavailableException → show Error state
```

## Quality gate commands

Run from `src/DrugInteractionUI/` (the Vite project root):

```bash
npm run build
npm test -- --run
npm run lint
```

All three must pass before signaling completion.

## Rules

1. No `any` types in component props or hook return values — TypeScript strict mode only.
2. Never call Medplum FHIR API in tests — use MSW handlers for all network interception.
3. All 4 visual states must be covered by tests.
4. The `AcknowledgeButton` must be present when `HasInteractions` state is shown.
5. Keep each component ≤ 80 lines — extract sub-components if needed.

## Context docs available

See `harness-context/context-map.md` — read that index first, then read only the docs
relevant to your current task.
