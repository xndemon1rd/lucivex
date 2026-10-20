import { useCallback, useEffect, useRef, useState } from 'react';
import { toApiError, type ApiError } from './api';

export interface AsyncState<T> {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data?: T;
  error?: ApiError;
}

/** Runs `fn` whenever `key` changes. `key = null` keeps the hook idle. */
export function useAsync<T>(
  key: string | null,
  fn: (signal: AbortSignal, fresh: boolean) => Promise<T>,
): AsyncState<T> & { retry: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: key === null ? 'idle' : 'loading' });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (key === null) {
      setState({ status: 'idle' });
      return;
    }
    const ctrl = new AbortController();
    setState({ status: 'loading' });
    fnRef
      .current(ctrl.signal, tick > 0)
      .then((data) => {
        if (!ctrl.signal.aborted) setState({ status: 'ready', data });
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setState({ status: 'error', error: toApiError(e) });
      });
    return () => ctrl.abort();
  }, [key, tick]);

  const retry = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, retry };
}
