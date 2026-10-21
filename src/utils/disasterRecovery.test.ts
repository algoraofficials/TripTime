import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDrMetrics } from './disasterRecovery.ts';

test('calculates zero RPO for synchronous multi-region database replication', () => {
  const audit = calculateDrMetrics({
    backupCadenceMinutes: 15,
    replicationMode: 'synchronous',
    targetRtoMinutes: 5,
    targetRpoMinutes: 0.1,
    activeRegions: 3,
  });

  assert.equal(audit.calculatedRpoMinutes, 0);
  assert.equal(audit.isRpoCompliant, true);
  assert.equal(audit.availabilityTier, '99.999%');
  assert.ok(audit.soc2ReadinessScore >= 95);
});

test('flags non-compliance when asynchronous replication exceeds RPO target', () => {
  const audit = calculateDrMetrics({
    backupCadenceMinutes: 60,
    replicationMode: 'asynchronous',
    targetRtoMinutes: 2,
    targetRpoMinutes: 5,
    activeRegions: 1,
  });

  assert.equal(audit.isRpoCompliant, false);
  assert.equal(audit.isRtoCompliant, false);
  assert.ok(audit.recommendations.length > 0);
});
