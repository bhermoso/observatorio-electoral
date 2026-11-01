import test from 'node:test';
import assert from 'node:assert/strict';
import {enVeda} from '../scripts/veda.mjs';

test('fuera de veda antes del martes 24 de noviembre (hora de Madrid)', () => {
  assert.equal(enVeda(new Date('2026-11-23T22:59:00Z')), false);
});
test('en veda desde el martes 24 a las 00:00 de Madrid', () => {
  assert.equal(enVeda(new Date('2026-11-23T23:00:00Z')), true);
  assert.equal(enVeda(new Date('2026-11-28T12:00:00Z')), true);
});
test('en veda el día de la votación hasta las 20:00 de Madrid', () => {
  assert.equal(enVeda(new Date('2026-11-29T18:59:00Z')), true);
  assert.equal(enVeda(new Date('2026-11-29T19:00:00Z')), false);
});
