import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { NodeState } from '../types';

interface SensorNode3DProps {
  node: NodeState;
  isSelected: boolean;
  onSelect: (nodeId: number) => void;
}

export const SensorNode3D: React.FC<SensorNode3DProps> = ({
  node,
  isSelected,
  onSelect
}) => {
  const haloRef = useRef<THREE.Mesh>(null);
  const antennaGlowRef = useRef<THREE.Mesh>(null);

  // Status LED color mapping
  const getStatusColor = () => {
    if (!node.isAlive) return '#475569'; // Slate dead
    switch (node.aiResult.status) {
      case 'CRITICAL': return '#ef4444'; // Red
      case 'WARNING': return '#f59e0b';  // Amber
      case 'WATCH': return '#06b6d4';    // Cyan
      case 'NORMAL': return '#10b981';   // Emerald
    }
  };

  const statusColor = getStatusColor();

  useFrame((_, delta) => {
    if (haloRef.current && node.isMaster) {
      haloRef.current.rotation.z += delta * 1.5;
    }
    if (antennaGlowRef.current) {
      antennaGlowRef.current.rotation.y += delta * 2.0;
    }
  });

  const [x, y, z] = node.position3D;

  return (
    <group position={[x, y, z]}>
      {/* Interactive Hitbox */}
      <mesh
        position={[0, 0.8, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        visible={false}
      >
        <boxGeometry args={[1.8, 2.4, 1.8]} />
        <meshBasicMaterial />
      </mesh>

      {/* Tree Mounting for Node 1 (Mountain Pine Tree) vs Ground Anchor Post for others */}
      {node.id === 1 ? (
        <group>
          {/* Mountain Pine Tree Trunk extending to mountain ground level */}
          <mesh position={[0.42, -1.2, -0.15]} castShadow>
            <cylinderGeometry args={[0.26, 0.38, 4.4, 8]} />
            <meshStandardMaterial color="#3b2010" roughness={0.92} />
          </mesh>
          {/* Pine Tree Upper Foliage Cones */}
          <group position={[0.42, 1.2, -0.15]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <coneGeometry args={[1.5, 2.0, 7]} />
              <meshStandardMaterial color="#1a351a" roughness={0.85} />
            </mesh>
            <mesh position={[0, 1.6, 0]} castShadow>
              <coneGeometry args={[1.1, 1.6, 7]} />
              <meshStandardMaterial color="#244724" roughness={0.85} />
            </mesh>
            <mesh position={[0, 2.4, 0]} castShadow>
              <coneGeometry args={[0.7, 1.2, 7]} />
              <meshStandardMaterial color="#315c31" roughness={0.85} />
            </mesh>
          </group>
          {/* Heavy-duty Galvanized Steel Tree-Mounting Clamp & Bracket */}
          <group position={[0.2, 0.75, -0.08]}>
            <mesh castShadow>
              <boxGeometry args={[0.45, 0.12, 0.25]} />
              <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Trunk clamp band */}
            <mesh position={[0.22, 0, -0.05]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.3, 0.3, 0.08, 16, 1, true]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
      ) : (
        /* Standard Ground Foundation / Anchor Post */
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 0.6, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
      )}

      {/* Weatherproof IP67 Sensor Box (Enclosure) */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.55, 0.45]} />
        <meshStandardMaterial 
          color={!node.isAlive ? "#1e293b" : isSelected ? "#38bdf8" : "#94a3b8"} 
          metalness={0.65} 
          roughness={0.35} 
        />
      </mesh>

      {/* Front Enclosure Panel (Dark faceplate) */}
      <mesh position={[0, 0.75, 0.23]}>
        <planeGeometry args={[0.58, 0.44]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} />
      </mesh>

      {/* Multi-color Status Indicator LED */}
      <mesh position={[0.2, 0.88, 0.24]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial 
          color={statusColor} 
          emissive={statusColor} 
          emissiveIntensity={node.isAlive ? 2.5 : 0.2} 
        />
      </mesh>

      {/* Small Angled Solar Panel */}
      <group position={[0, 1.12, 0]} rotation={[0.4, 0, 0]}>
        {/* Panel Mount Bracket */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        {/* Solar Glass Cell */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.85, 0.03, 0.6]} />
          <meshStandardMaterial 
            color="#1e1b4b" 
            roughness={0.15} 
            metalness={0.85} 
            emissive="#1e3a8a" 
            emissiveIntensity={0.2} 
          />
        </mesh>
      </group>

      {/* Weatherproof Optical Camera Turret */}
      <group position={[-0.32, 0.85, 0.15]} rotation={[0, -0.4, 0.1]}>
        {/* Camera body */}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.18, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        {/* Optical Lens Dome */}
        <mesh position={[0, 0, 0.1]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* 443 MHz Helical / Whip LoRa Antenna */}
      <group position={[0.26, 1.02, -0.12]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.02, 0.85, 8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Antenna Tip Glow LED */}
        <mesh ref={antennaGlowRef} position={[0, 0.86, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial 
            color={node.isMaster ? "#eab308" : "#06b6d4"} 
            emissive={node.isMaster ? "#eab308" : "#06b6d4"} 
            emissiveIntensity={node.isAlive ? 2.0 : 0} 
          />
        </mesh>
      </group>

      {/* MASTER NODE CROWN / GOLDEN AURA */}
      {node.isMaster && node.isAlive && (
        <group position={[0, 1.45, 0]}>
          {/* Golden Rotating Torus */}
          <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.65, 0.04, 12, 32]} />
            <meshStandardMaterial 
              color="#eab308" 
              emissive="#eab308" 
              emissiveIntensity={2.8} 
              roughness={0.2} 
            />
          </mesh>
          {/* Subtle Outer Energy Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.75, 0.82, 32]} />
            <meshBasicMaterial 
              color="#facc15" 
              transparent 
              opacity={0.4} 
              side={THREE.DoubleSide} 
            />
          </mesh>
        </group>
      )}

      {/* Selection Cylinder Highlight */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Floating 2D/3D Label Above Node */}
      <Html position={[0, 2.2, 0]} center distanceFactor={28} zIndexRange={[100, 0]}>
        <div 
          onClick={() => onSelect(node.id)}
          className={`cursor-pointer px-2 py-0.5 rounded text-xs font-mono font-bold tracking-tight shadow-lg transition-all flex items-center gap-1.5 border whitespace-nowrap ${
            node.isMaster 
              ? 'bg-amber-950/90 text-amber-300 border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/20' 
              : !node.isAlive
              ? 'bg-slate-900/90 text-slate-400 border-slate-700 opacity-60 line-through'
              : isSelected
              ? 'bg-cyan-950/95 text-cyan-200 border-cyan-400 ring-2 ring-cyan-400/50 scale-110'
              : 'bg-slate-900/85 text-slate-200 border-slate-700/80 hover:border-slate-400'
          }`}
        >
          <span 
            className="w-2 h-2 rounded-full inline-block animate-pulse" 
            style={{ backgroundColor: statusColor }} 
          />
          <span>N{node.id}</span>
          {node.isMaster && (
            <span className="bg-amber-500 text-slate-950 px-1 rounded text-[9px] font-extrabold uppercase">
              MASTER
            </span>
          )}
          {node.aiResult.status === 'CRITICAL' && (
            <span className="bg-red-600 text-white px-1 rounded text-[9px] font-extrabold uppercase animate-bounce">
              !
            </span>
          )}
        </div>
      </Html>
    </group>
  );
};
