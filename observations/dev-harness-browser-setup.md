---
skill: dev-harness-browser-setup
type: setup
applies-when: Running the DrugInteractionUI dev harness in the browser via `npm run dev`
---

## Problem 1 — App.tsx shows default Vite scaffold page

`npm run dev` renders "Edit src/App.tsx and save to test HMR" instead of the component.

### Root cause

The issue implementation generates `DrugInteractionPanel` but never updates `App.tsx` — the Vite default is left in place.

### Fix

Replace `App.tsx` with a scenario-switcher that imports and renders `DrugInteractionPanel` with the mock patientIds/rxNormCodes from `src/mocks/mockData.ts`.

---

## Problem 2 — MSW only set up for tests, not the browser

API calls in the browser go to real network and fail. No service worker is registered.

### Root cause

`src/mocks/handlers.ts` + vitest server setup exist, but there is no MSW browser worker.

### Fix

1. `npx msw init public/` — generates `public/mockServiceWorker.js`
2. Create `src/mocks/browser.ts` with `setupWorker(...)` and scenario-aware handlers
3. In `main.tsx`, add a `prepare()` function that starts the worker before rendering:

```ts
async function prepare() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(<App />)
})
```

---

## Problem 3 — Crash: `Cannot read properties of undefined (reading 'medplum')`

Thrown at `useInteractionCheck.ts` on every render. Stacktrace points into `@medplum/react`.

### Root cause

`useSearchResources` reads from a `MedplumContext` set by `MedplumProvider`. Without it the context is `undefined` and the hook crashes immediately.

### Fix

In `main.tsx`, instantiate `MedplumClient` and wrap the app:

```ts
import { MedplumClient } from '@medplum/core'
import { MedplumProvider } from '@medplum/react'

const medplum = new MedplumClient({ baseUrl: 'http://localhost:8103/' })

// inside prepare().then(...)
<MedplumProvider medplum={medplum}>
  <App />
</MedplumProvider>
```

MSW intercepts `*/fhir/R4/MedicationRequest` before any request reaches the network.

### Prevention

Any component using `@medplum/react` hooks needs `MedplumProvider` in both `main.tsx` (dev harness) and test render helpers (`renderWithMedplum`).
