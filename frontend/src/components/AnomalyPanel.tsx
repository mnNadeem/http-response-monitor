import type { AnalysisResponse, AnomalyReason } from '../lib/types';

const REASON_LABELS: Record<AnomalyReason, string> = {
  request_failed: 'Request failed',
  latency_spike: 'Latency spike',
  latency_drop: 'Latency drop',
  prediction_error: 'Forecast deviation',
};

function ms(v: number | null): string {
  return v == null ? '—' : `${Math.round(v)} ms`;
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="panel-nested p-4">
      <div
        className={`text-xl font-semibold tabular-nums tracking-tight ${
          accent ? 'text-warning' : 'text-text'
        }`}
      >
        {value}
      </div>
      <div className="label-caps mt-1">{label}</div>
    </div>
  );
}

export default function AnomalyPanel({ analysis }: { analysis: AnalysisResponse | null }) {
  if (!analysis) {
    return (
      <div className="state-empty p-5">
        <p className="text-sm text-muted">Loading anomaly analysis…</p>
      </div>
    );
  }

  const { summary, config, window } = analysis;

  return (
    <div className="panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="label-caps text-text">Anomaly Detection</h2>
          <span className="text-xs text-faint">
            z-score · {window.hours}h window · ±{config.zThreshold}σ · EWMA α={config.ewmaAlpha}
          </span>
        </div>
        {summary.warmingUp && (
          <span className="rounded-md bg-warning-muted px-2 py-0.5 text-xs font-medium text-warning">
            warming up
          </span>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Rolling mean" value={ms(summary.currentMean)} />
        <Tile label="Std deviation" value={ms(summary.currentStd)} />
        <Tile label="Next predicted" value={ms(summary.nextPredictedMs)} />
        <Tile
          label="Anomalies"
          value={String(summary.anomalyCount)}
          accent={summary.anomalyCount > 0}
        />
      </div>

      <div>
        <h3 className="label-caps mb-2">Recent alerts</h3>
        {summary.alerts.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-faint">
            No anomalies detected
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summary.alerts.map((a) => (
              <div key={a.id} className="alert-warning px-3 py-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs text-text">{clockTime(a.requestedAt)}</span>
                  <span className="tabular-nums text-xs text-muted">
                    {ms(a.responseTimeMs)}
                    {a.zScore != null && <span className="ml-1">z={a.zScore.toFixed(1)}</span>}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.reasons.map((r) => (
                    <span
                      key={r}
                      className="rounded-md bg-warning-muted px-1.5 py-0.5 text-[10px] font-medium text-warning"
                    >
                      {REASON_LABELS[r]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
