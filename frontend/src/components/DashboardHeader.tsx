import { useState } from 'react';
import { triggerRun } from '../lib/api';
import type { ConnectionStatus } from '../lib/types';
import ConnectionIndicator from './ConnectionIndicator';

export default function DashboardHeader({
  connection,
  onTriggerError,
}: {
  connection: ConnectionStatus;
  onTriggerError: (message: string | null) => void;
}) {
  const [triggering, setTriggering] = useState(false);

  async function handleRun() {
    setTriggering(true);
    onTriggerError(null);
    try {
      await triggerRun();
      // The new record streams back over the WebSocket and updates the table.
    } catch (err) {
      onTriggerError((err as Error).message);
    } finally {
      setTriggering(false);
    }
  }

  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          HTTP Monitor
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Pinging{' '}
          <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-text">
            httpbin.org/anything
          </code>{' '}
          every 5 minutes
        </p>
      </div>
      <div className="flex items-center gap-3">
        <ConnectionIndicator status={connection} />
        <button onClick={handleRun} disabled={triggering} className="btn-primary">
          {triggering ? 'Running…' : 'Run now'}
        </button>
      </div>
    </header>
  );
}
