# UI Builder — File Layout and Skeleton Implementation

Use this as your reference when choosing where to put files and how to structure the component.

---

## File layout after scaffold

```
src/DrugInteractionUI/
  src/
    types/
      index.ts                        ← all shared interfaces (from medplum-types.md)
    hooks/
      useInteractionCheck.ts          ← fetches medications + calls backend API
    components/
      DrugInteractionPanel.tsx        ← main component (≤80 lines)
      InteractionSeverityBadge.tsx    ← severity badge (major/moderate/minor)
      InteractionCard.tsx             ← single interaction entry
      DrugInteractionPanel.test.tsx   ← co-located test file
    mocks/
      handlers.ts                     ← MSW request handlers
      mockData.ts                     ← static FHIR mock resources
    test/
      setup.ts                        ← vitest setup (import jest-dom matchers)
  vite.config.ts
  tsconfig.json
  package.json
```

---

## Skeleton: `src/hooks/useInteractionCheck.ts`

```typescript
import { useState, useEffect } from 'react';
import { useSearchResources } from '@medplum/react';
import type {
  DrugInteractionPanelProps,
  Interaction,
  InteractionCheckResponse,
  CheckInteractionRequest,
} from '../types';

export type InteractionState =
  | { status: 'loading' }
  | { status: 'no-interactions' }
  | { status: 'has-interactions'; interactions: Interaction[] }
  | { status: 'error'; message: string };

export function useInteractionCheck(
  patientId: string,
  proposedMedication: DrugInteractionPanelProps['proposedMedication'],
  apiBaseUrl = '/api'
): InteractionState {
  const [state, setState] = useState<InteractionState>({ status: 'loading' });

  const [medications, medsLoading] = useSearchResources('MedicationRequest', {
    patient: `Patient/${patientId}`,
    status: 'active',
  });

  useEffect(() => {
    if (medsLoading || medications === undefined) return;

    const meds = medications.map(m => ({
      rxNormCode: getMedCode(m),
      name: getMedName(m),
    }));

    const body: CheckInteractionRequest = {
      patientContext: {
        medications: meds,
        allergies: [],
        demographics: { age: 0, sex: 'unknown', conditions: [], eGfr: 90 },
      },
      proposedMedication,
    };

    fetch(`${apiBaseUrl}/drug-interactions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<InteractionCheckResponse>;
      })
      .then(data => {
        if (data.interactions.length === 0) {
          setState({ status: 'no-interactions' });
        } else {
          setState({ status: 'has-interactions', interactions: data.interactions });
        }
      })
      .catch(() => setState({ status: 'error', message: 'Unable to check interactions.' }));
  }, [medications, medsLoading, patientId, proposedMedication, apiBaseUrl]);

  return state;
}

// Helpers
function getMedName(med: import('@medplum/fhirtypes').MedicationRequest): string {
  return (
    med.medicationCodeableConcept?.text ||
    med.medicationCodeableConcept?.coding?.[0]?.display ||
    'Unknown medication'
  );
}
function getMedCode(med: import('@medplum/fhirtypes').MedicationRequest): string {
  return med.medicationCodeableConcept?.coding?.[0]?.code || '';
}
```

---

## Skeleton: `src/components/DrugInteractionPanel.tsx`

```typescript
import React from 'react';
import { useInteractionCheck } from '../hooks/useInteractionCheck';
import { InteractionCard } from './InteractionCard';
import type { DrugInteractionPanelProps } from '../types';

export function DrugInteractionPanel({
  patientId,
  proposedMedication,
  apiBaseUrl,
  onAcknowledge,
}: DrugInteractionPanelProps) {
  const state = useInteractionCheck(patientId, proposedMedication, apiBaseUrl);

  if (state.status === 'loading') {
    return <div data-testid="loading-state">Checking for interactions…</div>;
  }

  if (state.status === 'error') {
    return (
      <div data-testid="error-state" style={{ color: 'red' }}>
        {state.message} Please try again.
      </div>
    );
  }

  if (state.status === 'no-interactions') {
    return (
      <div data-testid="no-interactions-state" style={{ color: 'green' }}>
        No interactions found.
      </div>
    );
  }

  // has-interactions
  return (
    <div data-testid="interactions-state">
      {state.interactions.map((interaction, i) => (
        <InteractionCard key={i} interaction={interaction} />
      ))}
      <button data-testid="acknowledge-button" onClick={onAcknowledge}>
        I have reviewed these interactions
      </button>
    </div>
  );
}
```

---

## Skeleton: `src/components/InteractionCard.tsx`

```typescript
import React from 'react';
import { InteractionSeverityBadge } from './InteractionSeverityBadge';
import type { Interaction } from '../types';

export function InteractionCard({ interaction }: { interaction: Interaction }) {
  return (
    <div data-testid={`interaction-card-${interaction.severity}`}>
      <InteractionSeverityBadge severity={interaction.severity} />
      <strong>{interaction.conflictingMedication}</strong>
      <p>{interaction.mechanism}</p>
      <p>{interaction.consequence}</p>
      <p><em>Action: {interaction.recommendedAction}</em></p>
    </div>
  );
}
```

---

## Skeleton: `src/components/InteractionSeverityBadge.tsx`

```typescript
import React from 'react';
import type { Severity } from '../types';

const COLORS: Record<Severity, string> = {
  major: '#dc2626',
  moderate: '#d97706',
  minor: '#ca8a04',
};

export function InteractionSeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      data-testid={`severity-badge-${severity}`}
      style={{ backgroundColor: COLORS[severity], color: 'white', padding: '2px 8px', borderRadius: '4px' }}
    >
      {severity.toUpperCase()}
    </span>
  );
}
```

---

## Vitest setup: `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
```
