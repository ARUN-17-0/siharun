import { LoRaPacket, PacketType, HazardType, RiskState, NodeState } from '../types';

let globalSeqCounter = 1000;

export function generatePacketId(nodeId: number, seq: number): string {
  return `LORA-${nodeId}-${seq}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export function createAITelemetryPacket(
  node: NodeState,
  destNodeId: number,
  targetMasterId: number,
  fullRoute: number[]
): LoRaPacket {
  globalSeqCounter++;
  const isCritical = node.aiResult.status === 'CRITICAL';
  const isWarning = node.aiResult.status === 'WARNING' || node.aiResult.status === 'WATCH';
  const packetType: PacketType = isCritical 
    ? 'CRITICAL_ALERT' 
    : isWarning 
    ? 'EARLY_WARNING' 
    : 'TELEMETRY';

  // Full route without the source node itself: e.g. [nextHop, ..., master, 0]
  const remainingPath = fullRoute.slice(1);

  return {
    packetId: generatePacketId(node.id, globalSeqCounter),
    nodeId: node.id,
    sourceNodeId: node.id,
    destNodeId,
    targetMasterId,
    packetType,
    hazard: node.aiResult.primaryHazard,
    probability: node.aiResult.severity,
    severity: node.aiResult.severity,
    status: node.aiResult.status,
    timestamp: Date.now(),
    gpsPosition: { ...node.sensorData.gps },
    sequenceNumber: globalSeqCounter,
    hopCount: 0,
    ttl: 7,
    battery: Math.round(node.health.batteryLevel),
    nodeHealth: node.health.overallScore,
    payloadSummary: `N${node.id}->N${destNodeId} [${packetType}] ${node.aiResult.primaryHazard} ${node.aiResult.severity}%`,
    remainingPath
  };
}

export function createHandoverPacket(
  oldMasterId: number,
  newMasterId: number,
  reason: string,
  destNodeId: number
): LoRaPacket {
  globalSeqCounter++;
  return {
    packetId: generatePacketId(oldMasterId, globalSeqCounter),
    nodeId: oldMasterId,
    sourceNodeId: oldMasterId,
    destNodeId,
    targetMasterId: newMasterId,
    packetType: 'MASTER_HANDOVER',
    hazard: 'NONE',
    probability: 0,
    severity: 0,
    status: 'WARNING',
    timestamp: Date.now(),
    gpsPosition: { lat: 30.1652, lng: 79.1021, alt: 1890 },
    sequenceNumber: globalSeqCounter,
    hopCount: 0,
    ttl: 5,
    battery: 20,
    nodeHealth: 23,
    payloadSummary: `HANDOVER: N${oldMasterId} -> N${newMasterId} (${reason})`,
    remainingPath: [newMasterId]
  };
}

export function createElectionWinnerPacket(
  newMasterId: number,
  termNumber: number
): LoRaPacket {
  globalSeqCounter++;
  return {
    packetId: generatePacketId(newMasterId, globalSeqCounter),
    nodeId: newMasterId,
    sourceNodeId: newMasterId,
    destNodeId: -1,
    targetMasterId: newMasterId,
    packetType: 'ELECTION_WINNER',
    hazard: 'NONE',
    probability: 0,
    severity: 0,
    status: 'NORMAL',
    timestamp: Date.now(),
    gpsPosition: { lat: 30.1384, lng: 79.1170, alt: 1640 },
    sequenceNumber: globalSeqCounter,
    hopCount: 0,
    ttl: 5,
    battery: 96,
    nodeHealth: 95,
    payloadSummary: `ELECTION WINNER: N${newMasterId} assumed Master Node (Term ${termNumber})`
  };
}

export function formatCompactHex(packet: LoRaPacket): string {
  const header = (0xA5).toString(16).padStart(2, '0');
  const nId = packet.nodeId.toString(16).padStart(2, '0');
  const dId = (packet.destNodeId === -1 ? 0xFF : packet.destNodeId).toString(16).padStart(2, '0');
  const typeCode = packet.packetType === 'CRITICAL_ALERT' ? '03' : packet.packetType === 'EARLY_WARNING' ? '02' : packet.packetType === 'MASTER_HANDOVER' ? '05' : '01';
  const prob = packet.probability.toString(16).padStart(2, '0');
  const sev = packet.severity.toString(16).padStart(2, '0');
  const batt = packet.battery.toString(16).padStart(2, '0');
  const hlth = packet.nodeHealth.toString(16).padStart(2, '0');
  const seq = (packet.sequenceNumber % 65535).toString(16).padStart(4, '0');
  
  return `0x${header} ${nId} ${dId} ${typeCode} ${prob} ${sev} ${batt} ${hlth} ${seq} [32 bytes]`;
}
