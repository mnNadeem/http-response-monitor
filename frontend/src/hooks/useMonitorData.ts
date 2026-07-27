import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAnalysis, fetchResults, fetchStats } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import { MAX_ANALYSIS_POINTS, PAGE_SIZE, WS_URL } from '../lib/config';
import type { AnalysisResponse, ResultsPage, Stats, WsMessage } from '../lib/types';
import { useWebSocket } from './useWebSocket';

export function useMonitorData() {
  const queryClient = useQueryClient();
  const [newestId, setNewestId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const statsTimer = useRef<ReturnType<typeof setTimeout>>();
  const pageRef = useRef(page);
  pageRef.current = page;

  const resultsQuery = useQuery({
    queryKey: [...queryKeys.results, page],
    queryFn: () => fetchResults({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.stats,
    queryFn: fetchStats,
  });

  const analysisQuery = useQuery({
    queryKey: queryKeys.analysis,
    queryFn: fetchAnalysis,
  });

  const handleMessage = useCallback(
    (msg: WsMessage) => {
      if (msg.type !== 'monitor_result') return;
      const record = msg.data;

      // Always update page 1's cache — seed an empty page if REST hasn't landed yet
      // so early WS frames aren't dropped. Only bump total for genuinely new ids.
      let isNew = true;
      queryClient.setQueryData<ResultsPage>([...queryKeys.results, 1], (prev) => {
        const base = prev ?? { items: [], total: 0, limit: PAGE_SIZE, offset: 0 };
        isNew = !base.items.some((r) => r.id === record.id);
        const items = [record, ...base.items.filter((r) => r.id !== record.id)].slice(0, PAGE_SIZE);
        return {
          ...base,
          items,
          total: isNew ? base.total + 1 : base.total,
        };
      });

      // If viewing a page other than 1, invalidate it so row numbers stay correct.
      if (pageRef.current !== 1) {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.results, pageRef.current] });
      }

      // Optimistic stats bump (counts are exact; avg is fixed up below).
      if (isNew) {
        queryClient.setQueryData<Stats>(queryKeys.stats, (prev) =>
          prev
            ? {
                ...prev,
                total: prev.total + 1,
                successes: prev.successes + (record.success ? 1 : 0),
                failures: prev.failures + (record.success ? 0 : 1),
                lastRequestedAt: record.requestedAt,
              }
            : prev,
        );
      }

      if (record.analysis) {
        const point = record.analysis;
        const existingAnalysis = queryClient.getQueryData<AnalysisResponse>(queryKeys.analysis);
        if (!existingAnalysis) {
          // Cache not warm yet — refetch so we don't invent a full AnalysisResponse.
          queryClient.invalidateQueries({ queryKey: queryKeys.analysis });
        } else {
          queryClient.setQueryData<AnalysisResponse>(queryKeys.analysis, (prev) => {
            if (!prev) return prev;
            const points = [...prev.points.filter((p) => p.id !== point.id), point].slice(
              -MAX_ANALYSIS_POINTS,
            );
            return { ...prev, points, summary: msg.summary ?? prev.summary };
          });
        }
      }

      setNewestId(record.id);

      // Reconcile exact aggregates from the server, debounced against bursts.
      clearTimeout(statsTimer.current);
      statsTimer.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      }, 1500);
    },
    [queryClient],
  );

  const connection = useWebSocket(WS_URL, { onMessage: handleMessage });

  // After a dropped connection is restored, refetch to catch anything missed.
  const prevConnection = useRef(connection);
  useEffect(() => {
    if (prevConnection.current === 'reconnecting' && connection === 'open') {
      queryClient.invalidateQueries({ queryKey: queryKeys.results });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.analysis });
    }
    prevConnection.current = connection;
  }, [connection, queryClient]);

  useEffect(() => () => clearTimeout(statsTimer.current), []);

  const total = resultsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    results: resultsQuery.data?.items ?? [],
    stats: statsQuery.data ?? null,
    analysis: analysisQuery.data ?? null,
    loading: resultsQuery.isLoading,
    error: resultsQuery.error ? (resultsQuery.error as Error).message : null,
    connection,
    newestId,
    page,
    setPage,
    totalPages,
    total,
  };
}
