import type { InteractionCheckResponse } from '../types';

interface MockMedication {
  rxNormCode: string;
  name: string;
}

interface PatientScenario {
  patientId: string;
  proposedMedication: MockMedication;
  expectedResponse: InteractionCheckResponse;
}

/**
 * Patient on metoprolol (beta-blocker), proposed lisinopril (ACE inhibitor).
 * No known major interaction — backend returns an empty interactions list.
 */
export const noInteractionsScenario: PatientScenario = {
  patientId: 'patient-001',
  proposedMedication: { rxNormCode: '29046', name: 'lisinopril' },
  expectedResponse: { interactions: [] },
};

/**
 * Patient on aspirin, proposed warfarin.
 * Moderate interaction: additive anticoagulant + antiplatelet effect raises bleeding risk.
 */
export const moderateInteractionScenario: PatientScenario = {
  patientId: 'patient-002',
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

/**
 * Patient on fluoxetine (SSRI), proposed tramadol.
 * Major interaction: both increase serotonergic activity — serotonin syndrome risk.
 */
export const majorInteractionScenario: PatientScenario = {
  patientId: 'patient-003',
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
