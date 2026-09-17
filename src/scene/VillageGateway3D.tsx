import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GATEWAY_POSITION } from '../nodes/NodePhysics';

interface VillageGateway3DProps {
  online: boolean;
  activePacketCount: number;
}

export const VillageGateway3D: React.FC<VillageGateway3DProps> = ({
  online
}) => {
  const beaconRef = useRef<THREE.Mesh>(null);
  const dishRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (beaconRef.current && online) {
      beaconRef.current.rotation.y += delta * 3.0;
    }
    if (dishRef.current) {
      dishRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.25 - 0.4;
    }
  });

  const [gx, gy, gz] = GATEWAY_POSITION;

  return (
    <group position={[gx, gy, gz]}>
      {/* Base Concrete Foundation */}
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.2, 0.5, 3.2]} />
        <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Communications Shelter / Control Station */}
      <mesh position={[-0.8, 1.15, -0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.3, 1.4]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Control Station Door & Vents */}
      <mesh position={[-0.8, 0.95, 0.11]}>
        <planeGeometry args={[0.5, 0.9]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Steel Communications Lattice Tower */}
      <group position={[0.7, 0.5, 0.7]}>
        {/* Main Column */}
        <mesh position={[0, 3.2, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.65, 6.4, 4]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} wireframe />
        </mesh>

        {/* Central Core Mast */}
        <mesh position={[0, 3.6, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 7.2, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>

        {/* Satellite Dish Mount */}
        <group ref={dishRef} position={[0, 5.2, 0.2]}>
          {/* Dish Parabolic Bowl */}
          <mesh rotation={[0.4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.9, 0.08, 0.25, 16, 1, true]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.4} side={THREE.DoubleSide} />
          </mesh>
          {/* Feed Horn */}
          <mesh position={[0, 0.1, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
        </group>

        {/* 443MHz LoRa High-Gain Omnidirectional Antenna Array */}
        <group position={[0, 6.8, 0]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.6} />
          </mesh>

          {/* Top Obstruction Warning Beacon */}
          <mesh ref={beaconRef} position={[0, 1.85, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial 
              color={online ? "#10b981" : "#ef4444"} 
              emissive={online ? "#10b981" : "#ef4444"} 
              emissiveIntensity={online ? 3.0 : 0.5} 
            />
          </mesh>
        </group>
      </group>

      {/* Floating 3D Label */}
      <Html position={[0, 8.2, 0]} center distanceFactor={30} zIndexRange={[100, 0]}>
        <div className="bg-slate-950/95 border border-emerald-500/80 text-emerald-400 px-3 py-1 rounded-md text-xs font-mono font-extrabold shadow-xl flex items-center gap-2 whitespace-nowrap ring-2 ring-emerald-500/20">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>VILLAGE COMM GATEWAY</span>
          <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded border border-emerald-800">
            443MHz SINK
          </span>
        </div>
      </Html>
    </group>
  );
};
