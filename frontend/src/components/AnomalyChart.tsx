import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { AnalysisPoint } from '../lib/types';

/** Chart colors read from CSS theme tokens at module load; fall back to spec defaults. */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

const COLORS = {
  actual: token('--chart-actual', '#171a1f'),
  mean: token('--primary', '#0fb89b'),
  predicted: token('--chart-predicted', '#6b7280'),
  band: token('--chart-band', '#0fb89b'),
  anomaly: token('--chart-anomaly', '#e5484d'),
  grid: token('--chart-grid', '#eaedf0'),
  tick: token('--chart-tick', '#8a929e'),
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface Row {
  time: string;
  responseTimeMs: number | null;
  rollingMean: number | null;
  predicted: number | null;
  band?: [number, number];
  anomalyValue: number | null;
}

// Recharts tooltip is fed our Row; render only the meaningful fields.
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row: Row = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-tooltip">
      <div className="mb-1 font-medium text-text">{label}</div>
      <div className="text-muted">Response: {fmt(row.responseTimeMs)} ms</div>
      <div style={{ color: COLORS.mean }}>Rolling mean: {fmt(row.rollingMean)} ms</div>
      <div style={{ color: COLORS.predicted }}>Predicted: {fmt(row.predicted)} ms</div>
      {row.band && (
        <div className="text-faint">
          Band: {fmt(row.band[0])}–{fmt(row.band[1])} ms
        </div>
      )}
      {row.anomalyValue != null && (
        <div className="mt-0.5 font-semibold text-danger">⚠ Anomaly</div>
      )}
    </div>
  );
}

function fmt(v: number | null): string {
  return v == null ? '—' : String(Math.round(v));
}

export default function AnomalyChart({ points }: { points: AnalysisPoint[] }) {
  const data = useMemo<Row[]>(
    () =>
      points.map((p) => ({
        time: formatTime(p.requestedAt),
        responseTimeMs: p.responseTimeMs,
        rollingMean: p.rollingMean,
        predicted: p.predicted,
        band:
          p.lowerBand != null && p.upperBand != null ? [p.lowerBand, p.upperBand] : undefined,
        anomalyValue: p.isAnomaly ? p.responseTimeMs : null,
      })),
    [points],
  );

  if (!points.length) {
    return (
      <div className="state-empty h-[320px]">
        <div>
          <p className="text-sm font-medium text-text">Collecting data</p>
          <p className="mt-1 text-sm text-muted">
            The chart appears once the first results arrive.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-3 sm:p-4">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="time" tick={{ fontSize: 11, fill: COLORS.tick }} minTickGap={40} />
          <YAxis tick={{ fontSize: 11, fill: COLORS.tick }} width={48} unit="" />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: COLORS.tick }} />

          {/* mean ± zσ band — Recharts renders a [min, max] dataKey as a range area */}
          <Area
            dataKey="band"
            name="Confidence band (±zσ)"
            stroke="none"
            fill={COLORS.band}
            fillOpacity={0.12}
            isAnimationActive={false}
            connectNulls={false}
          />
          <Line
            dataKey="rollingMean"
            name="Rolling mean"
            stroke={COLORS.mean}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            dataKey="predicted"
            name="Predicted"
            stroke={COLORS.predicted}
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            dataKey="responseTimeMs"
            name="Response time"
            stroke={COLORS.actual}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Scatter dataKey="anomalyValue" name="Anomaly" fill={COLORS.anomaly} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
