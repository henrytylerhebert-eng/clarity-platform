import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePossiblePathway, evaluateOrientationGate, assertEncounterTransition, DomainError } from '../dist/index.js';

const orientation = (person, place, time, situation) => ({
  observedAt: '2026-07-19T12:00:00Z',
  person: { status: person }, place: { status: place }, time: { status: time }, situation: { status: situation },
});

test('orientation gate passes only when all four domains are oriented', () => {
  assert.equal(evaluateOrientationGate(orientation('ORIENTED','ORIENTED','ORIENTED','ORIENTED')), 'PASS');
  assert.equal(evaluateOrientationGate(orientation('ORIENTED','NOT_ORIENTED','ORIENTED','ORIENTED')), 'FAIL');
  assert.equal(evaluateOrientationGate(orientation('ORIENTED','UNKNOWN','ORIENTED','ORIENTED')), 'UNKNOWN');
});

test('willing and oriented routes to possible formal voluntary review', () => {
  const result = derivePossiblePathway({ willingness: 'WILLING', orientation: orientation('ORIENTED','ORIENTED','ORIENTED','ORIENTED') });
  assert.equal(result.pathway, 'POSSIBLE_FORMAL_VOLUNTARY_REVIEW');
  assert.equal(result.requiresAuthorizedReview, true);
});

test('willing but not fully oriented routes to possible noncontested pathway', () => {
  const result = derivePossiblePathway({ willingness: 'WILLING', orientation: orientation('ORIENTED','ORIENTED','NOT_ORIENTED','NOT_ORIENTED') });
  assert.equal(result.pathway, 'POSSIBLE_NONCONTESTED_PATHWAY');
  assert.equal(result.orientationGate, 'FAIL');
});

test('non-opposed with unknown orientation routes to possible noncontested pathway', () => {
  const result = derivePossiblePathway({ willingness: 'NON_OPPOSED', orientation: orientation('UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN') });
  assert.equal(result.pathway, 'POSSIBLE_NONCONTESTED_PATHWAY');
});

test('opposed routes to emergency or legal review without choosing an instrument', () => {
  const result = derivePossiblePathway({ willingness: 'OPPOSED', orientation: orientation('ORIENTED','ORIENTED','ORIENTED','ORIENTED') });
  assert.equal(result.pathway, 'EMERGENCY_OR_LEGAL_REVIEW_REQUIRED');
});

test('medical stabilization overrides other possible pathways', () => {
  const result = derivePossiblePathway({ willingness: 'WILLING', orientation: orientation('ORIENTED','ORIENTED','ORIENTED','ORIENTED'), immediateMedicalStabilizationRequired: true });
  assert.equal(result.pathway, 'MEDICAL_STABILIZATION_REQUIRED');
});

test('valid encounter transition succeeds', () => {
  assert.doesNotThrow(() => assertEncounterTransition('DRAFT','ATTESTED'));
});

test('invalid encounter transition fails deterministically', () => {
  assert.throws(() => assertEncounterTransition('DRAFT','HANDED_OFF'), (error) => error instanceof DomainError && error.code === 'INVALID_ENCOUNTER_TRANSITION');
});
