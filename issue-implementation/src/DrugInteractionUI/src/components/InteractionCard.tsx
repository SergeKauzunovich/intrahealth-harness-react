import { InteractionSeverityBadge } from './InteractionSeverityBadge';
import type { Interaction } from '../types';

/**
 * Renders a single drug interaction entry: severity badge, conflicting drug name,
 * pharmacological mechanism, clinical consequence, and recommended clinical action.
 */
export function InteractionCard({ interaction }: { interaction: Interaction }) {
  return (
    <div data-testid={`interaction-card-${interaction.severity}`}>
      <InteractionSeverityBadge severity={interaction.severity} />
      <strong>{interaction.conflictingMedication}</strong>
      <p>{interaction.mechanism}</p>
      <p>{interaction.consequence}</p>
      <p><em>Action: {interaction.recommendedAction}</em></p>
    </div>
  );
}
