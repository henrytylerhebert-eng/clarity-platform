import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultSecuredInstrumentRule, qualifyTransportProvider } from '../dist/index.js';

const rule = defaultSecuredInstrumentRule();
const context = {
  legalStatus: 'OPC', instrumentId: 'opc_synthetic_1', destinationFacilityId: 'facility-1',
  jurisdictionCode: 'LA', serviceArea: 'Lafayette Parish', requiredCapabilities: ['CONTINUOUS_SUPERVISION'],
};
const provider = (overrides={}) => ({
  providerId:'p1', legalName:'Synthetic Secure Transport', category:'CONTRACTED_SECURE_BEHAVIORAL_TRANSPORT',
  status:'ACTIVE', verificationStatus:'VERIFIED', supportedLegalStatuses:['OPC','PEC','CEC'],
  serviceAreas:['Lafayette Parish'], capabilities:['CONTINUOUS_SUPERVISION'], restrictions:[],
  facilityApprovals:['facility-1'], jurisdictionApprovals:['LA'], ...overrides,
});

test('verified contracted secure provider can qualify under configured OPC rule', () => {
  const result = qualifyTransportProvider(provider(), context, rule);
  assert.equal(result.status, 'QUALIFIED');
});

test('family transport is blocked for configured OPC path', () => {
  const result = qualifyTransportProvider(provider({ category:'FAMILY_OR_SUPPORT_TRANSPORT' }), context, rule);
  assert.equal(result.status, 'NOT_QUALIFIED');
  assert(result.disqualifiers.includes('TRANSPORT_CATEGORY_BLOCKED'));
});

test('missing instrument blocks secured instrument transport', () => {
  const { instrumentId, ...withoutInstrument } = context;
  const result = qualifyTransportProvider(provider(), withoutInstrument, rule);
  assert(result.disqualifiers.includes('TRANSPORT_AUTHORITY_MISSING'));
});

test('missing destination blocks qualification', () => {
  const { destinationFacilityId, ...withoutDestination } = context;
  const result = qualifyTransportProvider(provider(), withoutDestination, rule);
  assert(result.disqualifiers.includes('TRANSPORT_DESTINATION_NOT_CONFIRMED'));
});

test('stale provider credentials block qualification', () => {
  const result = qualifyTransportProvider(provider({ verificationStatus:'STALE' }), context, rule);
  assert(result.disqualifiers.includes('PROVIDER_VERIFICATION_NOT_CURRENT'));
});

test('service-area mismatch blocks qualification', () => {
  const result = qualifyTransportProvider(provider({ serviceAreas:['Orleans Parish'] }), context, rule);
  assert(result.disqualifiers.includes('SERVICE_AREA_NOT_SUPPORTED'));
});

test('missing patient capability blocks qualification', () => {
  const result = qualifyTransportProvider(provider({ capabilities:[] }), context, rule);
  assert(result.disqualifiers.includes('MISSING_CAPABILITY:CONTINUOUS_SUPERVISION'));
});
