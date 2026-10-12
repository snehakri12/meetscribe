"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { errorMessage } from "@/lib/api";

type State<T> = {
  requestKey: string | null;
  data: T | undefined;
  error: string | null;
};

/**
 * Load data from the API whenever `key` changes.
 *
 * `key` should encode every input of `load` (e.g. the serialised filters).
 * Previous data stays visible while a new request is in flight, and `mutate`
 * allows optimistic local updates after create/update/delete calls.
 */
export function useApi<T>(load: () => Promise<T>, key: string) {
  const [state, setState] = useState<State<T>>({ requestKey: null, data: undefined, error: null });
  const [reloadToken, setReloadToken] = useState(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  const requestKey = `${key}#${reloadToken}`;

  useEffect(() => {
    let cancelled = false;
    loadRef.current().then(
      (data) => {
        if (!cancelled) setState({ requestKey, data, error: null });
      },
      (error: unknown) => {
        if (!cancelled) {
          setState((previous) => ({ requestKey, data: previous.data, error: errorMessage(error, "Could not load data") }));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);
  const mutate = useCallback((updater: (current: T) => T) => {
    setState((previous) => (previous.data === undefined ? previous : { ...previous, data: updater(previous.data) }));
  }, []);

  return {
    data: state.data,
    error: state.requestKey === requestKey ? state.error : null,
    loading: state.requestKey !== requestKey,
    reload,
    mutate,
  };
}
