import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateReadiness } from '../dist/index.js';

const req = (code, state, targets, role='PRESCREEN_ASSESSOR') => ({
  requirementCode: code, label: code, state, blockingTargets: targets,
  responsibleRoleCode: role, resolutionWorkspace: 'Packet', sourceRuleId: 'facility-rule', sourceRuleVersion: 1,
});

test('target readiness is ready when no target blockers exist', () => {
  const result = evaluateReadiness('CENTRAL_INTAKE_REVIEW', [
    req('DEMOGRAPHICS','ACCEPTED_FOR_PACKET',['CENTRAL_INTAKE_REVIEW']),
    req('LABS','MISSING',['FACILITY_ROUTING']),
  ]);
  assert.equal(result.ready, true);
  assert.equal(result.blockers.length, 0);
});

test('missing target requirement is a blocker with resolution metadata', () => {
  const result = evaluateReadiness('FACILITY_ROUTING', [req('MAR','MISSING',['FACILITY_ROUTING'],'SENDING_NURSE')]);
  assert.equal(result.ready, false);
  assert.equal(result.blockers[0].responsibleRoleCode, 'SENDING_NURSE');
  assert.equal(result.blockers[0].sourceRuleId, 'facility-rule');
});

test('received but under review is a warning rather than a blocker', () => {
  const result = evaluateReadiness('CENTRAL_INTAKE_REVIEW', [req('NOTES','RECEIVED',['CENTRAL_INTAKE_REVIEW'])]);
  assert.equal(result.ready, true);
  assert.equal(result.warnings.length, 1);
});

test('not applicable with authority satisfies the requirement', () => {
  const result = evaluateReadiness('FACILITY_ROUTING', [req('OXYGEN','NOT_APPLICABLE_WITH_AUTHORITY',['FACILITY_ROUTING'])]);
  assert.equal(result.ready, true);
});
