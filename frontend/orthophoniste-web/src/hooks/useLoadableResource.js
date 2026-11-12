import { useCallback, useEffect, useRef, useState } from 'react';
import { withRequestDeadline } from '../api/requestDeadline.js';
import { requestErrorToUi } from '../api/requestError.js';

export function useLoadableResource(loader, { initialData = null, enabled = true } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const mounted = useRef(false);
  const active = useRef(null);

  const reload = useCallback(async () => {
    if (!mounted.current || !enabled) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await withRequestDeadline(loader, { signal: controller.signal });
      if (mounted.current && active.current === controller && !controller.signal.aborted) {
        setData(result);
        setHasLoaded(true);
      }
    } catch (requestError) {
      if (mounted.current && active.current === controller && !controller.signal.aborted) {
        setError(requestErrorToUi(requestError));
      }
    } finally {
      controller.abort();
      if (mounted.current && active.current === controller) {
        active.current = null;
        setLoading(false);
      }
    }
  }, [loader, enabled]);

  useEffect(() => {
    mounted.current = true;
    if (enabled) reload();
    else setLoading(false);
    return () => {
      mounted.current = false;
      active.current?.abort();
    };
  }, [reload, enabled]);

  return { data, setData, loading, error, hasLoaded, reload };
}
