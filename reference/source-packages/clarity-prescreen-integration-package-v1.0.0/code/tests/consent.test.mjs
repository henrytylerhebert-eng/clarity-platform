import test from 'node:test';
import assert from 'node:assert/strict';
import { ageBandFor, evaluateConsentAuthority } from '../dist/index.js';

const rule = {
  ruleId:'synthetic-parental-admission', version:1, status:'APPROVED', jurisdictionCode:'LA', facilityId:'facility-1',
  ageBand:'AGE_12_TO_15', actionCode:'PARENTAL_ADMISSION_APPLICATION', admissionPathways:['PARENTAL_ADMISSION'],
  authorizedSignerTypes:['PARENT','LEGAL_GUARDIAN'], minorSignatureRequired:false, relationshipEvidenceRequired:true,
  courtApprovalRequired:false, clinicianReviewRequired:true, privacyRegimes:[],
};
const context = {
  jurisdictionCode:'LA', facilityId:'facility-1', age:14, actionCode:'PARENTAL_ADMISSION_APPLICATION',
  admissionPathway:'PARENTAL_ADMISSION', signerType:'PARENT', relationshipEvidencePresent:true,
  minorSignaturePresent:false, courtApprovalPresent:false, clinicianReviewPresent:true,
};

test('age bands are deterministic', () => {
  assert.equal(ageBandFor(11),'UNDER_12');
  assert.equal(ageBandFor(14),'AGE_12_TO_15');
  assert.equal(ageBandFor(16),'AGE_16_TO_17');
  assert.equal(ageBandFor(18),'ADULT');
});

test('approved rule allows matching signer when all requirements are met', () => {
  const result = evaluateConsentAuthority([rule], context);
  assert.equal(result.allowed,true);
  assert.equal(result.ruleId,'synthetic-parental-admission');
});

test('relationship evidence is enforced', () => {
  const result = evaluateConsentAuthority([rule], { ...context, relationshipEvidencePresent:false });
  assert.equal(result.allowed,false);
  assert(result.unmetRequirements.includes('RELATIONSHIP_EVIDENCE_REQUIRED'));
});

test('wrong signer type is not treated as authority', () => {
  const result = evaluateConsentAuthority([rule], { ...context, signerType:'MINOR_PATIENT' });
  assert(result.unmetRequirements.includes('SIGNER_TYPE_NOT_AUTHORIZED'));
});

test('draft rule cannot authorize a consent action', () => {
  const result = evaluateConsentAuthority([{ ...rule, status:'DRAFT_UNVERIFIED' }], context);
  assert.deepEqual(result.unmetRequirements,['NO_APPROVED_RULE']);
});

test('no facility rule fails closed', () => {
  const result = evaluateConsentAuthority([rule], { ...context, facilityId:'facility-2' });
  assert.equal(result.allowed,false);
});
