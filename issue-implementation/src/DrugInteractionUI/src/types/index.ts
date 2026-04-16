/** Proposed medication being considered for prescription. */
export interface ProposedMedication {
  rxNormCode: string;
  name: string;
}

/** Props for the DrugInteractionPanel component. */
export interface DrugInteractionPanelProps {
  patientId: string;
  proposedMedication: ProposedMedication;
  /** Defaults to '/api' if omitted. */
  apiBaseUrl?: string;
  onAcknowledge?: () => void;
}

/** Severity level of a drug–drug interaction. */
export type Severity = 'major' | 'moderate' | 'minor';

/** A single drug interaction finding returned by the backend API. */
export interface Interaction {
  severity: Severity;
  mechanism: string;
  conflictingMedication: string;
  consequence: string;
  recommendedAction: string;
}

/** Response body from POST /api/drug-interactions/check. */
export interface InteractionCheckResponse {
  interactions: Interaction[];
}

/** Request body sent to POST /api/drug-interactions/check. */
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
