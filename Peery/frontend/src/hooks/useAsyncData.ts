import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { parseApiError } from '../utils/errors.ts';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

/** Loads data on mount / when deps change. `reload()` refetches but keeps the old data visible. */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError('');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(parseApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback((): void => {
    setLoading(true);
    setTick((t) => t + 1);
  }, []);

  return { data, loading, error, reload };
}