import React, { useState, useEffect, useRef } from 'react';
import { simulationEngine } from './simulation/SimulationEngine';
import { 
  NodeState, 
  NetworkState, 
  LoRaPacket, 
  ActivePacketAnimation, 
  TelemetryLog, 
  MasterElectionResult,
  ScenarioType 
} from './types';
import { DigitalTwinCanvas } from './scene/DigitalTwinCanvas';
import { TopNavigation } from './ui/TopNavigation';
import { ScenarioControls } from './ui/ScenarioControls';
import { LeftNodePanel } from './ui/LeftNodePanel';
import { RightInspector } from './ui/RightInspector';
import { BottomTerminal } from './ui/BottomTerminal';
import { DemoTimelineOverlay } from './ui/DemoTimelineOverlay';

export const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeState[]>(simulationEngine.getNodeStates());
  const [network, setNetwork] = useState<NetworkState>(simulationEngine.getNetworkState());
  const [packetAnimations, setPacketAnimations] = useState<ActivePacketAnimation[]>([]);
  const [eventLogs, setEventLogs] = useState<TelemetryLog[]>([]);
  const [packetLogs, setPacketLogs] = useState<LoRaPacket[]>([]);
  const [electionLogs, setElectionLogs] = useState<MasterElectionResult[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(1);
  const [cameraPreset, setCameraPreset] = useState<'ISOMETRIC' | 'TOP_DOWN' | 'GATEWAY_POV' | 'STATION_POV'>('ISOMETRIC');
  const [demoStatus, setDemoStatus] = useState(simulationEngine.getDemoStatus());

  const lastTimeRef = useRef<number>(performance.now());

  // Subscribe to engine state updates with 50ms (~20Hz) throttling to eliminate CPU starvation
  useEffect(() => {
    let lastFlushTime = 0;
    const unsubscribe = simulationEngine.subscribe(() => {
      const now = performance.now();
      if (now - lastFlushTime >= 50) {
        lastFlushTime = now;
        setNodes([...simulationEngine.getNodeStates()]);
        setNetwork({ ...simulationEngine.getNetworkState() });
        setPacketAnimations([...simulationEngine.getPacketAnimations()]);
        setEventLogs([...simulationEngine.getEventLogs()]);
        setPacketLogs([...simulationEngine.getPacketLogs()]);
        setElectionLogs([...simulationEngine.getElectionLogs()]);
        setDemoStatus(simulationEngine.getDemoStatus());
      }
    });

    return unsubscribe;
  }, []);

  // Main simulation tick loop
  useEffect(() => {
    let animId: number;

    const loop = (time: number) => {
      const dtMs = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Limit dt to avoid large steps when tab is inactive
      const dtSec = Math.min(0.1, Math.max(0.001, dtMs / 1000));
      simulationEngine.tick(dtSec);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const flushStateImmediately = () => {
    setNodes([...simulationEngine.getNodeStates()]);
    setNetwork({ ...simulationEngine.getNetworkState() });
    setPacketAnimations([...simulationEngine.getPacketAnimations()]);
    setEventLogs([...simulationEngine.getEventLogs()]);
    setPacketLogs([...simulationEngine.getPacketLogs()]);
    setElectionLogs([...simulationEngine.getElectionLogs()]);
    setDemoStatus(simulationEngine.getDemoStatus());
  };

  // Handlers
  const handleSelectScenario = (scenario: ScenarioType) => {
    simulationEngine.setScenario(scenario);
    flushStateImmediately();
  };

  const handleTriggerHandover = () => {
    simulationEngine.triggerGracefulHandover();
    flushStateImmediately();
  };

  const handleKillMaster = () => {
    simulationEngine.killMaster();
    flushStateImmediately();
  };

  const handleReset = () => {
    simulationEngine.resetSimulation();
    setSelectedNodeId(1);
    setCameraPreset('ISOMETRIC');
    flushStateImmediately();
  };

  const handleStopDemo = () => {
    simulationEngine.resetSimulation();
    flushStateImmediately();
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-sans antialiased overflow-hidden select-none">
      {/* 1. TOP STATUS & NAVIGATION BAR */}
      <TopNavigation 
        network={network} 
        onCameraPreset={(preset) => setCameraPreset(preset)}
        activeCamera={cameraPreset}
      />

      {/* 2. SCENARIO CONTROL DOCK */}
      <div className="px-4 py-2 bg-[#0c1322]/90 border-b border-slate-800/70 z-20">
        <ScenarioControls
          currentScenario={network.scenario}
          onSelectScenario={handleSelectScenario}
          onTriggerHandover={handleTriggerHandover}
          onKillMaster={handleKillMaster}
          onReset={handleReset}
          isDemoRunning={demoStatus.running}
        />
      </div>

      {/* 3. MAIN WORKSPACE (LEFT PANEL + 3D VIEWPORT + RIGHT INSPECTOR) */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Node Fleet List */}
        <LeftNodePanel
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          currentMasterId={network.currentMasterId}
          onSelectNode={(id) => setSelectedNodeId(id)}
        />

        {/* Center 3D Digital-Twin Viewport */}
        <div className="flex-1 h-full relative">
          <DigitalTwinCanvas
            nodes={nodes}
            currentMasterId={network.currentMasterId}
            gatewayOnline={network.gatewayOnline}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => setSelectedNodeId(id > 0 ? id : null)}
            packetAnimations={packetAnimations}
            scenario={network.scenario}
            evacuationState={network.evacuationState}
            evacuationProgress={network.evacuationProgress}
            disasterPhase={network.disasterPhase}
            cameraPreset={cameraPreset}
          />

          {/* Complete Demo 14-Step Timeline Narration Overlay */}
          <DemoTimelineOverlay
            demoStatus={demoStatus}
            onStopDemo={handleStopDemo}
          />
        </div>

        {/* Right Node Sensor & Edge AI Inspector */}
        <RightInspector
          selectedNode={selectedNode}
          currentMasterId={network.currentMasterId}
          scenario={network.scenario}
          disasterPhase={network.disasterPhase}
          onSelectNode={(id) => setSelectedNodeId(id)}
        />
      </div>

      {/* 4. BOTTOM LOGS TERMINAL */}
      <BottomTerminal
        logs={eventLogs}
        elections={electionLogs}
      />
    </div>
  );
};

export default App;
