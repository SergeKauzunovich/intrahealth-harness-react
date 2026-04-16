# React Testing Patterns

Use these exact patterns for Vitest + React Testing Library + MSW tests.

---

## Test file location

Co-locate tests next to the component:
```
src/components/DrugInteractionPanel.tsx
src/components/DrugInteractionPanel.test.tsx   ← same directory
```

---

## MSW handler setup: `src/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';
import type { InteractionCheckResponse } from '../types';

// Override in individual tests by using server.use() for specific scenarios
export const handlers = [
  http.post('/api/drug-interactions/check', () => {
    return HttpResponse.json<InteractionCheckResponse>({ interactions: [] });
  }),
];
```

---

## MSW server setup (in test files or shared setup)

```typescript
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## renderWithMedplum helper

```typescript
import React from 'react';
import { render } from '@testing-library/react';
import { MedplumProvider } from '@medplum/react';
import { MockClient } from '@medplum/mock';

export function renderWithMedplum(ui: React.ReactElement) {
  const medplum = new MockClient();
  return render(
    <MedplumProvider medplum={medplum}>
      {ui}
    </MedplumProvider>
  );
}
```

---

## Full test file: `DrugInteractionPanel.test.tsx`

```typescript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';
import { DrugInteractionPanel } from './DrugInteractionPanel';
import { renderWithMedplum } from '../test/renderWithMedplum';
import { noInteractionsScenario, majorInteractionScenario } from '../mocks/mockData';

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const defaultProps = {
  patientId: 'patient-123',
  proposedMedication: { rxNormCode: '855332', name: 'tramadol' },
};

describe('DrugInteractionPanel', () => {
  it('shows loading state initially', () => {
    renderWithMedplum(<DrugInteractionPanel {...defaultProps} />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('shows no-interactions state when API returns empty list', async () => {
    server.use(
      http.post('/api/drug-interactions/check', () =>
        HttpResponse.json({ interactions: [] })
      )
    );
    renderWithMedplum(<DrugInteractionPanel {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByTestId('no-interactions-state')).toBeInTheDocument()
    );
  });

  it('renders interaction cards and acknowledge button for major interaction', async () => {
    server.use(
      http.post('/api/drug-interactions/check', () =>
        HttpResponse.json(majorInteractionScenario.expectedResponse)
      )
    );
    renderWithMedplum(<DrugInteractionPanel {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByTestId('interactions-state')).toBeInTheDocument()
    );
    expect(screen.getByTestId('severity-badge-major')).toBeInTheDocument();
    expect(screen.getByTestId('acknowledge-button')).toBeInTheDocument();
  });

  it('shows error state when API returns 503', async () => {
    server.use(
      http.post('/api/drug-interactions/check', () =>
        new HttpResponse(null, { status: 503 })
      )
    );
    renderWithMedplum(<DrugInteractionPanel {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByTestId('error-state')).toBeInTheDocument()
    );
  });

  it('calls onAcknowledge when acknowledge button is clicked', async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn();
    server.use(
      http.post('/api/drug-interactions/check', () =>
        HttpResponse.json(majorInteractionScenario.expectedResponse)
      )
    );
    renderWithMedplum(
      <DrugInteractionPanel {...defaultProps} onAcknowledge={onAcknowledge} />
    );
    await waitFor(() =>
      expect(screen.getByTestId('acknowledge-button')).toBeInTheDocument()
    );
    await user.click(screen.getByTestId('acknowledge-button'));
    expect(onAcknowledge).toHaveBeenCalledOnce();
  });
});
```

---

## Naming convention

```
ComponentName_Scenario_ExpectedBehavior
```

Examples:
- `DrugInteractionPanel shows loading state initially`
- `DrugInteractionPanel shows no-interactions state when API returns empty list`
- `DrugInteractionPanel renders interaction cards and acknowledge button for major interaction`
- `DrugInteractionPanel shows error state when API returns 503`
