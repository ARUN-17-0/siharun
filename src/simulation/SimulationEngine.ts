import { 
  NodeState, 
  NetworkState, 
  ScenarioType, 
  LoRaPacket, 
  MasterElectionResult, 
  TelemetryLog, 
  ActivePacketAnimation,
  HazardType
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
  RoutingTableResult 
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
  private currentMasterId: number = 1;
  private gatewayOnline: boolean = true;
  private scenario: ScenarioType = 'NORMAL';
  private scenarioIntensity: number = 0.0;
  private activePacketAnimations: ActivePacketAnimation[] = [];
  private eventLogs: TelemetryLog[] = [];
  private packetLogs: LoRaPacket[] = [];
  private electionLogs: MasterElectionResult[] = [];
  
  // Routing cache
  private currentRouting: RoutingTableResult | null = null;

  // Packet generation throttle
  private packetTxTimer: number = 0;
  private packetTxInterval: number = 1.6; // seconds between packet bursts
  private nextTxNodeIndex: number = 0;

  // Demo sequence runner
  private demoRunning: boolean = false;
  private currentDemoStepIndex: number = 0;
  private demoStepElapsedMs: number = 0;

  // Listeners for UI state reactivity
  private stateChangeListeners: (() => void)[] = [];

  constructor() {
    this.initNodes();
    this.recomputeTopology();
    this.addLog('ROUTING', 'INFO', 'Mesh Initialized', '10 ESP32-S3 sensor nodes registered across forest, valley & village.', undefined);
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
        isMaster: def.id === 1,
        isAlive: true,
        sensorData,
        temporalFeatures,
        aiResult: {
          fireProbability: 2,
          floodProbability: 1,
          landslideProbability: 2,
          pollutionProbability: 3,
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

    this.currentMasterId = 1;
  }

  private recomputeTopology() {
    const aliveSet = new Set(this.nodeStates.filter(n => n.isAlive).map(n => n.id));

    // Update neighbors for each node
    for (const node of this.nodeStates) {
      node.neighbors = getReachableNeighbors(node.id, INITIAL_NODE_DEFINITIONS, aliveSet);
    }

    // Recompute Dijkstra mesh routing
    this.currentRouting = computeMeshRouting(this.nodeStates, this.currentMasterId, this.gatewayOnline);

    // Apply routes and candidate election scores to node states
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

      // Compute live candidate score
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

  /**
   * Main simulation tick called from animation frame or interval
   */
  public tick(dtSec: number) {
    // 1. Advance scenario intensity smoothly
    if (this.scenario !== 'NORMAL') {
      this.scenarioIntensity = Math.min(1.0, this.scenarioIntensity + dtSec * 0.12);
    } else {
      this.scenarioIntensity = Math.max(0.0, this.scenarioIntensity - dtSec * 0.25);
    }

    // 2. Handle Complete Demo automated progression
    if (this.demoRunning) {
      this.tickDemoSequence(dtSec);
    }

    // 3. Update sensors, temporal physics, and run Edge AI for each alive node
    for (const node of this.nodeStates) {
      if (!node.isAlive) continue;

      const def = INITIAL_NODE_DEFINITIONS.find(d => d.id === node.id)!;
      const prevData = this.prevSensorData.get(node.id) || node.sensorData;

      // Update physical sensors
      const { sensorData, temporalFeatures, health } = updateNodeSensors(
        node.sensorData,
        prevData,
        node.temporalFeatures,
        node.health,
        def,
        this.scenario,
        this.scenarioIntensity,
        dtSec
      );

      this.prevSensorData.set(node.id, { ...node.sensorData });
      node.sensorData = sensorData;
      node.temporalFeatures = temporalFeatures;
      node.health = health;

      // Run ESP32-S3 Edge AI inference
      let infState = this.inferenceStates.get(node.id);
      if (!infState) {
        infState = createInitialInferenceState();
        this.inferenceStates.set(node.id, infState);
      }

      const { result, updatedState } = runEdgeAIInference(node.sensorData, node.temporalFeatures, infState);
      this.inferenceStates.set(node.id, updatedState);

      const previousStatus = node.aiResult.status;
      node.aiResult = result;

      // Alert log if status upgraded to WARNING or CRITICAL
      if (result.status !== previousStatus && (result.status === 'WARNING' || result.status === 'CRITICAL')) {
        this.addLog(
          'AI',
          result.status === 'CRITICAL' ? 'DANGER' : 'WARN',
          `Threat Escalation: Node ${node.id}`,
          `Status escalated to ${result.status} | Primary Hazard: ${result.primaryHazard} (${result.severity}% severity)`,
          node.id
        );
      }
    }

    // 4. Check if Master requires handover
    const currentMaster = this.nodeStates.find(n => n.id === this.currentMasterId);
    const { needsHandover, reason } = checkMasterRequiresHandover(currentMaster);

    if (needsHandover) {
      if (currentMaster && currentMaster.isAlive) {
        // Graceful Handover
        this.triggerGracefulHandover(reason);
      } else {
        // Sudden Failure (Watchdog Timeout)
        this.triggerSuddenElection();
      }
    }

    // 5. Recompute dynamic routing based on new sensor/health costs
    this.recomputeTopology();

    // 6. Advance flying packet animations
    this.tickPacketAnimations(dtSec);

    // 7. Periodic packet generation & mesh routing
    this.packetTxTimer += dtSec;
    if (this.packetTxTimer >= this.packetTxInterval) {
      this.packetTxTimer = 0;
      this.emitPeriodicMeshPackets();
    }

    this.notify();
  }

  /**
   * Periodically dispatches simulated LoRa packets along multi-hop routes
   */
  private emitPeriodicMeshPackets() {
    const aliveNodes = this.nodeStates.filter(n => n.isAlive && n.id !== this.currentMasterId);
    if (aliveNodes.length === 0) return;

    // Pick 1 or 2 nodes in round-robin or prioritized by critical status
    const criticalNodes = aliveNodes.filter(n => n.aiResult.status === 'CRITICAL' || n.aiResult.status === 'WARNING');
    const nodesToTx = criticalNodes.length > 0 
      ? criticalNodes 
      : [aliveNodes[this.nextTxNodeIndex % aliveNodes.length]];

    this.nextTxNodeIndex = (this.nextTxNodeIndex + 1) % aliveNodes.length;

    for (const node of nodesToTx) {
      const route = node.routeToGateway;
      if (!route || route.length < 2) continue;

      const nextHopId = route[1];
      const packet = createAITelemetryPacket(node, nextHopId, this.currentMasterId);
      node.transmittedPackets++;

      // Log packet
      this.packetLogs.unshift(packet);
      if (this.packetLogs.length > 50) this.packetLogs.pop();

      // Launch 3D packet animation
      this.spawnPacketAnimation(node.id, nextHopId, packet);

      // If next hop is Master, Master aggregates and relays to Gateway
      if (nextHopId === this.currentMasterId) {
        setTimeout(() => {
          if (this.gatewayOnline) {
            const masterRoute = this.nodeStates.find(n => n.id === this.currentMasterId)?.routeToGateway || [];
            if (masterRoute.length >= 2) {
              const masterNextHop = masterRoute[1];
              const relayPacket: LoRaPacket = {
                ...packet,
                sourceNodeId: this.currentMasterId,
                destNodeId: masterNextHop,
                hopCount: packet.hopCount + 1,
                payloadSummary: `RELAY via Master N${this.currentMasterId} -> ${masterNextHop === 0 ? 'GATEWAY' : 'N' + masterNextHop}`
              };
              this.spawnPacketAnimation(this.currentMasterId, masterNextHop, relayPacket);
            }
          }
        }, 700);
      }
    }
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

  private tickPacketAnimations(dtSec: number) {
    const speed = 1.35; // Speed of propagation across links
    for (let i = this.activePacketAnimations.length - 1; i >= 0; i--) {
      const anim = this.activePacketAnimations[i];
      anim.progress += dtSec * speed;
      if (anim.progress >= 1.0) {
        // Packet reached hop destination
        if (anim.toId === 0) {
          // Arrived at Village Gateway
          if (anim.packet.packetType === 'CRITICAL_ALERT') {
            this.addLog(
              'LORA',
              'SUCCESS',
              'Gateway Alert Received',
              `Village Gateway received CRITICAL alert from Node ${anim.packet.nodeId} (${anim.packet.hazard} ${anim.packet.severity}%)`,
              anim.packet.nodeId
            );
          }
        }
        this.activePacketAnimations.splice(i, 1);
      }
    }
  }

  /**
   * Triggers Graceful Master Handover
   */
  public triggerGracefulHandover(reasonOverride?: string) {
    const reason = reasonOverride || "Operator triggered graceful handover drill";
    const result = executeMasterHandover(this.currentMasterId, this.nodeStates, reason);
    if (!result) return;

    const oldId = result.oldMasterId;
    const newId = result.newMasterId;

    // Log election result
    this.electionLogs.unshift(result);
    this.addLog(
      'MASTER',
      'WARN',
      `Master Handover Initiated`,
      `Current Master N${oldId} -> New Master N${newId}. Reason: ${reason}`
    );

    // Old master broadcasts handover packet
    const handoverPkt = createHandoverPacket(oldId, newId, reason, -1);
    this.packetLogs.unshift(handoverPkt);
    this.spawnPacketAnimation(oldId, newId, handoverPkt);

    // Switch master ID
    this.currentMasterId = newId;

    // Transition old master to degraded/unsafe
    const oldNode = this.nodeStates.find(n => n.id === oldId);
    if (oldNode) {
      oldNode.health.status = 'DEGRADED';
      oldNode.health.isSafe = false;
    }

    // Rebuild topology around new master
    this.recomputeTopology();

    this.addLog(
      'ROUTING',
      'SUCCESS',
      `Topology Rerouted to Node ${newId}`,
      `Node ${newId} assumed Regional Master role. All surrounding node routes converged successfully.`
    );
  }

  /**
   * Triggers Sudden Master Failure (Heartbeat Timeout & Consensus Election)
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
      `Master Heartbeat Lost (Node ${deadId})`,
      `Watchdog timeout expired (T_timeout > 3000ms). Node ${deadId} uncontactable. Initiating distributed master election.`
    );

    const result = executeSuddenFailureElection(deadId, this.nodeStates);
    if (!result) return;

    this.electionLogs.unshift(result);
    this.currentMasterId = result.newMasterId;

    // Winner broadcasts election packet
    const winnerPkt = createElectionWinnerPacket(result.newMasterId, 2);
    this.packetLogs.unshift(winnerPkt);

    // Notify all reachable neighbors
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
      `Self-Healing Complete: Node ${result.newMasterId} Elected`,
      `Distributed election resolved with highest fitness score (${result.candidateScores[0].totalScore}%). Mesh restored.`
    );
  }

  /**
   * Kill Master explicitly (button on control panel)
   */
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
   * Switch Active Disaster Scenario
   */
  public setScenario(scenario: ScenarioType) {
    this.scenario = scenario;
    this.demoRunning = false;

    if (scenario === 'NORMAL') {
      this.scenarioIntensity = 0.0;
      this.resetSimulation();
      this.addLog('SCENARIO', 'INFO', 'Normal Baseline Active', 'Environmental parameters nominal across all monitoring sectors.');
    } else if (scenario === 'FIRE') {
      this.scenarioIntensity = 0.4;
      this.addLog('SCENARIO', 'WARN', 'Forest Fire Scenario Active', 'Thermal anomaly and smoke density escalating in Forest Upper Ridge.');
    } else if (scenario === 'FLOOD') {
      this.scenarioIntensity = 0.4;
      this.addLog('SCENARIO', 'WARN', 'Flash Flood Scenario Active', 'Monsoon precipitation and river catchment surge detected.');
    } else if (scenario === 'LANDSLIDE') {
      this.scenarioIntensity = 0.4;
      this.addLog('SCENARIO', 'WARN', 'Landslide Scenario Active', 'Soil saturation and tilt shear displacement detected on steep slope.');
    } else if (scenario === 'POLLUTION') {
      this.scenarioIntensity = 0.4;
      this.addLog('SCENARIO', 'WARN', 'Pollution Scenario Active', 'Particulate matter PM2.5/PM10 and gas inversion detected near village boundary.');
    } else if (scenario === 'MASTER_HANDOVER') {
      this.triggerGracefulHandover("Thermal stress & battery degradation test");
    } else if (scenario === 'MASTER_FAILURE') {
      this.killMaster();
    } else if (scenario === 'COMPLETE_DEMO') {
      this.startCompleteDemo();
    }

    this.notify();
  }

  /**
   * Reset the entire simulation state to pristine nominal conditions
   */
  public resetSimulation() {
    this.demoRunning = false;
    this.currentDemoStepIndex = 0;
    this.demoStepElapsedMs = 0;
    this.scenario = 'NORMAL';
    this.scenarioIntensity = 0.0;
    this.currentMasterId = 1;
    this.gatewayOnline = true;
    this.activePacketAnimations = [];
    this.initNodes();
    this.recomputeTopology();
    this.addLog('SCENARIO', 'INFO', 'System Reset', 'Mesh simulation reset to initial conditions. Node 1 is Regional Master.');
    this.notify();
  }

  /**
   * Start 14-Step Complete Demo
   */
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
        this.addLog('SCENARIO', 'SUCCESS', 'Complete Demo Finished', 'All 14 demonstration milestones completed with verified resilience.');
      } else {
        this.executeDemoStep(this.currentDemoStepIndex);
      }
    }
  }

  private executeDemoStep(index: number) {
    const step = COMPLETE_DEMO_STEPS[index];
    if (!step) return;

    this.addLog('SCENARIO', 'INFO', step.title, step.description);

    switch (step.action) {
      case 'SET_NORMAL':
        this.scenarioIntensity = 0.0;
        break;
      case 'START_FIRE':
        this.scenarioIntensity = 0.35;
        break;
      case 'ESCALATE_FIRE':
        this.scenarioIntensity = 0.85;
        break;
      case 'TRIGGER_HANDOVER':
        this.scenarioIntensity = 0.95;
        if (this.currentMasterId === 1) {
          this.triggerGracefulHandover("Critical thermal stress (82°C) and imminent node failure");
        }
        break;
      case 'KILL_OLD_MASTER':
        const node1 = this.nodeStates.find(n => n.id === 1);
        if (node1) {
          node1.isAlive = false;
          node1.health.status = 'FAILED';
          node1.health.overallScore = 0;
          this.recomputeTopology();
          this.addLog('MASTER', 'DANGER', 'Node 1 Offline', 'Original Master Node 1 successfully de-energized post-handover.');
        }
        break;
      case 'CONVERGE_REROUTE':
      case 'VERIFY_GATEWAY':
      case 'COMPLETE':
        this.recomputeTopology();
        break;
    }
  }

  // Getters for React UI components
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

    // Detect active primary hazard
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
      meshPacketLossRate: 0.02,
      averageHopCount: avgHops,
      activeHazard: topHazard,
      scenario: this.scenario,
      isSimulating: true,
      simulationSpeed: 1,
      routes: routesMap
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

// Global Singleton Instance
export const simulationEngine = new SimulationEngine();
