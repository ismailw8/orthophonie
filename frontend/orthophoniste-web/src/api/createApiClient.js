import axios from 'axios';
import { REQUEST_TIMEOUT_MS, withRequestDeadline } from './requestDeadline.js';

const isPublicRequest = config => {
  const url = String(config.url || '').split('?')[0];
  const method = String(config.method || 'get').toLowerCase();
  return (url === '/api/rdv' && method === 'post')
    || (url === '/api/rdv/creneaux-occupes' && method === 'get')
    || (url === '/api/rdv/indisponibilites' && method === 'get')
    || (url === '/api/suivi/creneaux-occupes' && method === 'get');
};

export function createApiClient(keycloak) {
  const client = axios.create({
    baseURL: '',
    timeout: REQUEST_TIMEOUT_MS,
    transitional: { clarifyTimeoutError: true },
    headers: { 'Content-Type': 'application/json' },
  });
  client.interceptors.request.use(async config => {
    const startedAt = Date.now();
    const budget = config.timeout || REQUEST_TIMEOUT_MS;
    if (!isPublicRequest(config) && keycloak.authenticated) {
      await withRequestDeadline(() => keycloak.updateToken(30), {
        timeoutMs: budget,
        signal: config.signal,
      });
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    } else delete config.headers.Authorization;
    // Token refresh and the HTTP request share the same time budget.
    const remaining = budget - (Date.now() - startedAt);
    if (remaining <= 0) throw Object.assign(new Error('Délai de chargement dépassé.'), { code: 'ETIMEDOUT' });
    config.timeout = remaining;
    return config;
  });
  client.interceptors.response.use(response => response, error => {
    if (error?.response?.status === 401 && keycloak.authenticated) keycloak.login();
    return Promise.reject(error);
  });
  return client;
}
