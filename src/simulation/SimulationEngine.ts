import { 
  NodeState, 
  NetworkState, 
  ScenarioType, 
  LoRaPacket, 
  MasterElectionResult, 
  TelemetryLog, 
  ActivePacketAnimation,
  HazardType,
  EvacuationState
} from '../types';
import { 
  INITIAL_NODE_DEFINITIONS, 
  GATEWAY_POSITION, 
  getReachableNeighbors 
} from '../nodes/NodePhysics';
import { 
  createBaselineSensorData, 
  createInitialTemporalFeatures, 
  createInitialNodeHealth, 
  updateNodeSensors 
} from '../nodes/SensorSimulator';
import { 
  runEdgeAIInference, 
  createInitialInferenceState, 
  EdgeInferenceState 
} from '../ai/EdgeAIInferenceEngine';
import { 
  computeMeshRouting, 
  RoutingTableResult,
  dijkstra
} from '../routing/GraphMeshRouter';
import { 
  checkMasterRequiresHandover, 
  executeMasterHandover, 
  executeSuddenFailureElection,
  calculateCandidateScore
} from '../masterElection/MasterElectionManager';
import { 
  createAITelemetryPacket, 
  createHandoverPacket, 
  createElectionWinnerPacket 
} from '../network/LoRaPacket';
import { COMPLETE_DEMO_STEPS, DemoStep } from './DemoSequence';

export class SimulationEngine {
  private nodeStates: NodeState[] = [];
  private prevSensorData: Map<number, typeof this.nodeStates[0]['sensorData']> = new Map();
  private inferenceStates: Map<number, EdgeInferenceState> = new Map();
  private currentMasterId: number = 5;
  private gatewayOnline: boolean = true;
  private scenario: ScenarioType = 'NORMAL';
  
  // Staged Disaster & Evacuation State
  private disasterPhase: number = 1;          // 1: Incipient Anomaly, 2: Warning, 3: Evacuation, 4: Peak Impact
  private disasterPhaseTimer: number = 0;
  private evacuationState: EvacuationState = 'STANDBY';
  private evacuationProgress: number = 0.0;
  private phaseNarration: string = 'Normal baseline monitoring across all sectors.';

  private activePacketAnimations: ActivePacketAnimation[] = [];
  private eventLogs: TelemetryLog[] = [];
  private packetLogs: LoRaPacket[] = [];
  private electionLogs: MasterElectionResult[] = [];
  
  private currentRouting: RoutingTableResult | null = null;

  // Round-robin packet transmitter across all nodes
  private packetTxTimer: number = 0;
  private packetTxInterval: number = 1.2;
  private nextTxNodeIndex: number = 0;

  // Demo sequence runner
  private demoRunning: boolean = false;
  private currentDemoStepIndex: number = 0;
  private demoStepElapsedMs: number = 0;

  private stateChangeListeners: (() => void)[] = [];

  constructor() {
    this.initNodes();
    this.recomputeTopology();
    this.addLog('ROUTING', 'INFO', 'Mesh Initialized', '10 ESP32-S3 sensor nodes registered. 443MHz sub-GHz routing initialized.');
  }

  public subscribe(listener: () => void): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.stateChangeListeners) {
      listener();
    }
  }

  private initNodes() {
    this.nodeStates = INITIAL_NODE_DEFINITIONS.map(def => {
      const sensorData = createBaselineSensorData(def);
      const temporalFeatures = createInitialTemporalFeatures();
      const health = createInitialNodeHealth(def.id);
      this.prevSensorData.set(def.id, sensorData);
      this.inferenceStates.set(def.id, createInitialInferenceState());

      return {
        id: def.id,
        name: def.name,
        zone: def.zone,
        position3D: [...def.position3D] as [number, number, number],
        isMaster: def.id === 5,
        isAlive: true,
        sensorData,
        temporalFeatures,
        aiResult: {
          fireProbability: 2,
          floodProbability: 1,
          landslideProbability: 2,
          severity: 3,
          primaryHazard: 'NONE',
          status: 'NORMAL',
          confidence: 78,
          inferenceTimeMs: 14.2,
          hysteresisLocked: false
        },
        health,
        neighbors: [],
        routeToMaster: [def.id],
        routeToGateway: [def.id, 0],
        nextHop: null,
        lastHeartbeat: Date.now(),
        transmittedPackets: 0,
        electionScore: 0
      };
    });

    this.currentMasterId = 5;
    this.disasterPhase = 1;
    this.disasterPhaseTimer = 0;
    this.evacuationState = 'STANDBY';
    this.evacuationProgress = 0.0;
    this.phaseNarration = 'Environmental parameters nominal across all monitoring sectors.';
  }

  private recomputeTopology() {
    const aliveSet = new Set(this.nodeStates.filter(n => n.isAlive).map(n => n.id));

    for (const node of this.nodeStates) {
      node.neighbors = getReachableNeighbors(node.id, INITIAL_NODE_DEFINITIONS, aliveSet);
    }

    this.currentRouting = computeMeshRouting(this.nodeStates, this.currentMasterId, this.gatewayOnline);

    for (const node of this.nodeStates) {
      node.isMaster = (node.id === this.currentMasterId);

      const rMaster = this.currentRouting.routesToMaster[node.id];
      if (rMaster) {
        node.routeToMaster = rMaster.path;
        node.nextHop = rMaster.nextHop;
      }

      const rGateway = this.currentRouting.routesToGateway[node.id];
      if (rGateway) {
        node.routeToGateway = rGateway.path;
      }

      const scoreObj = calculateCandidateScore(node, this.nodeStates, aliveSet);
      node.electionScore = scoreObj.totalScore;
    }
  }

  public addLog(
    category: TelemetryLog['category'],
    level: TelemetryLog['level'],
    title: string,
    message: string,
    nodeId?: number
  ) {
    const log: TelemetryLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      category,
      level,
      title,
      message,
      nodeId
    };
    this.eventLogs.unshift(log);
    if (this.eventLogs.length > 100) this.eventLogs.pop();
  }

  public tick(dtSec: number) {
    // 1. Advance staged disaster and village evacuation timeline
    if (this.scenario !== 'NORMAL' && !this.demoRunning) {
      this.disasterPhaseTimer += dtSec;

      // Realistic pacing: Floods evolve over extended time (~60-80s total)
      const phase2Wait = this.scenario === 'FLOOD' ? 18.0 : 6.0;
      const evacRate = this.scenario === 'FLOOD' ? 0.022 : 0.08; // ~45s gradual evacuation for flood

      if (this.disasterPhase === 2 && this.disasterPhaseTimer >= phase2Wait) {
        // Warning was issued -> Village residents begin active evacuation
        this.disasterPhase = 3;
        this.disasterPhaseTimer = 0;
        this.evacuationState = 'EVACUATING';
        this.phaseNarration = 'Phase 3: Village Evacuation Active. Personnel and vehicles moving along dirt road to high ground.';
        this.addLog('EARLY_WARNING', 'WARN', 'Evacuation Active', 'Village evacuation underway. Personnel moving along safe route to high ground.');
      } else if (this.disasterPhase === 3) {
        // Evacuate village to safety
        this.evacuationProgress = Math.min(1.0, this.evacuationProgress + dtSec * evacRate);
        if (this.evacuationProgress >= 1.0) {
          // Phase 3 -> Phase 4: Village Safe, Disaster Hits Peak
          this.disasterPhase = 4;
          this.disasterPhaseTimer = 0;
          this.evacuationState = 'EVACUATED_SAFE';
          this.phaseNarration = 'Phase 4: Village Evacuated Safely. Peak disaster impact reached in sector.';
          this.addLog('EARLY_WARNING', 'SUCCESS', 'Village Evacuation Complete', 'All village personnel safely reached high ground safety perimeter.');
        }
      }
    }

    // 2. Advance Complete Demo sequence if active
    if (this.demoRunning) {
      this.tickDemoSequence(dtSec);
    }

    // 3. Update physical sensors and Edge AI inference for each alive node
    for (const node of this.nodeStates) {
      if (!node.isAlive) continue;

      const def = INITIAL_NODE_DEFINITIONS.find(d => d.id === node.id)!;
      const prevData = this.prevSensorData.get(node.id) || node.sensorData;

      const phaseDenominator = this.scenario === 'FLOOD' ? 24.0 : 6.0;
      const phaseProgress = Math.min(1.0, this.disasterPhaseTimer / phaseDenominator);

      const { sensorData, temporalFeatures, health } = updateNodeSensors(
        node.sensorData,
        prevData,
        node.temporalFeatures,
        node.health,
        def,
        this.scenario,
        this.disasterPhase,
        phaseProgress,
        dtSec
      );

      this.prevSensorData.set(node.id, { ...node.sensorData });
      node.sensorData = sensorData;
      node.temporalFeatures = temporalFeatures;
      node.health = health;

      let infState = this.inferenceStates.get(node.id);
      if (!infState) {
        infState = createInitialInferenceState();
        this.inferenceStates.set(node.id, infState);
      }

      const { result, updatedState } = runEdgeAIInference(node.sensorData, node.temporalFeatures, infState);
      this.inferenceStates.set(node.id, updatedState);

      const previousStatus = node.aiResult.status;
      node.aiResult = result;

      if (result.status !== previousStatus && (result.status === 'WARNING' || result.status === 'CRITICAL')) {
        this.addLog(
          'EDGE_COMPUTE',
          result.status === 'CRITICAL' ? 'DANGER' : 'WARN',
          `Threat Escalation: Node ${node.id}`,
          `Status escalated to ${result.status} | Primary Hazard: ${result.primaryHazard} (${result.severity}% severity)`,
          node.id
        );
      }
    }

    // 4. Automatic Master Handover Evaluation
    const currentMaster = this.nodeStates.find(n => n.id === this.currentMasterId);
    const { needsHandover, reason } = checkMasterRequiresHandover(currentMaster);

    if (needsHandover) {
      if (currentMaster && currentMaster.isAlive) {
        this.triggerGracefulHandover(reason);
      } else {
        this.triggerSuddenElection();
      }
    }

    // 5. Dynamic Routing Update
    this.recomputeTopology();

    // 6. Packet Animation and Multi-Hop Forwarding
    this.tickPacketAnimations(dtSec);

    // 7. Continuous Telemetry Dispatch (Guarantees Nodes 2, 3 and all nodes transmit)
    this.packetTxTimer += dtSec;
    if (this.packetTxTimer >= this.packetTxInterval) {
      this.packetTxTimer = 0;
      this.emitPeriodicMeshPackets();
    }

    this.notify();
  }

  /**
   * Dispatches periodic LoRa packets from nodes.
   * Round-robin guarantees that Nodes 2 and 3 and all sector nodes are continuously polled and collected!
   */
  /**
   * Dispatches periodic LoRa packets from nodes.
   * Round-robin guarantees that Nodes 2 and 3 and all sector nodes are continuously polled and collected!
   */
  private emitPeriodicMeshPackets() {
    const aliveNodes = this.nodeStates.filter(n => n.isAlive);
    if (aliveNodes.length === 0) return;

    // Select the next node in round-robin sequence
    const node = aliveNodes[this.nextTxNodeIndex % aliveNodes.length];
    this.nextTxNodeIndex = (this.nextTxNodeIndex + 1) % aliveNodes.length;

    const route = node.routeToGateway;
    if (!route || route.length < 2) return;

    const nextHopId = route[1];
    const packet = createAITelemetryPacket(node, nextHopId, this.currentMasterId, route);
    node.transmittedPackets++;

    this.packetLogs.unshift(packet);
    if (this.packetLogs.length > 60) this.packetLogs.pop();

    // Spawn first hop animation
    this.spawnPacketAnimation(node.id, nextHopId, packet);
  }

  /**
   * Immediately dispatches an early warning or critical alert packet along the mesh
   */
  public dispatchEmergencyAlert(sourceNodeId: number, hazard: HazardType, severity: number) {
    const node = this.nodeStates.find(n => n.id === sourceNodeId);
    if (!node || !node.isAlive) return;

    const route = node.routeToGateway;
    if (!route || route.length < 2) return;

    const nextHopId = route[1];
    const isCritical = severity >= 70;
    const packetType = isCritical ? 'CRITICAL_ALERT' : 'EARLY_WARNING';
    
    const packet = createAITelemetryPacket(node, nextHopId, this.currentMasterId, route);
    packet.packetType = packetType;
    packet.hazard = hazard;
    packet.severity = severity;
    packet.probability = severity;
    packet.payloadSummary = `ALERT N${node.id}->N${nextHopId} [${packetType}] ${hazard} (${severity}%)`;
    packet.remainingPath = route.slice(1);

    this.packetLogs.unshift(packet);
    this.addLog(
      'EARLY_WARNING',
      isCritical ? 'DANGER' : 'WARN',
      `${hazard} Warning Dispatched: Node ${sourceNodeId}`,
      `Sensor anomaly detected. Early warning LoRa packet transmitted along mesh via N${nextHopId} towards Gateway.`,
      sourceNodeId
    );

    this.spawnPacketAnimation(sourceNodeId, nextHopId, packet);
  }

  /**
   * Spawns an animated 3D packet traveling between nodes or to the Gateway
   */
  private spawnPacketAnimation(fromId: number, toId: number, packet: LoRaPacket) {
    const fromNode = this.nodeStates.find(n => n.id === fromId);
    if (!fromNode) return;

    let endPos: [number, number, number] = [0, 0, 0];
    if (toId === 0) {
      endPos = [...GATEWAY_POSITION];
    } else {
      const toNode = this.nodeStates.find(n => n.id === toId);
      if (!toNode) return;
      endPos = [...toNode.position3D];
    }

    const anim: ActivePacketAnimation = {
      id: `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      fromId,
      toId,
      startPos: [...fromNode.position3D],
      endPos,
      progress: 0.0,
      packet
    };

    this.activePacketAnimations.push(anim);
  }

  /**
   * Advances active packet animations and recursively forwards strictly hop-by-hop!
   * Packets never skip nodes or jump straight across the terrain to the gateway.
   */
  private tickPacketAnimations(dtSec: number) {
    const speed = 1.8;
    for (let i = this.activePacketAnimations.length - 1; i >= 0; i--) {
      const anim = this.activePacketAnimations[i];
      anim.progress += dtSec * speed;

      if (anim.progress >= 1.0) {
        // Packet arrived at intermediate destination `anim.toId`
        const arrivedNodeId = anim.toId;
        const remaining = anim.packet.remainingPath || [];

        this.activePacketAnimations.splice(i, 1);

        if (arrivedNodeId === 0) {
          // Arrived at Village Gateway!
          this.addLog(
            'LORA_MESH',
            'SUCCESS',
            `Gateway Ingestion: Node ${anim.packet.nodeId}`,
            `Village Gateway received [${anim.packet.packetType}] from N${anim.packet.nodeId} (total hops: ${anim.packet.hopCount + 1}).`
          );
          if (anim.packet.packetType === 'EARLY_WARNING' || anim.packet.packetType === 'CRITICAL_ALERT') {
            if (this.evacuationState === 'STANDBY') {
              this.evacuationState = 'WARNING_ISSUED';
              this.disasterPhase = 2;
              this.disasterPhaseTimer = 0;
              this.phaseNarration = 'Phase 2: Warning received at Gateway. Early warning broadcast active!';
              this.addLog('EARLY_WARNING', 'WARN', 'Early Warning Broadcast', 'Warning dispatched to Village Gateway. Evacuation order in effect.');
            }
          }
        } else {
          // Packet arrived at a sensor node (could be Master or intermediate relay)
          const isMaster = (arrivedNodeId === this.currentMasterId);

          if (isMaster && anim.packet.nodeId !== this.currentMasterId) {
            // Master aggregated telemetry from a subordinate node!
            this.addLog(
              'LORA_MESH',
              'SUCCESS',
              `Master Aggregated Node ${anim.packet.nodeId}`,
              `Master Node N${this.currentMasterId} received & aggregated telemetry from N${anim.packet.nodeId} (${anim.packet.hopCount + 1} hops). Relaying towards Gateway.`,
              anim.packet.nodeId
            );
          }

          // Determine next target hop strictly along remainingPath:
          let nextHopTarget: number | null = null;
          let nextRemaining: number[] = [];

          if (remaining.length > 0 && remaining[0] === arrivedNodeId) {
            if (remaining.length > 1) {
              nextHopTarget = remaining[1];
              nextRemaining = remaining.slice(1);
            }
          } else if (remaining.length > 0) {
            nextHopTarget = remaining[0];
            nextRemaining = remaining.slice(1);
          }

          // If remaining hops exhausted at this node, lookup its Dijkstra route to Gateway:
          if (nextHopTarget === null && arrivedNodeId !== 0) {
            const currentNode = this.nodeStates.find(n => n.id === arrivedNodeId);
            const routeToGw = currentNode?.routeToGateway || [];
            if (routeToGw.length > 1) {
              nextHopTarget = routeToGw[1];
              nextRemaining = routeToGw.slice(1);
            }
          }

          if (nextHopTarget !== null && this.gatewayOnline) {
            const forwardedPacket: LoRaPacket = {
              ...anim.packet,
              sourceNodeId: arrivedNodeId,
              destNodeId: nextHopTarget,
              hopCount: anim.packet.hopCount + 1,
              remainingPath: nextRemaining,
              payloadSummary: isMaster 
                ? `MASTER N${this.currentMasterId} RELAY [${anim.packet.packetType}] N${anim.packet.nodeId}->GW` 
                : `FWD N${arrivedNodeId}->N${nextHopTarget} (orig: N${anim.packet.nodeId})`
            };

            this.spawnPacketAnimation(arrivedNodeId, nextHopTarget, forwardedPacket);
          }
        }
      }
    }
  }

  /**
   * Graceful Master Handover
   */
  public triggerGracefulHandover(reasonOverride?: string) {
    const reason = reasonOverride || "Operator triggered graceful handover drill";
    const result = executeMasterHandover(this.currentMasterId, this.nodeStates, reason);
    if (!result) return;

    const oldId = result.oldMasterId;
    const newId = result.newMasterId;

    this.electionLogs.unshift(result);
    this.addLog(
      'MASTER',
      'WARN',
      `Master Handover Initiated`,
      `Current Master N${oldId} -> New Master N${newId}. Reason: ${reason}`
    );

    // Multi-hop route for the handover authority token across the mesh
    let handoverRoute = [oldId, newId];
    if (this.currentRouting?.adjacencyList) {
      const dResult = dijkstra(oldId, newId, this.currentRouting.adjacencyList);
      if (dResult && dResult.path && dResult.path.length > 1) {
        handoverRoute = dResult.path;
      }
    }

    const nextHop = handoverRoute[1];
    const handoverPkt = createHandoverPacket(oldId, newId, reason, nextHop);
    handoverPkt.remainingPath = handoverRoute.slice(1);
    this.packetLogs.unshift(handoverPkt);
    this.spawnPacketAnimation(oldId, nextHop, handoverPkt);

    this.currentMasterId = newId;

    const oldNode = this.nodeStates.find(n => n.id === oldId);
    if (oldNode) {
      oldNode.health.status = 'DEGRADED';
      oldNode.health.isSafe = false;
    }

    this.recomputeTopology();

    this.addLog(
      'ROUTING',
      'SUCCESS',
      `Mesh Converged on Node ${newId}`,
      `Node ${newId} is now Master Node. Multi-hop routing from Nodes 2, 3 and all sectors redirected to N${newId}.`
    );
  }

  /**
   * Sudden Failure (Heartbeat Timeout & Consensus Election)
   */
  public triggerSuddenElection() {
    const deadId = this.currentMasterId;
    const deadNode = this.nodeStates.find(n => n.id === deadId);
    if (deadNode) {
      deadNode.isAlive = false;
      deadNode.health.status = 'FAILED';
      deadNode.health.overallScore = 0;
    }

    this.addLog(
      'MASTER',
      'DANGER',
      `Master Heartbeat Timeout (Node ${deadId})`,
      `Watchdog timeout expired (>3000ms). Node ${deadId} uncontactable. Initiating consensus election.`
    );

    const result = executeSuddenFailureElection(deadId, this.nodeStates);
    if (!result) return;

    this.electionLogs.unshift(result);
    this.currentMasterId = result.newMasterId;

    const winnerPkt = createElectionWinnerPacket(result.newMasterId, 2);
    this.packetLogs.unshift(winnerPkt);

    const newMasterNode = this.nodeStates.find(n => n.id === result.newMasterId);
    if (newMasterNode) {
      for (const neighborId of newMasterNode.neighbors) {
        this.spawnPacketAnimation(result.newMasterId, neighborId, winnerPkt);
      }
    }

    this.recomputeTopology();

    this.addLog(
      'MASTER',
      'SUCCESS',
      `Autonomous Recovery: Node ${result.newMasterId} Elected`,
      `Consensus resolved with highest candidate fitness score (${result.candidateScores[0].totalScore}%). Multi-hop routing restored.`
    );
  }

  public killMaster() {
    const master = this.nodeStates.find(n => n.id === this.currentMasterId);
    if (master) {
      master.isAlive = false;
      master.health.status = 'FAILED';
      master.health.overallScore = 0;
      master.health.isSafe = false;
      this.triggerSuddenElection();
    }
  }

  /**
   * Manually designate a specific node as the Master Node
   */
  public setMasterNode(newMasterId: number) {
    if (newMasterId === this.currentMasterId) return;

    const targetNode = this.nodeStates.find(n => n.id === newMasterId);
    if (!targetNode || !targetNode.isAlive) {
      this.addLog(
        'MASTER',
        'DANGER',
        `Master Designation Failed`,
        `Cannot set Node ${newMasterId} as Master: Node is offline or unreachable.`
      );
      return;
    }

    const oldId = this.currentMasterId;
    this.currentMasterId = newMasterId;

    const aliveSet = new Set(this.nodeStates.filter(n => n.isAlive).map(n => n.id));
    const candidateScores = this.nodeStates
      .filter(n => n.isAlive)
      .map(node => calculateCandidateScore(node, this.nodeStates, aliveSet))
      .sort((a, b) => b.totalScore - a.totalScore);

    const electionResult: MasterElectionResult = {
      oldMasterId: oldId,
      newMasterId: newMasterId,
      reason: `Operator designated Node ${newMasterId} as Regional Master Node`,
      triggerType: 'GRACEFUL_HANDOVER',
      candidateScores,
      timestamp: Date.now()
    };
    this.electionLogs.unshift(electionResult);

    // Multi-hop route for handover packet if old node is alive
    const oldNode = this.nodeStates.find(n => n.id === oldId);
    if (oldNode && oldNode.isAlive) {
      let handoverRoute = [oldId, newMasterId];
      if (this.currentRouting?.adjacencyList) {
        const dResult = dijkstra(oldId, newMasterId, this.currentRouting.adjacencyList);
        if (dResult && dResult.path && dResult.path.length > 1) {
          handoverRoute = dResult.path;
        }
      }
      const nextHop = handoverRoute[1] || newMasterId;
      const handoverPkt = createHandoverPacket(oldId, newMasterId, `Operator designated N${newMasterId} as Master`, nextHop);
      handoverPkt.remainingPath = handoverRoute.slice(1);
      this.packetLogs.unshift(handoverPkt);
      this.spawnPacketAnimation(oldId, nextHop, handoverPkt);
    } else {
      const winnerPkt = createElectionWinnerPacket(newMasterId, 2);
      this.packetLogs.unshift(winnerPkt);
      for (const neighborId of targetNode.neighbors) {
        this.spawnPacketAnimation(newMasterId, neighborId, winnerPkt);
      }
    }

    this.recomputeTopology();

    this.addLog(
      'MASTER',
      'SUCCESS',
      `Master Node Designated: Node ${newMasterId}`,
      `Node ${newMasterId} (${targetNode.name}) is now the active Master Node. All telemetry and multi-hop paths re-routed.`
    );

    this.notify();
  }

  public setScenario(scenario: ScenarioType) {
    this.scenario = scenario;
    this.demoRunning = false;
    this.disasterPhaseTimer = 0;

    if (scenario === 'NORMAL') {
      this.resetSimulation();
      this.addLog('EARLY_WARNING', 'INFO', 'Baseline Nominal', 'Environmental parameters nominal across all sectors.');
    } else if (scenario === 'FIRE') {
      this.disasterPhase = 1;
      this.evacuationState = 'STANDBY';
      this.evacuationProgress = 0.0;
      this.phaseNarration = 'Phase 1: Incipient thermal plume detected on mountain ridge. Dispatching early warning...';
      this.addLog('EARLY_WARNING', 'WARN', 'Forest Fire Anomaly', 'Thermal sensor uptick on mountain ridge. Transmitting early warning packet.');
      this.dispatchEmergencyAlert(1, 'FIRE', 65);
    } else if (scenario === 'FLOOD') {
      this.disasterPhase = 1;
      this.evacuationState = 'STANDBY';
      this.evacuationProgress = 0.0;
      this.phaseNarration = 'Phase 1: Heavy precipitation & catchment rise rate detected. River weir warning threshold active.';
      this.addLog('EARLY_WARNING', 'WARN', 'Flood Catchment Surge', 'Ultrasonic river sensors detect rapid inflow. Transmitting early warning packet.');
      this.dispatchEmergencyAlert(4, 'FLOOD', 68);
    } else if (scenario === 'LANDSLIDE') {
      this.disasterPhase = 1;
      this.evacuationState = 'STANDBY';
      this.evacuationProgress = 0.0;
      this.phaseNarration = 'Phase 1: Mountain slope tilt & shear vibration detected near Node 1. Dispatching early warning...';
      this.addLog('EARLY_WARNING', 'WARN', 'Slope Instability', 'Geophone and tilt sensors detect shear displacement near Node 1. Transmitting early warning packet.');
      this.dispatchEmergencyAlert(1, 'LANDSLIDE', 72);
    } else if (scenario === 'MASTER_HANDOVER') {
      this.triggerGracefulHandover("Thermal stress & battery degradation drill");
    } else if (scenario === 'MASTER_FAILURE') {
      this.killMaster();
    } else if (scenario === 'COMPLETE_DEMO') {
      this.startCompleteDemo();
    }

    this.notify();
  }

  public resetSimulation() {
    this.demoRunning = false;
    this.currentDemoStepIndex = 0;
    this.demoStepElapsedMs = 0;
    this.scenario = 'NORMAL';
    this.disasterPhase = 1;
    this.disasterPhaseTimer = 0;
    this.evacuationState = 'STANDBY';
    this.evacuationProgress = 0.0;
    this.currentMasterId = 5;
    this.gatewayOnline = true;
    this.activePacketAnimations = [];
    this.initNodes();
    this.recomputeTopology();
    this.addLog('EARLY_WARNING', 'INFO', 'System Reset', 'Network reset to nominal conditions. Node 5 is Master Node.');
    this.notify();
  }

  public startCompleteDemo() {
    this.resetSimulation();
    this.scenario = 'COMPLETE_DEMO';
    this.demoRunning = true;
    this.currentDemoStepIndex = 0;
    this.demoStepElapsedMs = 0;
    this.executeDemoStep(0);
    this.notify();
  }

  private tickDemoSequence(dtSec: number) {
    if (!this.demoRunning) return;

    const currentStep = COMPLETE_DEMO_STEPS[this.currentDemoStepIndex];
    if (!currentStep) {
      this.demoRunning = false;
      return;
    }

    this.demoStepElapsedMs += dtSec * 1000;

    if (this.demoStepElapsedMs >= currentStep.durationMs) {
      this.demoStepElapsedMs = 0;
      this.currentDemoStepIndex++;
      if (this.currentDemoStepIndex >= COMPLETE_DEMO_STEPS.length) {
        this.demoRunning = false;
        this.addLog('EARLY_WARNING', 'SUCCESS', 'Complete Demo Finished', 'All 14 milestones completed with full resilience.');
      } else {
        this.executeDemoStep(this.currentDemoStepIndex);
      }
    }
  }

  private executeDemoStep(index: number) {
    const step = COMPLETE_DEMO_STEPS[index];
    if (!step) return;

    this.phaseNarration = `${step.title}: ${step.description}`;
    this.addLog('EARLY_WARNING', 'INFO', step.title, step.description);

    switch (step.action) {
      case 'SET_NORMAL':
        this.disasterPhase = 1;
        this.evacuationState = 'STANDBY';
        break;
      case 'DETECT_ANOMALY':
        this.disasterPhase = 1;
        this.evacuationState = 'STANDBY';
        break;
      case 'DISPATCH_WARNING':
        this.disasterPhase = 2;
        this.evacuationState = 'WARNING_ISSUED';
        break;
      case 'EVACUATE_VILLAGE':
        this.disasterPhase = 3;
        this.evacuationState = 'EVACUATING';
        this.evacuationProgress = 0.6;
        break;
      case 'PEAK_DISASTER':
        this.disasterPhase = 4;
        this.evacuationState = 'EVACUATED_SAFE';
        this.evacuationProgress = 1.0;
        break;
      case 'TRIGGER_HANDOVER':
        this.disasterPhase = 4;
        this.evacuationState = 'EVACUATED_SAFE';
        if (this.currentMasterId === 1) {
          this.triggerGracefulHandover("Critical thermal stress (82°C) and imminent failure");
        }
        break;
      case 'KILL_OLD_MASTER':
        const node1 = this.nodeStates.find(n => n.id === 1);
        if (node1) {
          node1.isAlive = false;
          node1.health.status = 'FAILED';
          node1.health.overallScore = 0;
          this.recomputeTopology();
          this.addLog('MASTER', 'DANGER', 'Node 1 De-energized', 'Original Master Node 1 shut down safely post-handover.');
        }
        break;
      case 'CONVERGE_REROUTE':
      case 'VERIFY_GATEWAY':
      case 'COMPLETE':
        this.recomputeTopology();
        break;
    }
  }

  public getNodeStates(): NodeState[] {
    return this.nodeStates;
  }

  public getNetworkState(): NetworkState {
    const aliveNodes = this.nodeStates.filter(n => n.isAlive);
    const routesMap: Record<number, number[]> = {};
    let totalHops = 0;

    for (const node of aliveNodes) {
      routesMap[node.id] = node.routeToGateway;
      totalHops += Math.max(0, node.routeToGateway.length - 1);
    }

    const avgHops = aliveNodes.length > 0 ? Math.round((totalHops / aliveNodes.length) * 10) / 10 : 0;

    let topHazard: HazardType = 'NONE';
    let maxSev = 0;
    for (const n of aliveNodes) {
      if (n.aiResult.severity > maxSev) {
        maxSev = n.aiResult.severity;
        topHazard = n.aiResult.primaryHazard;
      }
    }

    return {
      currentMasterId: this.currentMasterId,
      gatewayOnline: this.gatewayOnline,
      totalActiveNodes: aliveNodes.length,
      totalPacketsRouted: this.packetLogs.length,
      meshPacketLossRate: 0.01,
      averageHopCount: avgHops,
      activeHazard: topHazard,
      scenario: this.scenario,
      isSimulating: true,
      simulationSpeed: 1,
      routes: routesMap,
      evacuationState: this.evacuationState,
      evacuationProgress: this.evacuationProgress,
      disasterPhase: this.disasterPhase,
      phaseNarration: this.phaseNarration
    };
  }

  public getPacketAnimations(): ActivePacketAnimation[] {
    return this.activePacketAnimations;
  }

  public getEventLogs(): TelemetryLog[] {
    return this.eventLogs;
  }

  public getPacketLogs(): LoRaPacket[] {
    return this.packetLogs;
  }

  public getElectionLogs(): MasterElectionResult[] {
    return this.electionLogs;
  }

  public getDemoStatus(): { running: boolean; stepIndex: number; currentStep: DemoStep | null; progress: number } {
    const currentStep = COMPLETE_DEMO_STEPS[this.currentDemoStepIndex] || null;
    const stepProgress = currentStep ? Math.min(1.0, this.demoStepElapsedMs / currentStep.durationMs) : 0;
    return {
      running: this.demoRunning,
      stepIndex: this.currentDemoStepIndex,
      currentStep,
      progress: stepProgress
    };
  }
}

export const simulationEngine = new SimulationEngine();
