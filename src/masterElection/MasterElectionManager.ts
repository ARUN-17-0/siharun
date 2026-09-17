import { NodeState, CandidateScore, MasterElectionResult } from '../types';
import { calculateDistance3D, GATEWAY_POSITION, GATEWAY_MAX_RANGE } from '../nodes/NodePhysics';

/**
 * Calculates a node's fitness score for assuming the Regional Master role.
 * Formula:
 * Fitness = 0.30 * Health + 0.25 * Battery + 0.20 * DegreeConnectivity + 0.15 * HazardSafety + 0.10 * GatewayProximity
 */
export function calculateCandidateScore(
  candidate: NodeState,
  allNodes: NodeState[],
  aliveNodeIds: Set<number>
): CandidateScore {
  if (!candidate.isAlive) {
    return {
      nodeId: candidate.id,
      totalScore: 0,
      healthScore: 0,
      batteryScore: 0,
      connectivityScore: 0,
      hazardSafetyScore: 0,
      hopAdvantageScore: 0,
      reason: "Node is offline/dead"
    };
  }

  // 1. Health component (0 - 100)
  const healthScore = candidate.health.overallScore;

  // 2. Battery component (0 - 100)
  const batteryScore = candidate.health.batteryLevel;

  // 3. Connectivity degree: ratio of active nodes reachable within 1 hop
  const reachableCount = candidate.neighbors.filter(id => aliveNodeIds.has(id)).length;
  const maxPossible = Math.max(1, aliveNodeIds.size - 1);
  const connectivityScore = Math.min(100, Math.round((reachableCount / maxPossible) * 100));

  // 4. Hazard Safety (inverse of threat exposure)
  const hazardSafetyScore = Math.max(0, 100 - candidate.health.hazardExposure);

  // 5. Gateway proximity advantage (bonus for direct or 1-hop reachability to Village Gateway)
  const distToGateway = calculateDistance3D(candidate.position3D, GATEWAY_POSITION);
  const canDirectlyReach = distToGateway <= GATEWAY_MAX_RANGE;
  const hopAdvantageScore = canDirectlyReach ? 100 : Math.max(10, Math.round((1 - distToGateway / 50) * 100));

  // Weighted total score
  const totalScore = Math.round(
    0.30 * healthScore +
    0.25 * batteryScore +
    0.20 * connectivityScore +
    0.15 * hazardSafetyScore +
    0.10 * hopAdvantageScore
  );

  const reason = `H:${healthScore}% | B:${batteryScore}% | Conn:${reachableCount} peers | Safety:${hazardSafetyScore}% | GwReach:${canDirectlyReach ? 'DIRECT' : 'RELAY'}`;

  return {
    nodeId: candidate.id,
    totalScore,
    healthScore,
    batteryScore,
    connectivityScore,
    hazardSafetyScore,
    hopAdvantageScore,
    reason
  };
}

/**
 * Checks if the current master is critically stressed or unsafe.
 * Returns true if handover should occur.
 */
export function checkMasterRequiresHandover(master: NodeState | undefined): { needsHandover: boolean; reason: string } {
  if (!master) {
    return { needsHandover: true, reason: "No active master registered" };
  }

  if (!master.isAlive) {
    return { needsHandover: true, reason: "Master heartbeat lost / node powered off" };
  }

  if (master.health.internalTemp >= 72) {
    return { 
      needsHandover: true, 
      reason: `Thermal danger threshold exceeded (${master.health.internalTemp}°C >= 72°C)` 
    };
  }

  if (master.health.overallScore <= 35) {
    return { 
      needsHandover: true, 
      reason: `Node health collapsed to ${master.health.overallScore}% (critical condition)` 
    };
  }

  if (master.health.batteryLevel <= 18) {
    return { 
      needsHandover: true, 
      reason: `Battery critically depleted (${master.health.batteryLevel}% <= 18%)` 
    };
  }

  if (master.health.hazardExposure >= 85) {
    return { 
      needsHandover: true, 
      reason: `Direct threat engulfment (Hazard proximity ${master.health.hazardExposure}%)` 
    };
  }

  return { needsHandover: false, reason: "Master node operating nominally" };
}

/**
 * Executes Graceful Master Handover.
 * Evaluates candidate scores, selects highest-ranked healthy replacement,
 * and compiles audit trail.
 */
export function executeMasterHandover(
  currentMasterId: number,
  allNodes: NodeState[],
  reason: string
): MasterElectionResult | null {
  const aliveNodes = allNodes.filter(n => n.isAlive && n.id !== currentMasterId);
  if (aliveNodes.length === 0) return null;

  const aliveSet = new Set(allNodes.filter(n => n.isAlive).map(n => n.id));

  // Compute scores for all candidate nodes
  const candidateScores: CandidateScore[] = aliveNodes.map(node => 
    calculateCandidateScore(node, allNodes, aliveSet)
  );

  // Sort descending by total score
  candidateScores.sort((a, b) => b.totalScore - a.totalScore);
  const bestCandidate = candidateScores[0];

  return {
    oldMasterId: currentMasterId,
    newMasterId: bestCandidate.nodeId,
    reason,
    triggerType: 'GRACEFUL_HANDOVER',
    candidateScores,
    timestamp: Date.now()
  };
}

/**
 * Executes Sudden Master Failure Election (Watchdog timeout triggered).
 * Simulates distributed Raft/Bully style election consensus among surviving nodes.
 */
export function executeSuddenFailureElection(
  deadMasterId: number,
  allNodes: NodeState[]
): MasterElectionResult | null {
  const aliveNodes = allNodes.filter(n => n.isAlive && n.id !== deadMasterId);
  if (aliveNodes.length === 0) return null;

  const aliveSet = new Set(aliveNodes.map(n => n.id));

  const candidateScores: CandidateScore[] = aliveNodes.map(node => 
    calculateCandidateScore(node, allNodes, aliveSet)
  );

  candidateScores.sort((a, b) => b.totalScore - a.totalScore);
  const winner = candidateScores[0];

  return {
    oldMasterId: deadMasterId,
    newMasterId: winner.nodeId,
    reason: `Heartbeat watchdog timeout: Node ${deadMasterId} unresponsive. Distributed election concluded.`,
    triggerType: 'SUDDEN_TIMEOUT_ELECTION',
    candidateScores,
    timestamp: Date.now()
  };
}
