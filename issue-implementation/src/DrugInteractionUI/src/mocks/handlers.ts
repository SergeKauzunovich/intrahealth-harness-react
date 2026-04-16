import { http, HttpResponse } from 'msw';
import type { InteractionCheckResponse } from '../types';

/**
 * Default MSW request handlers. Intercepts POST /api/drug-interactions/check and
 * returns an empty interactions list. Override per-test with `server.use()`.
 */
export const handlers = [
  http.post('/api/drug-interactions/check', () => {
    return HttpResponse.json<InteractionCheckResponse>({ interactions: [] });
  }),
];
