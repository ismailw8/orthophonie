export const REQUEST_TIMEOUT_MS = 10_000;

const requestError = (message, code) => Object.assign(new Error(message), { code });

// Includes token refresh and cancels pending HTTP requests on expiry.
export function withRequestDeadline(task, { signal, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      callback(value);
    };
    const stop = error => {
      finish(reject, error);
      controller.abort(error);
    };
    const cancel = () => stop(requestError('Requête annulée.', 'ERR_CANCELED'));
    if (signal?.aborted) {
      cancel();
      return;
    }
    signal?.addEventListener('abort', cancel, { once: true });
    timer = setTimeout(() => stop(requestError('Délai de chargement dépassé.', 'ETIMEDOUT')), timeoutMs);
    Promise.resolve().then(() => {
      if (controller.signal.aborted) throw controller.signal.reason;
      return task(controller.signal);
    }).then(value => finish(resolve, value), error => stop(error));
  });
}
