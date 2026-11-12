import { after, afterEach, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { formatDate, localDay } from '../src/utils/workflow.js';

// Component interactions run in a DOM simulation, with no real accounts or writes.
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:5180' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLDialogElement', 'MutationObserver']) Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
// Charts observe their container; the DOM simulation supplies a fixed test size.
class TestResizeObserver {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: 640, height: 320 } }]); }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = dom.window.ResizeObserver = TestResizeObserver;
const { render, cleanup, screen, fireEvent, waitFor, within } = await import('@testing-library/react');

let server, AuthProvider, appRoutes, keycloak, router;
let fixtures, requests, failures;
const dayAfter = offset => { const day = new Date(); day.setDate(day.getDate() + offset); return localDay(day); };

before(async () => {
  server = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  ({ default: keycloak } = await server.ssrLoadModule('/src/auth/keycloak.js'));
  keycloak.authenticated = true; keycloak.token = 'component-test-token'; keycloak.init = async () => true; keycloak.updateToken = async () => false;
  ({ AuthProvider } = await server.ssrLoadModule('/src/context/AuthContext.jsx'));
  ({ appRoutes } = await server.ssrLoadModule('/src/routes.jsx'));
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js');
  api.defaults.adapter = async config => {
    requests.push({ method: config.method, url: config.url, data: config.data });
    if (failures.has(config.url)) throw Object.assign(new Error('Service unavailable'), { response: { status: 503 }, request: {}, config });
    let data;
    const payload = config.data ? JSON.parse(config.data) : null;
    if (config.url === '/api/suivi/admin/bilans' && ['put', 'post'].includes(config.method)) {
      data = { ...payload, id: 'bilan-1', updatedAt: `${localDay()}T12:00:00` }; fixtures.bilans = [data];
    } else if (config.url === '/api/auth/register-patient') {
      data = { ...payload, id: 'patient-2', enabled: true }; fixtures.patients.push(data);
    } else if (config.method === 'put' && config.url.includes('/annuler')) {
      fixtures.appointments = fixtures.appointments.map(item => config.url.includes(item.id) ? { ...item, status: 'ANNULE' } : item); data = {};
    } else if (config.url === '/api/suivi/mon-dashboard') {
      data = { bilan: fixtures.bilans[0], progressionGlobale: 65, seancesEffectuees: 0, seancesPrevues: 1, prochainesSeances: fixtures.sessions, seancesPassees: [] };
    } else if (config.url.includes('seances')) data = fixtures.sessions;
    else if (config.url.includes('bilans')) data = fixtures.bilans;
    else if (config.url.includes('/patients')) data = fixtures.patients;
    else if (config.url.includes('indisponibilites') || config.url.includes('creneaux-occupes')) data = [];
    else if (config.url === '/api/rdv' && config.method === 'post') data = { ...payload, id: 'new-request', status: 'EN_ATTENTE' };
    else data = fixtures.appointments;
    return { data: structuredClone(data), status: 200, statusText: 'OK', headers: {}, config };
  };
});

beforeEach(() => {
  failures = new Set(); requests = [];
  keycloak.init = async () => true;
  keycloak.tokenParsed = { realm_access: { roles: ['ROLE_ADMIN'] }, given_name: 'Admin', family_name: 'Test', email: 'admin@example.com' };
  fixtures = {
    patients: [{ id: 'patient-1', firstName: 'Lina', lastName: 'Test', email: 'lina@example.com', enabled: true }],
    bilans: [{ id: 'bilan-1', patientId: 'patient-1', patientNom: 'Lina Test', patientEmail: 'lina@example.com', progressionGlobale: 65, axes: [{ nom: 'Articulation', pourcentage: 65, commentaire: '' }], remarques: '' }],
    appointments: [
      { id: 'confirmed-1', firstName: 'Lina', lastName: 'Test', email: 'lina@example.com', dateSouhaitee: dayAfter(1), heureSouhaitee: '09:00', dateConfirmee: `${dayAfter(2)}T14:45:00`, status: 'CONFIRME' },
      { id: 'pending-1', firstName: 'Noé', lastName: 'Test', email: 'noe@example.com', dateSouhaitee: dayAfter(1), heureSouhaitee: '10:00', status: 'EN_ATTENTE' },
    ],
    sessions: [{ id: 'session-1', patientId: 'patient-1', patientEmail: 'lina@example.com', titre: 'Séance articulation', dateSeance: `${dayAfter(3)}T11:00:00`, effectuee: false }],
  };
});
afterEach(() => { cleanup(); router?.dispose(); });
after(async () => { await server?.close(); dom.window.close(); });
const mount = path => { router = createMemoryRouter(appRoutes, { initialEntries: [path] }); render(createElement(AuthProvider, null, createElement(RouterProvider, { router }))); };

test('the public home menu closes on section navigation and its booking link opens the form', async () => {
  keycloak.init = async () => false;
  mount('/');
  await screen.findByRole('heading', { level: 1, name: /Les mots ouvrent/ });
  const main = screen.getByRole('main');
  assert.equal(within(main).getByRole('link', { name: 'Mon espace personnel' }).getAttribute('href'), '/login');
  const menu = screen.getByRole('button', { name: 'Menu', exact: true });
  fireEvent.click(menu);
  assert.equal(screen.getByRole('button', { name: 'Fermer', exact: true }).getAttribute('aria-expanded'), 'true');
  fireEvent.click(screen.getByRole('link', { name: 'Le cabinet', exact: true }));
  assert.equal(screen.getByRole('button', { name: 'Menu', exact: true }).getAttribute('aria-expanded'), 'false');
  fireEvent.click(within(main).getByRole('link', { name: 'Demander un rendez-vous', exact: true }));
  await screen.findByRole('heading', { name: 'Demander un rendez-vous', exact: true });
  assert.equal(router.state.location.pathname, '/rendez-vous');
  assert.equal(requests.some(item => ['put', 'post'].includes(item.method)), false);
});

test('the home personal space link sends a signed-in administrator to their dashboard', async () => {
  mount('/');
  await screen.findByRole('heading', { level: 1, name: /Les mots ouvrent/ });
  const account = within(screen.getByRole('main')).getByRole('link', { name: 'Mon espace personnel' });
  await waitFor(() => assert.equal(account.getAttribute('href'), '/espace'));
  fireEvent.click(account);
  await screen.findByRole('heading', { name: 'Tableau de bord', exact: true });
  assert.equal(router.state.location.pathname, '/admin');
});

test('home motion reveals focused content, respects preference changes and releases observers on navigation', async () => {
  const originalMedia = window.matchMedia;
  const originalObserver = window.IntersectionObserver;
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  const listeners = new Set();
  let observer;
  window.matchMedia = () => ({ matches: false, addEventListener: (_, callback) => listeners.add(callback), removeEventListener: (_, callback) => listeners.delete(callback) });
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.pending = new Set(); observer = this; }
    observe(element) { this.pending.add(element); }
    unobserve(element) { this.pending.delete(element); }
    disconnect() { this.pending.clear(); this.disconnected = true; }
  };
  HTMLElement.prototype.getBoundingClientRect = () => ({ top: 1500, bottom: 1700, height: 200, width: 600, left: 0, right: 600 });
  try {
    mount('/');
    await screen.findByRole('heading', { level: 1, name: /Les mots ouvrent/ });
    const contact = screen.getByRole('heading', { name: /Le premier pas/ }).closest('section');
    assert.ok(observer.pending.has(contact));
    fireEvent.focusIn(within(contact).getByRole('link', { name: 'Voir les disponibilités' }));
    assert.equal(observer.pending.has(contact), false);
    assert.ok(contact.classList.contains('is-visible'));
    const service = screen.getByRole('heading', { name: 'Comprendre vos besoins' }).closest('article');
    observer.callback([{ target: service, isIntersecting: true }]);
    assert.equal(observer.pending.has(service), false);
    for (const listener of listeners) listener({ matches: true });
    assert.equal(document.querySelectorAll('.home-motion-reveal').length, 0);
    assert.ok(observer.disconnected);
    fireEvent.click(within(contact).getByRole('link', { name: 'Voir les disponibilités' }));
    await screen.findByRole('heading', { name: 'Demander un rendez-vous', exact: true });
    assert.equal(listeners.size, 0);
  } finally {
    cleanup(); router?.dispose();
    window.matchMedia = originalMedia;
    window.IntersectionObserver = originalObserver;
    HTMLElement.prototype.getBoundingClientRect = originalRect;
  }
});

test('the administrator home links to the agenda on the first navigation', async () => {
  mount('/admin');
  await screen.findByRole('heading', { name: 'Tableau de bord' });
  await screen.findByText('Noé Test');
  fireEvent.click(screen.getByRole('link', { name: 'Ouvrir l’agenda' }));
  await screen.findByRole('heading', { name: 'Agenda du cabinet' });
  await screen.findByRole('button', { name: 'Confirmer', exact: true });
  assert.equal(router.state.location.pathname, '/admin/agenda');
});

test('patient search opens a dossier and tabs load without a page refresh', async () => {
  mount('/admin/patients');
  await screen.findByText('Lina Test');
  fireEvent.change(screen.getByRole('textbox', { name: 'Rechercher' }), { target: { value: 'lina@' } });
  fireEvent.click(screen.getByRole('link', { name: /Lina Test/ }));
  await screen.findByRole('heading', { name: 'Lina Test' });
  fireEvent.click(screen.getByRole('link', { name: 'Séances', exact: true }));
  await screen.findByText('Séance articulation');
  fireEvent.click(screen.getByRole('link', { name: 'Rendez-vous', exact: true }));
  await screen.findByText(formatDate(fixtures.appointments[0].dateConfirmee));
});

test('a dirty bilan blocks navigation until it is saved or explicitly discarded', async () => {
  mount('/admin/patients/patient-1?onglet=bilan');
  const progress = await screen.findByRole('spinbutton', { name: 'Progression globale (%)' });
  fireEvent.change(progress, { target: { value: '72' } });
  fireEvent.click(screen.getByRole('link', { name: 'Séances', exact: true }));
  await screen.findByRole('dialog', { name: 'Modifications non enregistrées' });
  fireEvent.click(screen.getByRole('button', { name: 'Continuer la saisie' }));
  assert.equal(router.state.location.search, '?onglet=bilan');
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le bilan' }));
  await screen.findByText('Bilan enregistré.');
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Enregistrer le bilan' }).disabled, true));
  assert.equal(requests.filter(item => item.method === 'put' && item.url.endsWith('/bilans')).length, 1);
  assert.equal(fixtures.bilans[0].progressionGlobale, 72);
  fireEvent.click(screen.getByRole('link', { name: 'Séances', exact: true }));
  await screen.findByRole('heading', { name: 'Séances du patient' });
  assert.equal(screen.queryByRole('dialog'), null);
});

test('the patient home displays stored goal progress and the confirmed appointment', async () => {
  keycloak.tokenParsed = { realm_access: { roles: ['ROLE_USER'] }, given_name: 'Lina', email: 'lina@example.com' };
  mount('/dashboard');
  await screen.findByText(formatDate(fixtures.appointments[0].dateConfirmee));
  const bar = await screen.findByRole('progressbar', { name: 'Articulation' });
  assert.equal(bar.getAttribute('aria-valuenow'), '65');
});

test('patient cancellation requires confirmation and sends a single write', async () => {
  keycloak.tokenParsed = { realm_access: { roles: ['ROLE_USER'] }, given_name: 'Lina', email: 'lina@example.com' };
  fixtures.appointments = [fixtures.appointments[0]];
  mount('/mes-rendez-vous');
  await screen.findByText(formatDate(fixtures.appointments[0].dateConfirmee));
  fireEvent.click(screen.getByRole('button', { name: 'Annuler', exact: true }));
  await screen.findByRole('dialog', { name: 'Annuler ce rendez-vous ?' });
  assert.equal(requests.filter(item => item.method === 'put').length, 0);
  fireEvent.click(screen.getByRole('button', { name: 'Confirmer l’annulation' }));
  await screen.findByText('Rendez-vous annulé.');
  assert.equal(requests.filter(item => item.method === 'put').length, 1);
});

test('statistics filter by the confirmed date, not the original request date', async () => {
  mount('/admin/statistics');
  await screen.findByRole('heading', { name: 'Statistiques' }, { timeout: 5000 });
  fireEvent.click(screen.getByRole('button', { name: 'Personnalisée' }));
  fireEvent.change(screen.getByLabelText('Du'), { target: { value: dayAfter(2) } });
  fireEvent.change(screen.getByLabelText('Au'), { target: { value: dayAfter(2) } });
  await waitFor(() => assert.match(screen.getByText('Rendez-vous sur la période').closest('section').textContent, /1/));
  const table = screen.getByRole('table', { name: 'Répartition des rendez-vous par statut' });
  const row = within(table).getByRole('row', { name: /Confirmé/ });
  assert.equal(within(row).getAllByRole('cell')[0].textContent, '1');
  assert.equal(within(row).getAllByRole('cell')[1].textContent, '100 %');
});

test('statistics render three charts and paginated tables with stable period totals', async () => {
  mount('/admin/statistics');
  await screen.findByRole('heading', { name: 'Statistiques' }, { timeout: 5000 });
  fireEvent.click(screen.getByRole('button', { name: 'Personnalisée' }));
  fireEvent.change(screen.getByLabelText('Du'), { target: { value: dayAfter(1) } });
  fireEvent.change(screen.getByLabelText('Au'), { target: { value: dayAfter(10) } });
  const table = await screen.findByRole('table', { name: 'Activité détaillée sur la période' });
  await waitFor(() => assert.equal(document.querySelectorAll('svg.recharts-surface').length, 3));
  assert.ok(screen.getByRole('img', { name: /Évolution des rendez-vous et des séances par jour/ }));
  assert.equal(within(table).getAllByRole('row').length, 10);
  const totalBefore = within(within(table).getByRole('row', { name: /Total de la période/ })).getAllByRole('cell').map(cell => cell.textContent);
  assert.deepEqual(totalBefore, ['2', '1', '0', '0', '1', '0']);
  fireEvent.click(screen.getByRole('button', { name: 'Suivant', exact: true }));
  assert.equal(within(table).getAllByRole('row').length, 4);
  const totalAfter = within(within(table).getByRole('row', { name: /Total de la période/ })).getAllByRole('cell').map(cell => cell.textContent);
  assert.deepEqual(totalAfter, totalBefore);
  assert.ok(screen.getByText(/Page 2 sur 2/));
});

test('selecting a calendar day keeps events visible on other days', async () => {
  mount('/admin/agenda');
  await screen.findByRole('button', { name: 'Confirmer', exact: true });
  fireEvent.click(screen.getByRole('button', { name: 'Calendrier' }));
  const day = screen.getByRole('button', { name: `${formatDate(dayAfter(1), false)}, 1 événement(s)` });
  fireEvent.click(day);
  assert.ok(screen.getByText('14:45 Lina Test · Confirmé'));
});

test('a failed suivi load offers retry and recovers without a refresh', async () => {
  failures.add('/api/suivi/admin/bilans');
  mount('/admin/bilans');
  const retry = await screen.findByRole('button', { name: 'Réessayer' });
  assert.equal(screen.queryByText('Aucun bilan enregistré.'), null);
  failures.clear(); fireEvent.click(retry);
  await screen.findByText('Lina Test');
});

test('new patient creation leads directly to the new dossier', async () => {
  mount('/admin/comptes-patients');
  await screen.findByRole('heading', { name: 'Nouveau patient' });
  for (const [label, value] of [['Prénom', 'Adam'], ['Nom', 'Test'], ['Adresse e-mail', 'adam@example.com'], ['Mot de passe temporaire', 'Example123!']]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));
  const dossier = await screen.findByRole('link', { name: 'Ouvrir le dossier patient' });
  fireEvent.click(dossier);
  await screen.findByRole('heading', { name: 'Adam Test' });
  assert.equal(requests.filter(item => item.method === 'post').length, 1);
});

test('patients cannot navigate to administrator pages', async () => {
  keycloak.tokenParsed = { realm_access: { roles: ['ROLE_USER'] }, given_name: 'Lina', email: 'lina@example.com' };
  mount('/admin');
  await screen.findByRole('heading', { name: 'Bonjour Lina' });
  assert.equal(router.state.location.pathname, '/dashboard');
  assert.equal(requests.some(item => item.url === '/api/rdv/admin'), false);
});

test('explicitly discarding a dirty bilan leaves without sending a write', async () => {
  mount('/admin/patients/patient-1?onglet=bilan');
  const note = await screen.findByLabelText('Note du cabinet');
  fireEvent.change(note, { target: { value: 'Unsaved draft' } });
  fireEvent.click(screen.getByRole('link', { name: 'Patients', exact: true }));
  await screen.findByRole('dialog', { name: 'Modifications non enregistrées' });
  fireEvent.click(screen.getByRole('button', { name: 'Quitter sans enregistrer' }));
  await screen.findByRole('heading', { name: 'Patients', exact: true });
  assert.equal(requests.some(item => ['put', 'post'].includes(item.method)), false);
});

test('the booking wizard preserves its recap and sends one pending request', async () => {
  keycloak.tokenParsed = { realm_access: { roles: ['ROLE_USER'] }, given_name: 'Lina', family_name: 'Test', email: 'lina@example.com' };
  mount('/rendez-vous');
  const dateInput = await screen.findByLabelText('Choisir une date');
  const date = new Date(); date.setDate(date.getDate() + 10);
  while ([0, 6].includes(date.getDay())) date.setDate(date.getDate() + 1);
  const day = localDay(date);
  fireEvent.change(dateInput, { target: { value: day } });
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Choisir l’horaire' }).disabled, false));
  fireEvent.click(screen.getByRole('button', { name: 'Choisir l’horaire' }));
  fireEvent.click(screen.getByRole('button', { name: '10:00', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuer', exact: true }));
  const phone = screen.getByLabelText('Téléphone');
  fireEvent.change(phone, { target: { value: '+212612345678' } });
  assert.doesNotThrow(() => new RegExp(phone.pattern, 'v'));
  assert.equal(phone.validity.valid, true);
  assert.equal(screen.getByLabelText('Adresse e-mail').value, 'lina@example.com');
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer la demande' }));
  await screen.findByRole('heading', { name: 'Demande envoyée' });
  assert.ok(screen.getByText('En attente de confirmation', { exact: true }));
  assert.ok(screen.getByText(formatDate(day, false)));
  assert.ok(screen.getByText('10:00', { exact: true }));
  assert.equal(requests.filter(item => item.method === 'post' && item.url === '/api/rdv').length, 1);
});
