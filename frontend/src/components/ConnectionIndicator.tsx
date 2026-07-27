import type { ConnectionStatus } from '../lib/types';

const META: Record<ConnectionStatus, { label: string; dot: string; text: string }> = {
  open: {
    label: 'Live',
    dot: 'bg-success shadow-[0_0_0_3px_var(--success-muted)]',
    text: 'text-success',
  },
  connecting: {
    label: 'Connecting…',
    dot: 'bg-warning animate-pulse-slow',
    text: 'text-warning',
  },
  reconnecting: {
    label: 'Reconnecting…',
    dot: 'bg-warning animate-pulse-slow',
    text: 'text-warning',
  },
};

export default function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const meta = META[status];
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${meta.text}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}
