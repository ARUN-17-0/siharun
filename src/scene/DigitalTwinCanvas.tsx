import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { NodeState, ActivePacketAnimation, ScenarioType, EvacuationState } from '../types';
import { ProceduralTerrain } from './ProceduralTerrain';
import { SensorNode3D } from './SensorNode3D';
import { VillageGateway3D } from './VillageGateway3D';
import { MeshLinks3D } from './MeshLinks3D';
import { PacketStream3D } from './PacketStream3D';
import { HazardOverlays3D } from './HazardOverlays3D';
import { GATEWAY_POSITION } from '../nodes/NodePhysics';

// Distant Alpine Mountain Panorama Silhouette
const DistantMountainPanorama: React.FC = () => {
  const peaks = useMemo(() => {
    const list: { position: [number, number, number]; scale: [number, number, number]; rotY: number }[] = [];
    const count = 18;
    const radius = 95;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.sin(i * 3) * 12);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const h = 28 + ((i * 7) % 22);
      const w = 32 + ((i * 5) % 20);
      list.push({
        position: [x, h * 0.45 - 6, z],
        scale: [w, h, w],
        rotY: angle + Math.PI / 4 + (i % 3) * 0.2
      });
    }
    return list;
  }, []);

  return (
    <group>
      {peaks.map((p, idx) => (
        <mesh key={`distant-peak-${idx}`} position={p.position} rotation={[0, p.rotY, 0]} scale={p.scale}>
          <coneGeometry args={[1, 1, 5]} />
          <meshStandardMaterial 
            color="#2a3848" 
            roughness={0.9} 
            metalness={0.1} 
            flatShading 
          />
        </mesh>
      ))}
      {/* Distant horizon mist disc */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[75, 140, 32]} />
        <meshBasicMaterial color="#4a6378" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

interface DigitalTwinCanvasProps {
  nodes: NodeState[];
  currentMasterId: number;
  gatewayOnline: boolean;
  selectedNodeId: number | null;
  onSelectNode: (nodeId: number) => void;
  packetAnimations: ActivePacketAnimation[];
  scenario: ScenarioType;
  evacuationState?: EvacuationState;
  evacuationProgress?: number;
  disasterPhase?: number;
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
  evacuationState = 'STANDBY',
  evacuationProgress = 0,
  disasterPhase = 1,
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

        {/* Atmospheric Sky Shader */}
        <Sky
          turbidity={6.5}
          rayleigh={2.2}
          mieCoefficient={0.005}
          mieDirectionalG={0.82}
          sunPosition={[45, 30, 25]}
        />

        {/* Realistic Natural Atmospheric Lighting */}
        <ambientLight intensity={0.42} color="#e2e8f0" />
        
        {/* Warm Golden Sunlight with Soft Shadows */}
        <directionalLight
          position={[45, 38, 25]}
          intensity={1.35}
          color="#fffbeb"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={160}
          shadow-camera-left={-55}
          shadow-camera-right={55}
          shadow-camera-top={55}
          shadow-camera-bottom={-55}
          shadow-bias={-0.0001}
        />

        {/* Sky / Ground hemisphere fill light */}
        <hemisphereLight
          args={['#7dd3fc', '#1e293b', 0.45]}
        />

        {/* Subtle Valley Horizon Fog */}
        <fog attach="fog" args={['#8da9be', 55, 145]} />

        {/* Distant Alpine Mountain Panorama Silhouette */}
        <DistantMountainPanorama />

        {/* 3D Scene Primitives */}
        <ProceduralTerrain />

        {/* Village Comm Gateway (Node 0) */}
        <VillageGateway3D 
          online={gatewayOnline} 
          evacuationState={evacuationState}
          evacuationProgress={evacuationProgress}
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
        <HazardOverlays3D 
          scenario={scenario} 
          disasterPhase={disasterPhase}
        />
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
