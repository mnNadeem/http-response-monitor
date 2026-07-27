import { useState } from 'react';
import { useMonitorData } from './hooks/useMonitorData';
import StatsBar from './components/StatsBar';
import ResultsTable from './components/ResultsTable';
import AnomalyChart from './components/AnomalyChart';
import AnomalyPanel from './components/AnomalyPanel';
import DashboardHeader from './components/DashboardHeader';
import LoadingResults from './components/LoadingResults';

export default function App() {
  const {
    results,
    stats,
    analysis,
    loading,
    error,
    connection,
    newestId,
    page,
    setPage,
    totalPages,
    total,
  } = useMonitorData();
  const [triggerError, setTriggerError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-content px-4 py-6 sm:px-6 sm:py-8">
      <DashboardHeader connection={connection} onTriggerError={setTriggerError} />

      {triggerError && (
        <div className="alert-danger mb-4" role="alert">
          Trigger failed: {triggerError}
        </div>
      )}
      {error && (
        <div className="alert-danger mb-4" role="alert">
          Failed to load data: {error}. Is the backend running on the configured API base?
        </div>
      )}

      <div className="mb-6">
        <StatsBar stats={stats} />
      </div>

      <div className="mb-4">
        <AnomalyChart points={analysis?.points ?? []} />
      </div>

      <div className="mb-6">
        <AnomalyPanel analysis={analysis} />
      </div>

      {loading ? (
        <LoadingResults />
      ) : (
        <ResultsTable
          results={results}
          newestId={newestId}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      )}

      <footer className="mt-8 text-center text-xs text-faint">
        {total} total results · page {page} of {totalPages} · updates live via WebSocket
      </footer>
    </div>
  );
}
