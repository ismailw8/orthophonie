import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policyFile = path.join(projectRoot, 'keycloak/realm-export.json');
const policy = JSON.parse(fs.readFileSync(policyFile, 'utf8').replace(/^\uFEFF/, ''));
const marker = 'ROLE_MFA_REQUIRED';
const adminRoles = ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'];
const flowPrefix = 'orthophoniste-browser-admin-mfa';
const developmentFlow = 'orthophoniste-browser-development';
const enable = process.argv.includes('--enable');
const disable = process.argv.includes('--disable');
if (enable && disable) throw new Error('Choisir --enable ou --disable, pas les deux.');
const targetFlow = enable ? flowPrefix : disable ? developmentFlow : policy.browserFlow;
const mfaEnabled = targetFlow === flowPrefix;
const customFlows = new Map(policy.authenticationFlows.filter(flow => flow.alias.startsWith(flowPrefix) || flow.alias.startsWith(developmentFlow)).map(flow => [flow.alias, flow]));
const desiredFlows = [];
const visited = new Set();
function appendFlow(alias) {
  if (visited.has(alias)) return;
  visited.add(alias);
  const flow = customFlows.get(alias);
  if (!flow) throw new Error(`Parcours MFA introuvable: ${alias}.`);
  desiredFlows.push(flow);
  for (const execution of flow.authenticationExecutions) if (execution.authenticatorFlow) appendFlow(execution.flowAlias);
}
appendFlow(flowPrefix);
appendFlow(developmentFlow);
const desiredConfigs = new Map(policy.authenticatorConfig.map(config => [config.alias, config]));
const apply = process.argv.includes('--apply') || enable || disable;
const baseUrl = 'http://localhost:8180';
const realmPath = `/realms/${encodeURIComponent(policy.realm)}`;

const environment = { ...process.env };
const envFile = path.join(projectRoot, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (match && !environment[match[1]]) environment[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
}

let token;
let tokenExpiresAt = 0;
async function authenticate() {
  if (Date.now() < tokenExpiresAt) return;
  const response = await fetch(`${baseUrl}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password', client_id: 'admin-cli',
      username: environment.KC_BOOTSTRAP_ADMIN_USERNAME || environment.KEYCLOAK_ADMIN_USERNAME || 'admin',
      password: environment.KC_BOOTSTRAP_ADMIN_PASSWORD || environment.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Authentification d'administration Keycloak refusée (HTTP ${response.status}).`);
  const session = await response.json();
  token = session.access_token;
  tokenExpiresAt = Date.now() + Math.max(1, session.expires_in - 10) * 1000;
}

async function api(relativePath, { method = 'GET', body } = {}) {
  await authenticate();
  const response = await fetch(`${baseUrl}/admin${relativePath}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`${method} ${relativePath}: HTTP ${response.status}.`);
  if (response.status === 204 || response.headers.get('content-length') === '0') return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function adminUsers() {
  const users = new Map();
  for (const role of adminRoles) {
    let first = 0;
    while (true) {
      const page = await api(`${realmPath}/roles/${role}/users?first=${first}&max=100`);
      for (const user of page) if (!user.serviceAccountClientId) users.set(user.id, user);
      if (page.length < 100) break;
      first += page.length;
    }
  }
  return [...users.values()];
}

async function ensureFlows() {
  // Create parents before their children. Existing flows are updated in place.
  for (const desired of desiredFlows) {
    if (desired.topLevel) {
      const flows = await api(`${realmPath}/authentication/flows`);
      if (flows.some(flow => flow.alias === desired.alias)) continue;
      await api(`${realmPath}/authentication/flows`, {
        method: 'POST', body: { alias: desired.alias, description: desired.description, providerId: 'basic-flow', topLevel: true, builtIn: false },
      });
    } else {
      const parent = desiredFlows.find(flow => flow.authenticationExecutions.some(execution => execution.flowAlias === desired.alias));
      if (!parent) throw new Error(`Parent introuvable pour ${desired.alias}.`);
      // The flows endpoint lists top-level flows. Check child executions to
      // detect an existing subflow instead of attempting to create it again.
      const executions = await api(`${realmPath}/authentication/flows/${parent.alias}/executions`);
      if (executions.some(execution => execution.level === 0 && execution.displayName === desired.alias)) continue;
      await api(`${realmPath}/authentication/flows/${parent.alias}/executions/flow`, {
        method: 'POST', body: { alias: desired.alias, description: desired.description, type: 'basic-flow', provider: 'basic-flow' },
      });
    }
  }
  for (const flow of desiredFlows) {
    for (const desired of flow.authenticationExecutions) {
      let executions = await api(`${realmPath}/authentication/flows/${flow.alias}/executions`);
      let execution = executions.find(item => item.level === 0 && (desired.authenticatorFlow ? item.displayName === desired.flowAlias : item.providerId === desired.authenticator));
      if (!execution && !desired.authenticatorFlow) {
        await api(`${realmPath}/authentication/flows/${flow.alias}/executions/execution`, { method: 'POST', body: { provider: desired.authenticator } });
        executions = await api(`${realmPath}/authentication/flows/${flow.alias}/executions`);
        execution = executions.find(item => item.level === 0 && item.providerId === desired.authenticator);
      }
      if (!execution) throw new Error(`Exécution introuvable dans ${flow.alias}.`);
      await api(`${realmPath}/authentication/flows/${flow.alias}/executions`, {
        method: 'PUT', body: { id: execution.id, requirement: desired.requirement, priority: desired.priority },
      });
      if (desired.authenticatorConfig) {
        const config = desiredConfigs.get(desired.authenticatorConfig);
        if (!config) throw new Error('Configuration OTP introuvable.');
        if (execution.authenticationConfig) {
          await api(`${realmPath}/authentication/config/${execution.authenticationConfig}`, { method: 'PUT', body: config });
        } else {
          await api(`${realmPath}/authentication/executions/${execution.id}/config`, { method: 'POST', body: config });
        }
      }
    }
  }
}

async function verifyFlows() {
  for (const flow of desiredFlows) {
    const executions = (await api(`${realmPath}/authentication/flows/${flow.alias}/executions`)).filter(item => item.level === 0);
    if (executions.length !== flow.authenticationExecutions.length) throw new Error(`Nombre d'exécutions inattendu dans ${flow.alias}.`);
    // Sorting by priority also catches a password step placed after OTP.
    executions.sort((a, b) => a.priority - b.priority);
    const expected = [...flow.authenticationExecutions].sort((a, b) => a.priority - b.priority);
    for (let index = 0; index < expected.length; index++) {
      const actual = executions[index], desired = expected[index];
      const identityMatches = desired.authenticatorFlow ? actual.displayName === desired.flowAlias : actual.providerId === desired.authenticator;
      if (!identityMatches || actual.requirement !== desired.requirement) throw new Error(`Exécution incorrecte dans ${flow.alias}.`);
      if (desired.authenticatorConfig) {
        if (!actual.authenticationConfig) throw new Error('Condition de rôle MFA absente.');
        const config = await api(`${realmPath}/authentication/config/${actual.authenticationConfig}`);
        const expectedConfig = desiredConfigs.get(desired.authenticatorConfig).config;
        for (const [key, value] of Object.entries(expectedConfig)) if (config.config[key] !== value) throw new Error(`Condition MFA incorrecte: ${key}.`);
      }
    }
  }
}

async function verify() {
  const realm = await api(realmPath);
  if (realm.browserFlow !== targetFlow) throw new Error('Le parcours navigateur ne correspond pas au mode demandé.');
  for (const key of ['otpPolicyType', 'otpPolicyAlgorithm', 'otpPolicyDigits', 'otpPolicyPeriod', 'otpPolicyCodeReusable']) {
    if (realm[key] !== policy[key]) throw new Error(`Politique OTP incorrecte: ${key}.`);
  }
  await verifyFlows();
  const webClients = await api(`${realmPath}/clients?clientId=orthophoniste-web`);
  const webClient = webClients.find(client => client.clientId === 'orthophoniste-web');
  if (!webClient || webClient.directAccessGrantsEnabled || webClient.authenticationFlowBindingOverrides?.browser) {
    throw new Error('Le client web doit utiliser le parcours navigateur du realm sans connexion directe par mot de passe.');
  }
  const actions = await api(`${realmPath}/authentication/required-actions`);
  const otp = actions.find(action => action.alias === 'CONFIGURE_TOTP');
  if (!otp?.enabled || otp.defaultAction) throw new Error('Action de configuration OTP incorrecte.');
  for (const role of adminRoles) {
    const composites = await api(`${realmPath}/roles/${role}/composites/realm`);
    if (!composites.some(item => item.name === marker)) throw new Error(`MFA absent du rôle ${role}.`);
  }
  const users = await adminUsers();
  const report = [];
  for (const user of users) {
    const representation = await api(`${realmPath}/users/${user.id}`);
    const credentials = await api(`${realmPath}/users/${user.id}/credentials`);
    const enrolled = credentials.some(credential => credential.type === 'otp');
    if (mfaEnabled && !enrolled && !representation.requiredActions.includes('CONFIGURE_TOTP')) throw new Error(`Activation OTP non demandée pour ${user.username}.`);
    if (!mfaEnabled && representation.requiredActions.includes('CONFIGURE_TOTP')) throw new Error(`Activation OTP encore demandée pour ${user.username}.`);
    const roles = await api(`${realmPath}/users/${user.id}/role-mappings/realm/composite`);
    if (!roles.some(role => role.name === marker)) throw new Error(`Rôle MFA effectif absent pour ${user.username}.`);
    report.push({ username: user.username, otpConfigured: enrolled, enrollmentRequired: representation.requiredActions.includes('CONFIGURE_TOTP') });
  }
  console.log(JSON.stringify({ realm: policy.realm, browserFlow: realm.browserFlow, adminMfaEnabled: mfaEnabled, administrators: report }, null, 2));
}

async function main() {
  if (!apply) return verify();
  const before = await api(realmPath);
  if (!['browser', flowPrefix, developmentFlow].includes(before.browserFlow)) throw new Error('Un parcours personnalisé différent est actif. Application interrompue.');
  const users = await adminUsers();
  const backup = {
    realm: policy.realm, browserFlow: before.browserFlow,
    otpPolicyType: before.otpPolicyType, otpPolicyAlgorithm: before.otpPolicyAlgorithm,
    otpPolicyDigits: before.otpPolicyDigits, otpPolicyPeriod: before.otpPolicyPeriod,
    users: users.map(user => ({ id: user.id, username: user.username, requiredActions: user.requiredActions })),
  };
  const runtimeRoot = path.join(projectRoot, '.runtime');
  fs.mkdirSync(runtimeRoot, { recursive: true });
  const backupFile = path.join(runtimeRoot, 'keycloak-admin-mfa-before.json');
  if (!fs.existsSync(backupFile)) fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  const roles = await api(`${realmPath}/roles`);
  if (!roles.some(role => role.name === marker)) {
    await api(`${realmPath}/roles`, { method: 'POST', body: { name: marker, description: 'Second facteur obligatoire pour les administrateurs.' } });
  }
  const markerRole = await api(`${realmPath}/roles/${marker}`);
  for (const role of adminRoles) await api(`${realmPath}/roles/${role}/composites`, { method: 'POST', body: [markerRole] });
  await ensureFlows();
  await verifyFlows();
  const otpAction = policy.requiredActions.find(action => action.alias === 'CONFIGURE_TOTP');
  await api(`${realmPath}/authentication/required-actions/CONFIGURE_TOTP`, { method: 'PUT', body: otpAction });
  const otpPolicy = Object.fromEntries(Object.entries(policy).filter(([key]) => key.startsWith('otpPolicy')));
  await api(realmPath, { method: 'PUT', body: { ...otpPolicy, browserFlow: targetFlow } });
  for (const user of users) {
    const representation = await api(`${realmPath}/users/${user.id}`);
    const credentials = await api(`${realmPath}/users/${user.id}/credentials`);
    if (!mfaEnabled) {
      await api(`${realmPath}/users/${user.id}`, { method: 'PUT', body: { requiredActions: representation.requiredActions.filter(action => action !== 'CONFIGURE_TOTP') } });
    } else if (!credentials.some(credential => credential.type === 'otp')) {
      await api(`${realmPath}/users/${user.id}`, { method: 'PUT', body: { requiredActions: [...new Set([...representation.requiredActions, 'CONFIGURE_TOTP'])] } });
    }
    if (mfaEnabled) await api(`${realmPath}/users/${user.id}/logout`, { method: 'POST' });
  }
  await verify();
  // Persist only after Keycloak confirms the requested mode. Keep OTP credentials
  // and the inactive MFA flows so enabling it again does not require recreation.
  policy.browserFlow = targetFlow;
  for (const user of policy.users || []) {
    if (user.serviceAccountClientId || !user.realmRoles?.some(role => adminRoles.includes(role))) continue;
    const actions = (user.requiredActions || []).filter(action => action !== 'CONFIGURE_TOTP');
    user.requiredActions = mfaEnabled ? [...actions, 'CONFIGURE_TOTP'] : actions;
  }
  fs.writeFileSync(policyFile, JSON.stringify(policy, null, 4) + '\n');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
