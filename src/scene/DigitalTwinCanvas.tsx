import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { NodeState, ActivePacketAnimation, ScenarioType } from '../types';
import { ProceduralTerrain } from './ProceduralTerrain';
import { SensorNode3D } from './SensorNode3D';
import { VillageGateway3D } from './VillageGateway3D';
import { MeshLinks3D } from './MeshLinks3D';
import { PacketStream3D } from './PacketStream3D';
import { HazardOverlays3D } from './HazardOverlays3D';
import { GATEWAY_POSITION } from '../nodes/NodePhysics';

interface DigitalTwinCanvasProps {
  nodes: NodeState[];
  currentMasterId: number;
  gatewayOnline: boolean;
  selectedNodeId: number | null;
  onSelectNode: (nodeId: number) => void;
  packetAnimations: ActivePacketAnimation[];
  scenario: ScenarioType;
  cameraPreset?: 'ISOMETRIC' | 'TOP_DOWN' | 'GATEWAY_POV' | 'RESET';
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  nodes,
  currentMasterId,
  gatewayOnline,
  selectedNodeId,
  onSelectNode,
  packetAnimations,
  scenario,
  cameraPreset
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Handle camera view preset transitions
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    if (cameraPreset === 'TOP_DOWN') {
      controls.object.position.set(0, 65, 0.1);
      controls.target.set(0, 2, 0);
    } else if (cameraPreset === 'GATEWAY_POV') {
      controls.object.position.set(GATEWAY_POSITION[0] + 12, GATEWAY_POSITION[1] + 10, GATEWAY_POSITION[2] + 12);
      controls.target.set(GATEWAY_POSITION[0], GATEWAY_POSITION[1] + 2, GATEWAY_POSITION[2]);
    } else if (selectedNodeId) {
      const selected = nodes.find(n => n.id === selectedNodeId);
      if (selected) {
        controls.target.set(...selected.position3D);
      }
    } else {
      // Default Isometric
      controls.object.position.set(38, 36, 42);
      controls.target.set(0, 2, 0);
    }
    controls.update();
  }, [cameraPreset, selectedNodeId]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#07090e]">
      <Canvas
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => onSelectNode(0)} // Deselect on background click
      >
        <PerspectiveCamera makeDefault position={[38, 36, 42]} fov={45} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2 - 0.05} // Don't clip under ground
          minDistance={10}
          maxDistance={120}
        />

        {/* Realistic Natural Atmospheric Lighting */}
        <ambientLight intensity={0.45} />
        
        {/* Soft Sun Light */}
        <directionalLight
          position={[40, 50, 20]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={140}
          shadow-camera-left={-45}
          shadow-camera-right={45}
          shadow-camera-top={45}
          shadow-camera-bottom={-45}
          shadow-bias={-0.0001}
        />

        {/* Sky / Ground hemisphere fill */}
        <hemisphereLight
          args={['#38bdf8', '#0f172a', 0.5]}
        />

        {/* Atmospheric Fog */}
        <fog attach="fog" args={['#070a10', 45, 125]} />

        {/* 3D Scene Primitives */}
        <ProceduralTerrain />

        {/* Village Comm Gateway (Node 0) */}
        <VillageGateway3D 
          online={gatewayOnline} 
          activePacketCount={packetAnimations.length} 
        />

        {/* 10 Autonomous Sensor Nodes */}
        {nodes.map(node => (
          <SensorNode3D
            key={`node-${node.id}`}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={onSelectNode}
          />
        ))}

        {/* Wireless Mesh Topology Links */}
        <MeshLinks3D
          nodes={nodes}
          currentMasterId={currentMasterId}
          selectedNodeId={selectedNodeId}
          showAllNeighbors={true}
        />

        {/* Flying 443MHz LoRa Packet Pulses */}
        <PacketStream3D animations={packetAnimations} />

        {/* Disaster Event 3D Overlays */}
        <HazardOverlays3D scenario={scenario} />
      </Canvas>

      {/* 3D Viewport Controls HUD overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg text-xs font-mono text-slate-300">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>3D DIGITAL-TWIN VIEWPORT</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">Left-Click: Orbit • Right-Click: Pan • Scroll: Zoom</span>
      </div>
    </div>
  );
};
