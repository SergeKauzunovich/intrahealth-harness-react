import type { Severity } from '../types';

const COLORS: Record<Severity, string> = {
  major: '#dc2626',
  moderate: '#d97706',
  minor: '#ca8a04',
};

/**
 * Color-coded severity badge: major=red, moderate=amber, minor=yellow.
 * Includes `data-testid="severity-badge-{severity}"` for test targeting.
 */
export function InteractionSeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      data-testid={`severity-badge-${severity}`}
      style={{ backgroundColor: COLORS[severity], color: 'white', padding: '2px 8px', borderRadius: '4px' }}
    >
      {severity.toUpperCase()}
    </span>
  );
}
