import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { REQUEST_TIMEOUT_MS, withRequestDeadline } from '../src/api/requestDeadline.js';
import { requestErrorToUi } from '../src/api/requestError.js';
import { createApiClient } from '../src/api/createApiClient.js';

const response = config => ({ data: [], status: 200, statusText: 'OK', headers: {}, config });

test('default deadline is ten seconds', () => {
  assert.equal(REQUEST_TIMEOUT_MS, 10_000);
  assert.equal(createApiClient({ authenticated: false }).defaults.timeout, 10_000);
});

test('an unresponsive operation expires, aborts its requests and ignores its late result', async () => {
  let signal;
  let resolveLate;
  const request = withRequestDeadline(currentSignal => {
    signal = currentSignal;
    return new Promise(resolve => { resolveLate = resolve; });
  }, { timeoutMs: 30 });
  await assert.rejects(request, { code: 'ETIMEDOUT' });
  assert.equal(signal.aborted, true);
  resolveLate('late data');
  await assert.rejects(request, { code: 'ETIMEDOUT' });
});

test('cancellation before dispatch never starts the operation', async () => {
  const controller = new AbortController();
  controller.abort();
  let called = false;
  await assert.rejects(withRequestDeadline(() => { called = true; }, { signal: controller.signal }), { code: 'ERR_CANCELED' });
  assert.equal(called, false);
});

test('leaving a page cancels its pending operation', async () => {
  const controller = new AbortController();
  let requestSignal;
  const request = withRequestDeadline(signal => {
    requestSignal = signal;
    return new Promise(() => {});
  }, { signal: controller.signal });
  await delay(5);
  controller.abort();
  await assert.rejects(request, { code: 'ERR_CANCELED' });
  assert.equal(requestSignal.aborted, true);
});

test('a failed request cancels the rest of a batch', async () => {
  let batchSignal;
  const failure = Object.assign(new Error('Service unavailable'), { response: { status: 503 } });
  await assert.rejects(withRequestDeadline(signal => {
    batchSignal = signal;
    return Promise.all([Promise.reject(failure), new Promise(() => {})]);
  }), failure);
  assert.equal(batchSignal.aborted, true);
});

test('a fresh retry succeeds after an earlier timeout', async () => {
  await assert.rejects(withRequestDeadline(() => new Promise(() => {}), { timeoutMs: 20 }), { code: 'ETIMEDOUT' });
  assert.deepEqual(await withRequestDeadline(() => Promise.resolve(['bilan'])), ['bilan']);
});

test('messages distinguish temporary failures, permissions, sessions and cancellation', () => {
  for (const code of ['ETIMEDOUT', 'ECONNABORTED', 'ERR_NETWORK']) {
    assert.equal(requestErrorToUi({ code }).retryable, true);
  }
  for (const status of [500, 502, 503, 504]) {
    assert.equal(requestErrorToUi({ response: { status } }).retryable, true);
  }
  for (const status of [400, 401, 403, 429]) {
    assert.equal(requestErrorToUi({ response: { status } }).retryable, false);
  }
  assert.equal(requestErrorToUi({ code: 'ERR_CANCELED' }), null);
  assert.equal(requestErrorToUi({ response: { status: 503, data: { message: 'private information' } } }).message.includes('private information'), false);
});

test('token refresh cannot leave the request pending or send it after its deadline', async () => {
  let finishRefresh;
  let dispatched = 0;
  const client = createApiClient({ authenticated: true, token: 'test-token', updateToken: () => new Promise(resolve => { finishRefresh = resolve; }) });
  await assert.rejects(client.get('/api/suivi/admin/bilans', {
    timeout: 30,
    adapter: async config => { dispatched++; return response(config); },
  }), { code: 'ETIMEDOUT' });
  finishRefresh();
  await delay(5);
  assert.equal(dispatched, 0);
});

test('cancellation also interrupts waiting for token refresh', async () => {
  const controller = new AbortController();
  const client = createApiClient({ authenticated: true, updateToken: () => new Promise(() => {}) });
  const request = client.get('/api/rdv/admin', { signal: controller.signal });
  await delay(5);
  controller.abort();
  await assert.rejects(request, { code: 'ERR_CANCELED' });
});

test('refresh time is deducted from the HTTP budget and the bearer token is preserved', async () => {
  const client = createApiClient({ authenticated: true, token: 'test-token', updateToken: () => delay(25) });
  await client.get('/api/rdv/admin', {
    timeout: 200,
    adapter: async config => {
      assert.ok(config.timeout > 0 && config.timeout < 200);
      assert.equal(config.headers.Authorization, 'Bearer test-token');
      return response(config);
    },
  });
});

test('public appointment requests bypass token refresh and send only once', async () => {
  let sent = 0;
  const client = createApiClient({ authenticated: true, updateToken: () => { throw new Error('Must not refresh'); } });
  await client.post('/api/rdv', {}, { adapter: async config => {
    sent++;
    assert.equal(config.headers.Authorization, undefined);
    return response(config);
  } });
  assert.equal(sent, 1);
});

test('a real HTTP response that never arrives times out without retrying a write', async () => {
  let received = 0;
  const server = createServer(() => { received++; });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const client = createApiClient({ authenticated: false });
    await assert.rejects(client.post(`http://127.0.0.1:${server.address().port}/appointment`, {}, { timeout: 100, proxy: false }), { code: 'ETIMEDOUT' });
    assert.equal(received, 1);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
