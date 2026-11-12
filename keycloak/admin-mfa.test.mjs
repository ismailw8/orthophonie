import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const policy = JSON.parse(fs.readFileSync(new URL('./realm-export.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
const marker = 'ROLE_MFA_REQUIRED';
const mfaFlow = 'orthophoniste-browser-admin-mfa';
const developmentFlow = 'orthophoniste-browser-development';
const flows = new Map(policy.authenticationFlows.map(flow => [flow.alias, flow]));
const configs = new Map(policy.authenticatorConfig.map(config => [config.alias, config.config]));

function effectiveRoles(assigned) {
  const result = new Set(assigned);
  const visit = name => {
    const role = policy.roles.realm.find(role => role.name === name);
    for (const composite of role?.composites?.realm || []) {
      if (!result.has(composite)) { result.add(composite); visit(composite); }
    }
  };
  for (const role of assigned) visit(role);
  return result;
}

function applies(flow, assignedRoles) {
  const roleCondition = flow.authenticationExecutions.find(execution => execution.authenticator === 'conditional-user-role');
  const config = configs.get(roleCondition.authenticatorConfig);
  const matches = effectiveRoles(assignedRoles).has(config.condUserRole);
  return config.negate === 'true' ? !matches : matches;
}

test('administrator roles retain MFA role inheritance for reactivation', () => {
  for (const roles of [['ROLE_ADMIN'], ['ROLE_SUPER_ADMIN'], ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'], ['ROLE_ADMIN', 'ROLE_USER']]) {
    assert.equal(effectiveRoles(roles).has(marker), true);
  }
});

test('patients and service accounts do not inherit admin privileges or mandatory MFA', () => {
  for (const roles of [['ROLE_USER'], ['ROLE_SERVICE'], [marker]]) {
    assert.equal(effectiveRoles(roles).has('ROLE_ADMIN'), false);
    assert.equal(effectiveRoles(roles).has('ROLE_SUPER_ADMIN'), false);
  }
  assert.equal(effectiveRoles(['ROLE_USER']).has(marker), false);
  assert.equal(effectiveRoles(['ROLE_SERVICE']).has(marker), false);
});

test('the browser flow requires a password before evaluating OTP', () => {
  const browser = flows.get(policy.browserFlow);
  assert.equal(browser.topLevel, true);
  const forms = flows.get(browser.authenticationExecutions.find(execution => execution.authenticatorFlow).flowAlias);
  const ordered = [...forms.authenticationExecutions].sort((a, b) => a.priority - b.priority);
  assert.equal(ordered[0].authenticator, 'auth-username-password-form');
  assert.equal(ordered[0].requirement, 'REQUIRED');
  assert.equal(ordered[1].requirement, 'CONDITIONAL');
});

test('an unenrolled admin cannot skip OTP based on credential configuration, attributes or headers', () => {
  const admins = flows.get(`${mfaFlow}-admins`);
  assert.deepEqual(admins.authenticationExecutions.map(execution => execution.authenticator), ['conditional-user-role', 'auth-otp-form']);
  assert.equal(admins.authenticationExecutions[1].requirement, 'REQUIRED');
  assert.deepEqual(configs.get(admins.authenticationExecutions[0].authenticatorConfig), { condUserRole: marker, negate: 'false' });
});

test('admin and optional OTP branches are mutually exclusive, including users with both admin roles', () => {
  const admins = flows.get(`${mfaFlow}-admins`);
  const optional = flows.get(`${mfaFlow}-optional-otp`);
  for (const roles of [['ROLE_ADMIN'], ['ROLE_SUPER_ADMIN'], ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'], ['ROLE_USER']]) {
    assert.notEqual(applies(admins, roles), applies(optional, roles));
  }
  assert.equal(applies(admins, ['ROLE_USER']), false);
  assert.equal(applies(admins, ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']), true);
  assert.equal(optional.authenticationExecutions.some(execution => execution.authenticator === 'conditional-user-configured'), true);
});

test('enrollment follows the selected mode without being a default action for patients', () => {
  const action = policy.requiredActions.find(action => action.alias === 'CONFIGURE_TOTP');
  assert.equal(action.enabled, true);
  assert.equal(action.defaultAction, false);
  for (const user of policy.users.filter(user => !user.serviceAccountClientId && user.realmRoles?.some(role => ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(role)))) {
    assert.equal(user.requiredActions.includes('CONFIGURE_TOTP'), policy.browserFlow === mfaFlow);
  }
});

test('OTP uses six digits, thirty seconds and rejects code reuse', () => {
  assert.equal(policy.otpPolicyType, 'totp');
  assert.equal(policy.otpPolicyDigits, 6);
  assert.equal(policy.otpPolicyPeriod, 30);
  assert.equal(policy.otpPolicyCodeReusable, false);
});

test('the web client cannot bypass the browser flow with a direct password grant', () => {
  const client = policy.clients.find(client => client.clientId === 'orthophoniste-web');
  assert.equal(client.directAccessGrantsEnabled, false);
  assert.equal(client.authenticationFlowBindingOverrides?.browser, undefined);
});

test('new installations retain password updates, password recovery and service authentication', () => {
  assert.equal(policy.requiredActions.find(action => action.alias === 'UPDATE_PASSWORD')?.enabled, true);
  for (const binding of ['resetCredentialsFlow', 'registrationFlow', 'directGrantFlow', 'clientAuthenticationFlow']) {
    assert.ok(flows.has(policy[binding]), `Missing standard flow: ${binding}`);
  }
});

test('development login skips OTP for admins while preserving their roles and the MFA configuration', () => {
  const browser = flows.get(developmentFlow);
  const forms = flows.get(browser.authenticationExecutions.find(execution => execution.authenticatorFlow).flowAlias);
  assert.equal(forms.authenticationExecutions[0].authenticator, 'auth-username-password-form');
  assert.equal(forms.authenticationExecutions[0].requirement, 'REQUIRED');
  const otpBranches = forms.authenticationExecutions.filter(execution => execution.authenticatorFlow);
  assert.equal(otpBranches.length, 1);
  const optional = flows.get(otpBranches[0].flowAlias);
  for (const roles of [['ROLE_ADMIN'], ['ROLE_SUPER_ADMIN'], ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'], ['ROLE_ADMIN', 'ROLE_USER']]) {
    assert.equal(applies(optional, roles), false);
  }
  assert.equal(applies(optional, ['ROLE_USER']), true);
  assert.ok(flows.has(`${mfaFlow}-admins`));
});
