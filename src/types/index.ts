export type RiskState = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export type HazardType = 'NONE' | 'FIRE' | 'FLOOD' | 'LANDSLIDE';

export type NodeStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'FAILED';

export type EvacuationState = 'STANDBY' | 'WARNING_ISSUED' | 'EVACUATING' | 'EVACUATED_SAFE';

export type ScenarioType = 
  | 'NORMAL' 
  | 'FIRE' 
  | 'FLOOD' 
  | 'LANDSLIDE' 
  | 'MASTER_FAILURE' 
  | 'MASTER_HANDOVER' 
  | 'COMPLETE_DEMO';

export type PacketType = 
  | 'HEARTBEAT' 
  | 'TELEMETRY' 
  | 'EARLY_WARNING' 
  | 'CRITICAL_ALERT' 
  | 'MASTER_HANDOVER' 
  | 'ELECTION_VOTE' 
  | 'ELECTION_WINNER';

export interface CameraEvidence {
  fireConfidence: number;      // 0.0 - 1.0 (Flame & smoke visual feature)
  floodConfidence: number;     // 0.0 - 1.0 (Water level overflow feature)
  debrisConfidence: number;    // 0.0 - 1.0 (Slope shear & debris feature)
  timestamp: number;
}

export interface SensorData {
  temperature: number;         // °C (-10 to 90)
  humidity: number;            // % (5 to 100)
  smokeGas: number;            // ppm (0 to 1200)
  pm25: number;                // µg/m³ (0 to 500)
  pm10: number;                // µg/m³ (0 to 800)
  rainfall: number;            // mm/h (0 to 120)
  soilMoisture: number;        // % (0 to 100)
  waterLevel: number;          // meters (0 to 10m)
  tilt: number;                // degrees from vertical (0 to 45°)
  vibration: number;           // g (0 to 5g)
  gps: {
    lat: number;
    lng: number;
    alt: number;
  };
  camera: CameraEvidence;
}

export interface TemporalFeatures {
  rateOfChange: {
    temperatureRate: number;      // °C/min
    waterLevelRiseRate: number;   // m/min
    smokeGasRate: number;         // ppm/min
    tiltRate: number;             // deg/min
  };
  persistenceCycles: number;      // Number of cycles current hazard has persisted
  cumulativeRainfall: number;     // mm over rolling window
}

export interface AIResult {
  fireProbability: number;        // 0 - 100%
  floodProbability: number;       // 0 - 100%
  landslideProbability: number;   // 0 - 100%
  severity: number;               // 0 - 100%
  primaryHazard: HazardType;
  status: RiskState;
  confidence: number;             // 0 - 100%
  inferenceTimeMs: number;        // ESP32-S3 inference benchmark (~14.2ms)
  hysteresisLocked: boolean;      // True if state is preserved to avoid flickering
}

export interface NodeHealth {
  overallScore: number;           // 0 - 100%
  batteryLevel: number;           // 0 - 100%
  internalTemp: number;           // °C
  rfQualityScore: number;         // 0 - 100%
  hazardExposure: number;         // 0 - 100% (threat proximity)
  isSafe: boolean;
  status: NodeStatus;
}

export interface LoRaPacket {
  packetId: string;
  nodeId: number;                 // Originating node
  sourceNodeId: number;           // Current hop transmitter
  destNodeId: number;             // Next hop receiver (-1 for broadcast, 0 for Gateway)
  targetMasterId: number;         // Intended destination master
  packetType: PacketType;
  hazard: HazardType;
  probability: number;            // 0 - 100
  severity: number;               // 0 - 100
  status: RiskState;
  timestamp: number;
  gpsPosition: {
    lat: number;
    lng: number;
    alt: number;
  };
  sequenceNumber: number;
  hopCount: number;
  ttl: number;
  battery: number;
  nodeHealth: number;
  payloadSummary?: string;
  remainingPath?: number[];       // Trajectory hops [nextHop, ..., master, 0]
}

export interface NodeState {
  id: number;
  name: string;
  zone: 'FOREST_UPPER' | 'RIVER_VALLEY' | 'SLOPE_RIDGE' | 'VILLAGE_APPROACH';
  position3D: [number, number, number];
  isMaster: boolean;
  isAlive: boolean;
  sensorData: SensorData;
  temporalFeatures: TemporalFeatures;
  aiResult: AIResult;
  health: NodeHealth;
  neighbors: number[];            // IDs of neighboring nodes within RF range
  routeToMaster: number[];        // Ordered node IDs [currentNode, ..., masterNode]
  routeToGateway: number[];       // Full path [currentNode, ..., masterNode, 0 (Gateway)]
  nextHop: number | null;
  lastHeartbeat: number;
  transmittedPackets: number;
  electionScore: number;
}

export interface NetworkState {
  currentMasterId: number;
  gatewayOnline: boolean;
  totalActiveNodes: number;
  totalPacketsRouted: number;
  meshPacketLossRate: number;     // 0.0 - 1.0
  averageHopCount: number;
  activeHazard: HazardType;
  scenario: ScenarioType;
  isSimulating: boolean;
  simulationSpeed: number;
  routes: Record<number, number[]>; // NodeId -> full path to gateway
  evacuationState: EvacuationState;
  evacuationProgress: number;     // 0.0 to 1.0
  disasterPhase: number;          // 1 (Detect) -> 2 (Warn) -> 3 (Evacuate) -> 4 (Impact Peak)
  phaseNarration: string;
}

export interface CandidateScore {
  nodeId: number;
  totalScore: number;
  healthScore: number;
  batteryScore: number;
  connectivityScore: number;
  hazardSafetyScore: number;
  hopAdvantageScore: number;
  reason: string;
}

export interface MasterElectionResult {
  oldMasterId: number;
  newMasterId: number;
  reason: string;
  triggerType: 'GRACEFUL_HANDOVER' | 'SUDDEN_TIMEOUT_ELECTION';
  candidateScores: CandidateScore[];
  timestamp: number;
}

export interface TelemetryLog {
  id: string;
  timestamp: number;
  category: 'EDGE_COMPUTE' | 'LORA_MESH' | 'ROUTING' | 'MASTER' | 'EARLY_WARNING';
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'DANGER';
  title: string;
  message: string;
  nodeId?: number;
}

export interface ActivePacketAnimation {
  id: string;
  fromId: number;
  toId: number;
  startPos: [number, number, number];
  endPos: [number, number, number];
  progress: number;               // 0.0 to 1.0
  packet: LoRaPacket;
}
