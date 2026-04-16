# Mock FHIR Data — 3 Patient Scenarios

Use these exact scenarios in `src/mocks/mockData.ts` and in MSW handlers.

---

## Scenario 1: No interactions

Patient on metoprolol (beta-blocker) + proposed lisinopril (ACE inhibitor).
No known major interaction between these two for a typical patient.

```typescript
export const noInteractionsScenario = {
  patientId: 'patient-001',
  currentMedications: [
    {
      resourceType: 'MedicationRequest' as const,
      id: 'medrx-001',
      status: 'active' as const,
      medicationCodeableConcept: {
        coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '866511', display: 'metoprolol 25 MG' }],
        text: 'metoprolol',
      },
    },
  ],
  proposedMedication: { rxNormCode: '29046', name: 'lisinopril' },
  expectedResponse: { interactions: [] },
};
```

---

## Scenario 2: Moderate interaction

Patient on aspirin + proposed warfarin.
Moderate interaction: compounding anticoagulant + antiplatelet → elevated bleeding risk.

```typescript
export const moderateInteractionScenario = {
  patientId: 'patient-002',
  currentMedications: [
    {
      resourceType: 'MedicationRequest' as const,
      id: 'medrx-002',
      status: 'active' as const,
      medicationCodeableConcept: {
        coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '1191', display: 'aspirin 81 MG' }],
        text: 'aspirin',
      },
    },
  ],
  proposedMedication: { rxNormCode: '11289', name: 'warfarin' },
  expectedResponse: {
    interactions: [
      {
        severity: 'moderate',
        mechanism: 'Aspirin inhibits platelet aggregation; warfarin inhibits clotting factors. Combined effect is additive.',
        conflictingMedication: 'aspirin',
        consequence: 'Elevated bleeding risk — GI bleed, intracranial hemorrhage.',
        recommendedAction: 'Monitor INR closely. Use lowest effective aspirin dose. Alert patient to signs of bleeding.',
      },
    ],
  },
};
```

---

## Scenario 3: Major interaction

Patient on fluoxetine (SSRI) + proposed tramadol.
Major interaction: serotonin syndrome risk.

```typescript
export const majorInteractionScenario = {
  patientId: 'patient-003',
  currentMedications: [
    {
      resourceType: 'MedicationRequest' as const,
      id: 'medrx-003',
      status: 'active' as const,
      medicationCodeableConcept: {
        coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '41493', display: 'fluoxetine 20 MG' }],
        text: 'fluoxetine',
      },
    },
  ],
  proposedMedication: { rxNormCode: '41493', name: 'tramadol' },
  expectedResponse: {
    interactions: [
      {
        severity: 'major',
        mechanism: 'Both fluoxetine (SSRI) and tramadol increase serotonergic activity via additive mechanisms.',
        conflictingMedication: 'fluoxetine',
        consequence: 'Serotonin syndrome — agitation, hyperthermia, tachycardia, neuromuscular abnormalities. Can be fatal.',
        recommendedAction: 'Avoid combination. Use alternative analgesic (e.g. acetaminophen, NSAIDs if not contraindicated).',
      },
    ],
  },
};
```

---

## Complete `src/mocks/mockData.ts` file

```typescript
import type { MedicationRequest } from '@medplum/fhirtypes';
import type { InteractionCheckResponse } from '../types';

interface PatientScenario {
  patientId: string;
  currentMedications: MedicationRequest[];
  proposedMedication: { rxNormCode: string; name: string };
  expectedResponse: InteractionCheckResponse;
}

export const noInteractionsScenario: PatientScenario = { /* ... scenario 1 above */ };
export const moderateInteractionScenario: PatientScenario = { /* ... scenario 2 above */ };
export const majorInteractionScenario: PatientScenario = { /* ... scenario 3 above */ };
```

(Copy the full scenario objects from the sections above into this file.)

---

## Matching hints for MSW handlers

When setting up per-test MSW overrides, use `server.use()` with the scenario's
`expectedResponse` directly — no need to inspect the request body.

For integration-style tests that need to verify the request body was constructed correctly,
use `async ({ request }) => { const body = await request.json(); ... }` inside the MSW handler.
