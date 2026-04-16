import { useInteractionCheck } from '../hooks/useInteractionCheck';
import { InteractionCard } from './InteractionCard';
import type { DrugInteractionPanelProps } from '../types';

/**
 * Displays drug interaction findings for a patient and a proposed medication.
 * Renders one of four states: loading, no-interactions, has-interactions, or error.
 * All async state is managed by the {@link useInteractionCheck} hook.
 */
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
        Unable to check interactions. Please try again.
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
