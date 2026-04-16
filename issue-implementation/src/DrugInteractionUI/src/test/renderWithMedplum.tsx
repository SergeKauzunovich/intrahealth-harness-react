import React from 'react';
import { render } from '@testing-library/react';
import { MedplumProvider } from '@medplum/react';
import { MockClient } from '@medplum/mock';

/**
 * Wraps a React element in a {@link MedplumProvider} backed by a {@link MockClient}.
 * Use in all component tests to provide Medplum context without a real server.
 *
 * @param ui - React element to render
 * @returns Result of {@link render} with Medplum context applied
 */
export function renderWithMedplum(ui: React.ReactElement) {
  const medplum = new MockClient();
  return render(
    <MedplumProvider medplum={medplum}>
      {ui}
    </MedplumProvider>
  );
}
