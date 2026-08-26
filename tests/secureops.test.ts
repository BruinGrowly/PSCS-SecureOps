import assert from 'node:assert/strict';
import test from 'node:test';
import {
  inspectSecureOps,
  issueHumanGrant,
  scenarios,
  type Consequence,
} from '../app/lib/secureops.ts';

test('the four authored scenarios produce their declared dispositions', async () => {
  for (const scenario of scenarios) {
    const grant = await issueHumanGrant(scenario);
    const decision = await inspectSecureOps(scenario, scenario.proposal, grant, {
      consume: true,
      ledger: new Set<string>(),
    });
    assert.equal(decision.disposition, scenario.expected, scenario.id);
    assert.equal(decision.purposeRetained, true, scenario.id);
  }
});

test('direct injection cannot substitute operation, target, or payload', async () => {
  const scenario = scenarios[1];
  const decision = await inspectSecureOps(scenario, scenario.proposal, await issueHumanGrant(scenario));
  assert.equal(decision.permitted, false);
  assert.deepEqual(decision.reasonCodes, ['operation_mismatch', 'target_mismatch', 'payload_mismatch']);
});

test('authority impersonation remains an untrusted carrier claim', async () => {
  const scenario = scenarios[2];
  const decision = await inspectSecureOps(scenario, scenario.proposal, await issueHumanGrant(scenario));
  assert.equal(decision.verdict, 'QUARANTINE');
  assert.match(decision.trace[2].detail, /no authenticated standing/);
});

test('quoted hostile text is quarantined without blocking authorized analysis', async () => {
  const scenario = scenarios[3];
  const decision = await inspectSecureOps(scenario, scenario.proposal, await issueHumanGrant(scenario));
  assert.equal(decision.permitted, true);
  assert.equal(decision.disposition, 'allow_with_quarantine');
  assert.equal(decision.quarantinedClaims, 1);
});

test('a legitimate task can continue after an injected proposal is blocked', async () => {
  const scenario = scenarios[1];
  const grant = await issueHumanGrant(scenario);
  const blocked = await inspectSecureOps(scenario, scenario.proposal, grant);
  const recovered = await inspectSecureOps(scenario, scenario.authorized, grant);
  assert.equal(blocked.permitted, false);
  assert.equal(recovered.permitted, true);
});

test('payload substitution alone fails the exact digest binding', async () => {
  const scenario = scenarios[0];
  const changed: Consequence = { ...scenario.proposal, payload: 'different-reset' };
  const decision = await inspectSecureOps(scenario, changed, await issueHumanGrant(scenario));
  assert.deepEqual(decision.reasonCodes, ['payload_mismatch']);
});

test('a consumed runtime grant cannot be replayed', async () => {
  const scenario = scenarios[0];
  const grant = await issueHumanGrant(scenario);
  const ledger = new Set<string>();
  const first = await inspectSecureOps(scenario, scenario.proposal, grant, { consume: true, ledger });
  const second = await inspectSecureOps(scenario, scenario.proposal, grant, { consume: true, ledger });
  assert.equal(first.effectPermitted, true);
  assert.equal(second.permitted, false);
  assert.deepEqual(second.reasonCodes, ['grant_replay']);
});

test('each human issuance has a unique grant identity and generic authority source', async () => {
  const scenario = scenarios[0];
  const first = await issueHumanGrant(scenario, 1_000, 'issuance-a');
  const second = await issueHumanGrant(scenario, 1_000, 'issuance-b');
  assert.notEqual(first.grantId, second.grantId);
  assert.equal(first.authoritySourceId, 'operator-session:demo');
});

test('a newly issued grant works after the prior grant is consumed', async () => {
  const scenario = scenarios[0];
  const ledger = new Set<string>();
  const firstGrant = await issueHumanGrant(scenario, 1_000, 'issuance-a');
  const secondGrant = await issueHumanGrant(scenario, 1_000, 'issuance-b');
  const first = await inspectSecureOps(scenario, scenario.proposal, firstGrant, { consume: true, ledger, now: 1_001 });
  const reissued = await inspectSecureOps(scenario, scenario.proposal, secondGrant, { consume: true, ledger, now: 1_001 });
  assert.equal(first.effectPermitted, true);
  assert.equal(reissued.effectPermitted, true);
});

test('missing and expired authority fail closed', async () => {
  const scenario = scenarios[0];
  const missing = await inspectSecureOps(scenario, scenario.proposal, null);
  const grant = await issueHumanGrant(scenario, 1_000);
  const expired = await inspectSecureOps(scenario, scenario.proposal, grant, { now: grant.expiresAt });
  assert.deepEqual(missing.reasonCodes, ['authority_absent']);
  assert.deepEqual(expired.reasonCodes, ['grant_time_window_invalid']);
});
