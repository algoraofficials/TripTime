import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSplitShares } from './splitPayment.ts';
import type { SplitParticipant } from './splitPayment.ts';

test('calculates equal splits with penny round-up reconciliation', () => {
  const participants: SplitParticipant[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com', paid: false },
    { id: '2', name: 'Bob', email: 'bob@example.com', paid: false },
    { id: '3', name: 'Charlie', email: 'charlie@example.com', paid: false },
  ];

  // 100 / 3 = 33.3333333333
  // Alice: 33.33, Bob: 33.33, Charlie absorbs remainder (100 - 66.66 = 33.34)
  const result = calculateSplitShares(100, participants, 'EQUAL');

  assert.equal(result.isBalanced, true);
  assert.equal(result.participants[0].calculatedAmount, 33.33);
  assert.equal(result.participants[1].calculatedAmount, 33.33);
  assert.equal(result.participants[2].calculatedAmount, 33.34);
  const sum = result.participants.reduce((acc, p) => acc + p.calculatedAmount, 0);
  assert.equal(Number(sum.toFixed(2)), 100);
});

test('computes percentage-based payment splitting', () => {
  const participants: SplitParticipant[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com', sharePercentage: 50, paid: true },
    { id: '2', name: 'Bob', email: 'bob@example.com', sharePercentage: 30, paid: false },
    { id: '3', name: 'Charlie', email: 'charlie@example.com', sharePercentage: 20, paid: false },
  ];

  const result = calculateSplitShares(500, participants, 'PERCENTAGE');
  assert.equal(result.isBalanced, true);
  assert.equal(result.participants[0].calculatedAmount, 250);
  assert.equal(result.participants[1].calculatedAmount, 150);
  assert.equal(result.participants[2].calculatedAmount, 100);
  assert.equal(result.totalPaid, 250);
  assert.equal(result.percentPaid, 50);
  assert.equal(result.remainingAmount, 250);
});

test('handles empty participants gracefully', () => {
  const result = calculateSplitShares(200, [], 'EQUAL');
  assert.equal(result.participants.length, 0);
  assert.equal(result.isBalanced, false);
});
