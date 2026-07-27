import { useState } from 'react';
import type { MonitorResult } from '../lib/types';
import StatusBadge from './StatusBadge';

function formatTime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function Row({ record, isNew }: { record: MonitorResult; isNew: boolean }) {
  const [open, setOpen] = useState(false);
  const payload = record.requestPayload ?? {};

  return (
    <>
      <tr
        onClick={() => setOpen((o) => !o)}
        className={`cursor-pointer border-t border-line-subtle transition hover:bg-surface-2 ${
          isNew ? 'animate-flash' : ''
        }`}
      >
        <td className="px-3 py-2.5 tabular-nums text-muted">{record.id}</td>
        <td className="whitespace-nowrap px-3 py-2.5 text-text">{formatTime(record.requestedAt)}</td>
        <td className="px-3 py-2.5">
          <StatusBadge success={record.success} statusCode={record.statusCode} />
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-text">
          {record.responseTimeMs != null ? `${record.responseTimeMs} ms` : '—'}
        </td>
        <td className="hidden px-3 py-2.5 text-text sm:table-cell">
          {String(payload.eventType ?? '—')}
        </td>
        <td className="hidden px-3 py-2.5 text-text sm:table-cell">
          {String(payload.region ?? '—')}
        </td>
        <td className="hidden whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted md:table-cell">
          {String(payload.id ?? '—')}
        </td>
        <td className="px-3 py-2.5 text-center text-faint" aria-hidden>
          {open ? '▾' : '▸'}
        </td>
      </tr>

      {open && (
        <tr className="bg-surface-2">
          <td colSpan={8} className="px-3 py-3">
            {record.errorMessage && (
              <div className="alert-danger mb-3" role="alert">
                ⚠ {record.errorMessage}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="label-caps mb-1.5">Request Payload</h4>
                <pre className="panel-nested max-h-64 overflow-auto p-3 text-xs text-text">
                  {JSON.stringify(record.requestPayload, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="label-caps mb-1.5">Response Body</h4>
                <pre className="panel-nested max-h-64 overflow-auto p-3 text-xs text-text">
                  {record.responseBody ? JSON.stringify(record.responseBody, null, 2) : '— no body —'}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ResultsTable({
  results,
  newestId,
  page,
  totalPages,
  total,
  onPageChange,
}: {
  results: MonitorResult[];
  newestId: number | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (!results.length && page === 1) {
    return (
      <div className="state-empty">
        <div>
          <p className="text-sm font-medium text-text">No data yet</p>
          <p className="mt-1 text-sm text-muted">Waiting for the first monitor result…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-2 text-left">
            <th className="label-caps px-3 py-3 font-semibold">ID</th>
            <th className="label-caps px-3 py-3 font-semibold">Time</th>
            <th className="label-caps px-3 py-3 font-semibold">Status</th>
            <th className="label-caps px-3 py-3 text-right font-semibold">Latency</th>
            <th className="label-caps hidden px-3 py-3 font-semibold sm:table-cell">Event</th>
            <th className="label-caps hidden px-3 py-3 font-semibold sm:table-cell">Region</th>
            <th className="label-caps hidden px-3 py-3 font-semibold md:table-cell">Payload ID</th>
            <th className="px-3 py-3" aria-label="expand" />
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <Row key={r.id} record={r} isNew={r.id === newestId} />
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <span className="text-xs text-muted">
            {total} results · page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="btn-ghost"
            >
              ← Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="btn-ghost"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
