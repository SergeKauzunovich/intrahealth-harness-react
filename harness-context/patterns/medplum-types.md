# Medplum + FHIR Types Reference

Use these exact types in your implementation. Do not invent alternatives.

---

## Component contract (copy verbatim to `src/types/index.ts`)

```typescript
// Proposed medication passed in as a prop
export interface ProposedMedication {
  rxNormCode: string;
  name: string;
}

// Main component props — do not change this signature
export interface DrugInteractionPanelProps {
  patientId: string;
  proposedMedication: ProposedMedication;
  apiBaseUrl?: string;       // defaults to '/api'
  onAcknowledge?: () => void;
}

// Interaction result from POST /api/drug-interactions/check
export type Severity = 'major' | 'moderate' | 'minor';

export interface Interaction {
  severity: Severity;
  mechanism: string;
  conflictingMedication: string;
  consequence: string;
  recommendedAction: string;
}

export interface InteractionCheckResponse {
  interactions: Interaction[];
}

// Request body sent to the backend
export interface CheckInteractionRequest {
  patientContext: {
    medications: Array<{ rxNormCode: string; name: string }>;
    allergies: string[];
    demographics: { age: number; sex: string; conditions: string[]; eGfr: number };
  };
  proposedMedication: {
    rxNormCode: string;
    name: string;
  };
}
```

---

## FHIR resource shapes (from @medplum/fhirtypes or use these minimal inline types)

```typescript
// Minimal FHIR types — use @medplum/fhirtypes in production, inline here for clarity
export interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface MedicationRequest {
  resourceType: 'MedicationRequest';
  id?: string;
  status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'stopped';
  medicationCodeableConcept?: CodeableConcept;
  subject?: { reference: string };  // e.g. "Patient/123"
}
```

---

## Medplum SDK hooks (from @medplum/react)

```typescript
import { useMedplum } from '@medplum/react';
import { MedplumClient } from '@medplum/core';

// Returns the MedplumClient instance
const medplum: MedplumClient = useMedplum();

// Search FHIR resources — returns [resources, loading, error]
// Example: search for active MedicationRequests for a patient
import { useSearchResources } from '@medplum/react';
const [medications, loading, error] = useSearchResources(
  'MedicationRequest',
  { patient: `Patient/${patientId}`, status: 'active' }
);
```

**Important**: `useSearchResources` returns `undefined` while loading. Always check for
`loading === true` before rendering, and handle `undefined` medications gracefully.

---

## Helper: extract medication name from MedicationRequest

```typescript
function getMedName(med: MedicationRequest): string {
  return (
    med.medicationCodeableConcept?.text ||
    med.medicationCodeableConcept?.coding?.[0]?.display ||
    med.medicationCodeableConcept?.coding?.[0]?.code ||
    'Unknown medication'
  );
}

function getMedCode(med: MedicationRequest): string {
  return (
    med.medicationCodeableConcept?.coding?.find(c => c.system?.includes('rxnorm'))?.code ||
    med.medicationCodeableConcept?.coding?.[0]?.code ||
    ''
  );
}
```

---

## Medplum provider setup (in tests and app root)

```typescript
// In test renderWithMedplum helper:
import { MedplumProvider } from '@medplum/react';
import { MockClient } from '@medplum/mock';

const medplum = new MockClient();
render(
  <MedplumProvider medplum={medplum}>
    {children}
  </MedplumProvider>
);
```

For MSW-based tests where you control the network, wrap with a real `MedplumClient`
pointed at `http://localhost` and let MSW intercept the requests.
