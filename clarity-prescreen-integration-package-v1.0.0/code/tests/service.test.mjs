import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryPrescreenService, DomainError } from '../dist/index.js';

const actor = { actorId:'assessor-1', organizationId:'org-1', roleCodes:['PRESCREEN_ASSESSOR'] };
const otherTenant = { actorId:'other-1', organizationId:'org-2', roleCodes:['PRESCREEN_ASSESSOR'] };
const meta = (key, expectedVersion) => ({ idempotencyKey:key, correlationId:`corr-${key}`, ...(expectedVersion === undefined ? {} : { expectedVersion }) });
const oriented = {
  observedAt:'2026-07-19T12:00:00Z', person:{status:'ORIENTED'}, place:{status:'ORIENTED'}, time:{status:'ORIENTED'}, situation:{status:'ORIENTED'},
};
const assessment = (encounterId, id='a1', versionNumber=1, parentVersionId) => ({
  assessmentVersionId:id, encounterId, organizationId:'org-1', versionNumber, status:'DRAFT',
  createdAt:'2026-07-19T12:05:00Z', createdBy:'assessor-1', willingness:'WILLING', orientation:oriented,
  possiblePathway:'UNDETERMINED', answers:[], sources:[], ...(parentVersionId === undefined ? {} : { parentVersionId }),
});

test('start is idempotent for same actor, command, key, and body', () => {
  const service = new InMemoryPrescreenService();
  const input = { caseId:'case-1', currentLocation:'Synthetic location', presentingConcern:'Synthetic concern', occurredAt:'2026-07-19T12:00:00Z' };
  const first = service.start(actor, meta('start-key-001'), input);
  const replay = service.start(actor, meta('start-key-001'), input);
  assert.equal(first.objectId,replay.objectId);
  assert.equal(replay.replayed,true);
});

test('idempotency key reuse with changed body fails', () => {
  const service = new InMemoryPrescreenService();
  service.start(actor, meta('start-key-002'), { caseId:'case-1', currentLocation:'A', presentingConcern:'Concern', occurredAt:'2026-07-19T12:00:00Z' });
  assert.throws(() => service.start(actor, meta('start-key-002'), { caseId:'case-1', currentLocation:'B', presentingConcern:'Concern', occurredAt:'2026-07-19T12:00:00Z' }),
    (error) => error instanceof DomainError && error.code === 'IDEMPOTENCY_KEY_REUSED');
});

test('draft, attest, and supplement preserve versions', () => {
  const service = new InMemoryPrescreenService();
  const started = service.start(actor, meta('start-key-003'), { caseId:'case-1', currentLocation:'Synthetic location', presentingConcern:'Concern', occurredAt:'2026-07-19T12:00:00Z' });
  const saved = service.saveDraft(actor, meta('save-key-003',1), { encounterId:started.objectId, assessment:assessment(started.objectId) });
  assert.equal(saved.version,2);
  const attested = service.attest(actor, meta('attest-key-003',2), { encounterId:started.objectId, assessmentVersionId:'a1', occurredAt:'2026-07-19T12:10:00Z' });
  assert.equal(attested.status,'ATTESTED');
  const supplementDraft = assessment(started.objectId,'a2',2,'a1');
  const supplemented = service.supplement(actor, meta('supp-key-003',3), {
    encounterId:started.objectId, parentAssessmentVersionId:'a1', supplementAssessmentVersionId:'a2', reason:'Collateral clarification', occurredAt:'2026-07-19T12:20:00Z'
  }, supplementDraft);
  assert.equal(supplemented.status,'CORRECTED');
  const versions = service.listAssessmentVersions(actor, started.objectId);
  assert.equal(versions.length,2);
  assert.equal(versions[0].status,'ATTESTED');
  assert.equal(versions[1].parentVersionId,'a1');
});

test('attested assessment cannot be edited as a draft', () => {
  const service = new InMemoryPrescreenService();
  const started = service.start(actor, meta('start-key-004'), { caseId:'case-1', currentLocation:'L', presentingConcern:'C', occurredAt:'2026-07-19T12:00:00Z' });
  service.saveDraft(actor, meta('save-key-004',1), { encounterId:started.objectId, assessment:assessment(started.objectId) });
  service.attest(actor, meta('attest-key-004',2), { encounterId:started.objectId, assessmentVersionId:'a1', occurredAt:'2026-07-19T12:10:00Z' });
  assert.throws(() => service.saveDraft(actor, meta('save-key-004b',3), { encounterId:started.objectId, assessment:assessment(started.objectId,'a2',2) }),
    (error) => error instanceof DomainError && error.code === 'ASSESSMENT_NOT_DRAFT');
});

test('optimistic concurrency conflict is detected', () => {
  const service = new InMemoryPrescreenService();
  const started = service.start(actor, meta('start-key-005'), { caseId:'case-1', currentLocation:'L', presentingConcern:'C', occurredAt:'2026-07-19T12:00:00Z' });
  assert.throws(() => service.saveDraft(actor, meta('save-key-005',99), { encounterId:started.objectId, assessment:assessment(started.objectId) }),
    (error) => error instanceof DomainError && error.code === 'PRESCREEN_VERSION_CONFLICT');
});

test('tenant isolation returns not found rather than leaking resource existence', () => {
  const service = new InMemoryPrescreenService();
  const started = service.start(actor, meta('start-key-006'), { caseId:'case-1', currentLocation:'L', presentingConcern:'C', occurredAt:'2026-07-19T12:00:00Z' });
  assert.throws(() => service.getEncounter(otherTenant, started.objectId),
    (error) => error instanceof DomainError && error.code === 'RESOURCE_NOT_FOUND');
});
