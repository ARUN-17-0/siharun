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

      {/* Tree Mounting for Node 1 (Mountain Pine Tree) vs Heavy-Duty Ground Foundation for others */}
      {node.id === 1 ? (
        <group>
          {/* Mountain Pine Tree Trunk extending down to mountain terrain */}
          <mesh position={[0.42, -1.2, -0.15]} castShadow>
            <cylinderGeometry args={[0.26, 0.38, 4.4, 10]} />
            <meshStandardMaterial color="#2d1a0c" roughness={0.94} />
          </mesh>
          {/* Pine Tree Upper Foliage Cones */}
          <group position={[0.42, 1.2, -0.15]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <coneGeometry args={[1.5, 2.0, 7]} />
              <meshStandardMaterial color="#1a351a" roughness={0.88} />
            </mesh>
            <mesh position={[0, 1.6, 0]} castShadow>
              <coneGeometry args={[1.1, 1.6, 7]} />
              <meshStandardMaterial color="#224722" roughness={0.88} />
            </mesh>
            <mesh position={[0, 2.4, 0]} castShadow>
              <coneGeometry args={[0.7, 1.2, 7]} />
              <meshStandardMaterial color="#2d582d" roughness={0.88} />
            </mesh>
          </group>
          {/* Heavy-duty Stainless Steel Tree Strapping Bands & Articulated Bracket */}
          <group position={[0.2, 0.75, -0.08]}>
            <mesh castShadow>
              <boxGeometry args={[0.45, 0.14, 0.26]} />
              <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Dual trunk clamp bands with ratchet locks */}
            <mesh position={[0.22, 0.08, -0.05]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.3, 0.3, 0.05, 16, 1, true]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.22, -0.08, -0.05]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.3, 0.3, 0.05, 16, 1, true]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
      ) : (
        /* Heavy-duty Galvanized Steel Ground Tripod & Base Anchor */
        <group position={[0, 0, 0]}>
          {/* Main Central Mast Post */}
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.075, 0.7, 10]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Triangular Heavy Anchor Base Plate */}
          <mesh position={[0, 0.04, 0]} receiveShadow>
            <cylinderGeometry args={[0.35, 0.38, 0.08, 6]} />
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.35} />
          </mesh>
          {/* 3 Angled Stabilizer Struts */}
          {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => (
            <mesh 
              key={`strut-${i}`}
              position={[Math.cos(angle) * 0.22, 0.18, Math.sin(angle) * 0.22]} 
              rotation={[Math.sin(angle) * 0.6, 0, -Math.cos(angle) * 0.6]}
              castShadow
            >
              <cylinderGeometry args={[0.02, 0.02, 0.42, 6]} />
              <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {/* Industrial Powder-Coated IP67 Die-Cast Aluminum Enclosure */}
      <group position={[0, 0.78, 0]}>
        {/* Main Aluminum Chassis */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.68, 0.54, 0.42]} />
          <meshStandardMaterial 
            color={!node.isAlive ? "#1e293b" : isSelected ? "#0284c7" : "#94a3b8"} 
            metalness={0.7} 
            roughness={0.32} 
          />
        </mesh>

        {/* Rear Heatsink Cooling Fins (5 vertical aluminum fins) */}
        {[-0.2, -0.1, 0, 0.1, 0.2].map((xOffset, i) => (
          <mesh key={`fin-${i}`} position={[xOffset, 0, -0.23]} castShadow>
            <boxGeometry args={[0.025, 0.46, 0.06]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}

        {/* Stainless Steel Side Latches */}
        <mesh position={[-0.35, 0.06, 0]}>
          <boxGeometry args={[0.03, 0.12, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.35, 0.06, 0]}>
          <boxGeometry args={[0.03, 0.12, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Bottom Waterproof Cable Gland & Sensor Probe Wire */}
        <mesh position={[-0.12, -0.31, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.1, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[0.12, -0.31, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.1, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>

        {/* Front Gasketed Faceplate */}
        <mesh position={[0, 0, 0.215]}>
          <planeGeometry args={[0.58, 0.44]} />
          <meshStandardMaterial color="#0f172a" roughness={0.25} />
        </mesh>

        {/* Multi-color Status Indicator LED */}
        <mesh position={[0.2, 0.14, 0.22]}>
          <sphereGeometry args={[0.042, 12, 12]} />
          <meshStandardMaterial 
            color={statusColor} 
            emissive={statusColor} 
            emissiveIntensity={node.isAlive ? 3.0 : 0.2} 
          />
        </mesh>

        {/* Monocrystalline Solar Panel Bank */}
        <group position={[0, 0.38, 0]} rotation={[0.42, 0, 0]}>
          {/* Swivel Mount Arm */}
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.14, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.85} />
          </mesh>
          {/* Aluminum Panel Bevel Frame */}
          <mesh position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[0.88, 0.04, 0.62]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Monocrystalline Silicon Photovoltaic Wafer */}
          <mesh position={[0, 0.042, 0]}>
            <planeGeometry args={[0.82, 0.56]} />
            <meshStandardMaterial 
              color="#091428" 
              roughness={0.12} 
              metalness={0.88} 
              emissive="#1e3a8a" 
              emissiveIntensity={0.25} 
            />
          </mesh>
          {/* Silver Busbar Grid Lines */}
          <mesh position={[0, 0.044, 0]}>
            <planeGeometry args={[0.78, 0.012]} />
            <meshBasicMaterial color="#93c5fd" />
          </mesh>
        </group>

        {/* Weatherproof Optical Camera Turret with Sun Hood */}
        <group position={[-0.32, 0.12, 0.14]} rotation={[0, -0.38, 0.12]}>
          {/* Camera Housing Body */}
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.09, 0.19, 14]} />
            <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
          </mesh>
          {/* Cylindrical Sun Hood / Rain Visor */}
          <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.082, 0.082, 0.06, 14, 1, true]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} side={THREE.DoubleSide} />
          </mesh>
          {/* Anti-Reflective Optical Sapphire/Glass Lens */}
          <mesh position={[0, 0, 0.09]}>
            <sphereGeometry args={[0.062, 14, 14]} />
            <meshStandardMaterial color="#0284c7" roughness={0.06} metalness={0.94} />
          </mesh>
        </group>

        {/* 443 MHz LoRa Antenna with Brass Gold-Plated SMA Bulkhead Connector */}
        <group position={[0.26, 0.27, -0.12]}>
          {/* Brass Hex Nut SMA Connector Base */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.08, 6]} />
            <meshStandardMaterial color="#eab308" metalness={0.92} roughness={0.25} />
          </mesh>
          {/* Flexible Helical Whip Antenna Rod */}
          <mesh position={[0, 0.46, 0]} castShadow>
            <cylinderGeometry args={[0.014, 0.022, 0.84, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Antenna Tip RF Status Indicator */}
          <mesh ref={antennaGlowRef} position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.038, 8, 8]} />
            <meshStandardMaterial 
              color={node.isMaster ? "#eab308" : "#06b6d4"} 
              emissive={node.isMaster ? "#eab308" : "#06b6d4"} 
              emissiveIntensity={node.isAlive ? 2.5 : 0} 
            />
          </mesh>
        </group>
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
          className={`cursor-pointer px-2.5 py-1 rounded-md text-xs font-sans font-medium tracking-tight shadow-lg transition-all flex items-center gap-1.5 border whitespace-nowrap backdrop-blur-md ${
            node.isMaster 
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/30 shadow-amber-500/10' 
              : !node.isAlive
              ? 'bg-slate-900/80 text-slate-400 border-slate-800/80 opacity-60 line-through'
              : isSelected
              ? 'bg-sky-950/80 text-sky-200 border-sky-400/60 ring-1 ring-sky-400/40 scale-105'
              : 'bg-slate-900/80 text-slate-300 border-slate-800/80 hover:border-slate-600/80'
          }`}
        >
          <span 
            className="w-2 h-2 rounded-full inline-block" 
            style={{ backgroundColor: statusColor }} 
          />
          <span className="font-mono font-semibold">N{node.id}</span>
          {node.isMaster && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase">
              MASTER
            </span>
          )}
          {node.aiResult.status === 'CRITICAL' && (
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1 py-0.5 rounded text-[9px] font-semibold uppercase animate-pulse">
              !
            </span>
          )}
        </div>
      </Html>
    </group>
  );
};
