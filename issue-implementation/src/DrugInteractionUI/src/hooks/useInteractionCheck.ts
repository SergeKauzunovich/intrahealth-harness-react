import { useState, useEffect } from 'react';
import { useSearchResources } from '@medplum/react';
import type { MedicationRequest } from '@medplum/fhirtypes';
import type {
  DrugInteractionPanelProps,
  Interaction,
  InteractionCheckResponse,
  CheckInteractionRequest,
} from '../types';

/**
 * Discriminated union describing the current interaction-check state.
 * Switch on `status` to render the appropriate visual state.
 */
export type InteractionState =
  | { status: 'loading' }
  | { status: 'no-interactions' }
  | { status: 'has-interactions'; interactions: Interaction[] }
  | { status: 'error'; message: string };

/**
 * Fetches the patient's active MedicationRequest resources via the Medplum SDK,
 * then calls POST /api/drug-interactions/check with the constructed patient context.
 *
 * @param patientId - FHIR Patient resource ID
 * @param proposedMedication - Medication under consideration for prescription
 * @param apiBaseUrl - Base URL for the drug interaction backend (default: '/api')
 * @returns Current {@link InteractionState} — starts as `loading`, transitions on fetch completion
 */
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

  const rxNormCode = proposedMedication.rxNormCode;
  const medName = proposedMedication.name;

  useEffect(() => {
    if (medsLoading || medications === undefined) return;

    const meds = medications.map((m: MedicationRequest) => ({
      rxNormCode: getMedCode(m),
      name: getMedName(m),
    }));

    const body: CheckInteractionRequest = {
      patientContext: {
        medications: meds,
        allergies: [],
        demographics: { age: 0, sex: 'unknown', conditions: [], eGfr: 90 },
      },
      proposedMedication: { rxNormCode, name: medName },
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
  }, [medications, medsLoading, patientId, rxNormCode, medName, apiBaseUrl]);

  return state;
}

/** Extracts a human-readable name from a MedicationRequest resource. */
function getMedName(med: MedicationRequest): string {
  return (
    med.medicationCodeableConcept?.text ??
    med.medicationCodeableConcept?.coding?.[0]?.display ??
    'Unknown medication'
  );
}

/** Extracts the RxNorm code from the first coding entry of a MedicationRequest. */
function getMedCode(med: MedicationRequest): string {
  return med.medicationCodeableConcept?.coding?.[0]?.code ?? '';
}
