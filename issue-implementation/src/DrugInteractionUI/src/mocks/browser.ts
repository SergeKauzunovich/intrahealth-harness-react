import { setupWorker } from 'msw/browser';
import { http, HttpResponse } from 'msw';
import type { InteractionCheckResponse } from '../types';
import {
  noInteractionsScenario,
  moderateInteractionScenario,
  majorInteractionScenario,
} from './mockData';

const byRxNorm: Record<string, InteractionCheckResponse> = {
  '29046': noInteractionsScenario.expectedResponse,
  '11289': moderateInteractionScenario.expectedResponse,
  '41493': majorInteractionScenario.expectedResponse,
};

export const worker = setupWorker(
  // Intercept Medplum FHIR MedicationRequest search (any base URL)
  http.get('*/fhir/R4/MedicationRequest', () => {
    return HttpResponse.json({ resourceType: 'Bundle', entry: [] });
  }),

  http.post('/api/drug-interactions/check', async ({ request }) => {
    const body = await request.json() as { proposedMedication: { rxNormCode: string } };
    const rxNorm = body?.proposedMedication?.rxNormCode;
    if (rxNorm === '00000') {
      return new HttpResponse(null, { status: 503 });
    }
    return HttpResponse.json<InteractionCheckResponse>(
      byRxNorm[rxNorm] ?? { interactions: [] }
    );
  }),
);
