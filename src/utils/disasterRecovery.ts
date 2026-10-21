export interface RegionStatus {
  id: string;
  name: string;
  location: string;
  role: 'primary' | 'secondary' | 'standby';
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  syncLagSeconds: number;
  uptime30d: number;
}

export interface DisasterRecoveryParams {
  backupCadenceMinutes: number; // Snapshot frequency
  replicationMode: 'synchronous' | 'semi-sync' | 'asynchronous';
  targetRtoMinutes: number; // Recovery Time Objective
  targetRpoMinutes: number; // Recovery Point Objective
  activeRegions: number;
}

export interface DisasterRecoveryAudit {
  calculatedRpoMinutes: number;
  calculatedRtoMinutes: number;
  isRpoCompliant: boolean;
  isRtoCompliant: boolean;
  availabilityTier: '99.9%' | '99.99%' | '99.999%';
  soc2ReadinessScore: number; // 0 to 100
  recommendations: string[];
}

/**
 * Calculates theoretical RPO & RTO based on database replication and infrastructure configuration
 */
export function calculateDrMetrics(params: DisasterRecoveryParams): DisasterRecoveryAudit {
  let calculatedRpo = 0;
  if (params.replicationMode === 'synchronous') {
    calculatedRpo = 0; // Zero data loss
  } else if (params.replicationMode === 'semi-sync') {
    calculatedRpo = 0.5; // ~30 seconds lag maximum
  } else {
    calculatedRpo = Math.max(1, params.backupCadenceMinutes);
  }

  // RTO is automated DNS cutover (2 mins) + DB replica promotion (1-3 mins)
  let calculatedRto = params.activeRegions >= 3 ? 1.5 : params.activeRegions === 2 ? 3.0 : 45.0;
  if (params.replicationMode === 'asynchronous') {
    calculatedRto += 5.0; // Extra time to verify log consistency
  }

  const isRpoCompliant = calculatedRpo <= params.targetRpoMinutes;
  const isRtoCompliant = calculatedRto <= params.targetRtoMinutes;

  let soc2Score = 70;
  if (isRpoCompliant) soc2Score += 10;
  if (isRtoCompliant) soc2Score += 10;
  if (params.activeRegions >= 3) soc2Score += 5;
  if (params.replicationMode === 'synchronous' || params.replicationMode === 'semi-sync') soc2Score += 5;

  let availabilityTier: '99.9%' | '99.99%' | '99.999%' = '99.9%';
  if (params.activeRegions >= 3 && isRtoCompliant) {
    availabilityTier = '99.999%';
  } else if (params.activeRegions >= 2) {
    availabilityTier = '99.99%';
  }

  const recommendations: string[] = [];
  if (!isRpoCompliant) {
    recommendations.push('Reduce backup cadence or upgrade replication from asynchronous to semi-synchronous.');
  }
  if (!isRtoCompliant) {
    recommendations.push('Implement automated health-check DNS failover and pre-warmed replica pods.');
  }
  if (params.activeRegions < 3) {
    recommendations.push('Expand cluster to 3 distinct geographic regions for active-active zero-downtime routing.');
  }

  return {
    calculatedRpoMinutes: Number(calculatedRpo.toFixed(1)),
    calculatedRtoMinutes: Number(calculatedRto.toFixed(1)),
    isRpoCompliant,
    isRtoCompliant,
    availabilityTier,
    soc2ReadinessScore: Math.min(100, soc2Score),
    recommendations,
  };
}
