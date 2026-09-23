import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { GATEWAY_POSITION } from '../nodes/NodePhysics';
import { EvacuationState } from '../types';

interface VillageGateway3DProps {
  online: boolean;
  evacuationState: EvacuationState;
  evacuationProgress: number;
}

export const VillageGateway3D: React.FC<VillageGateway3DProps> = ({
  online,
  evacuationState,
  evacuationProgress
}) => {
  const beaconRef = useRef<THREE.Mesh>(null);
  const dishRef = useRef<THREE.Group>(null);
  const sirenLightRef = useRef<THREE.PointLight>(null);
  const evacConvoyRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (beaconRef.current && online) {
      beaconRef.current.rotation.y += delta * 3.0;
    }
    if (dishRef.current) {
      dishRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.25 - 0.4;
    }

    // Siren flashing strobe when warning issued or evacuating
    if (sirenLightRef.current) {
      if (evacuationState === 'WARNING_ISSUED' || evacuationState === 'EVACUATING') {
        const strobe = Math.sin(state.clock.getElapsedTime() * 10.0) > 0 ? 8.0 : 0.0;
        sirenLightRef.current.intensity = strobe;
      } else {
        sirenLightRef.current.intensity = 0;
      }
    }

    // Evacuation convoy movement along road to high ground
    if (evacConvoyRef.current) {
      if (evacuationState === 'EVACUATING' || evacuationState === 'EVACUATED_SAFE') {
        evacConvoyRef.current.visible = true;
        // Move convoy along road from village (x: 22, z: 12) to high ground (x: 34, z: 28)
        const t = evacuationState === 'EVACUATED_SAFE' ? 1.0 : evacuationProgress;
        evacConvoyRef.current.position.x = 22 + t * 14.0;
        evacConvoyRef.current.position.z = 12 + t * 16.0;
        evacConvoyRef.current.position.y = 1.9 + t * 1.5; // climbing to high ground
      } else {
        evacConvoyRef.current.visible = false;
      }
    }
  });

  const [gx, gy, gz] = GATEWAY_POSITION;

  return (
    <group position={[gx, gy, gz]}>
      {/* Base Concrete Foundation with Chamfered Edges */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.4, 3.8]} />
        <meshStandardMaterial color="#475569" roughness={0.88} metalness={0.2} />
      </mesh>
      {/* Perimeter Safety Curb */}
      <mesh position={[0, 0.42, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.08, 3.6]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Dual Weatherproof Telecom & Battery Enclosure Cabinets */}
      <group position={[-0.9, 0.95, -0.6]}>
        {/* Main Cabinet */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.3, 1.3, 1.1]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.4} />
        </mesh>
        {/* Louvered Ventilation Panel */}
        <mesh position={[0, 0.35, 0.56]}>
          <planeGeometry args={[0.9, 0.3]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        {/* Front Door Seam & Handle */}
        <mesh position={[0.42, 0, 0.56]}>
          <boxGeometry args={[0.04, 0.18, 0.02]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        {/* Solar Power Inverter Box Mounted on Side */}
        <mesh position={[0.68, 0.1, 0]}>
          <boxGeometry args={[0.08, 0.6, 0.4]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>

      {/* Dual Monocrystalline Solar Panels on Angle Framework */}
      <group position={[-0.9, 1.85, 0.7]} rotation={[0.45, 0, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.6, 0.05, 0.9]} />
          <meshStandardMaterial color="#091428" roughness={0.15} metalness={0.85} emissive="#1e3a8a" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, -0.2, -0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.85} />
        </mesh>
      </group>

      {/* Realistic Triangular Lattice Telecommunications Tower */}
      <group position={[0.8, 0.4, 0.6]}>
        {/* 3 Main Galvanized Steel Tubular Legs */}
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => {
          const rBase = 0.55;
          const rTop = 0.22;
          const xB = Math.cos(angle) * rBase;
          const zB = Math.sin(angle) * rBase;
          const xT = Math.cos(angle) * rTop;
          const zT = Math.sin(angle) * rTop;
          return (
            <mesh 
              key={`leg-${i}`} 
              position={[(xB + xT) / 2, 3.5, (zB + zT) / 2]} 
              rotation={[(zB - zT) * 0.15, 0, -(xB - xT) * 0.15]}
              castShadow
            >
              <cylinderGeometry args={[0.035, 0.045, 7.0, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
            </mesh>
          );
        })}

        {/* 4 Height Levels of Horizontal & Diagonal Lattice Braces */}
        {[1.4, 2.8, 4.2, 5.6].map((tierY, idx) => (
          <group key={`tier-${idx}`} position={[0, tierY, 0]}>
            {/* Triangular Ring Collar */}
            <mesh rotation={[0, Math.PI / 6, 0]}>
              <cylinderGeometry args={[0.42 - idx * 0.06, 0.46 - idx * 0.06, 0.06, 3, 1, true]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}

        {/* Top Platform / Crow's Nest Gallery */}
        <group position={[0, 7.0, 0]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.08, 6]} />
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Railing */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.44, 0.44, 0.4, 6, 1, true]} />
            <meshStandardMaterial color="#64748b" metalness={0.85} wireframe />
          </mesh>
        </group>

        {/* Parabolic Mesh Satellite / Relay Dish */}
        <group ref={dishRef} position={[0, 5.4, 0.25]}>
          <mesh rotation={[0.35, 0, 0]} castShadow>
            <cylinderGeometry args={[1.05, 0.1, 0.28, 18, 1, true]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.25} metalness={0.5} side={THREE.DoubleSide} />
          </mesh>
          {/* Feed Horn Boom Arm */}
          <mesh position={[0, 0.12, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.48, 8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.85} />
          </mesh>
        </group>

        {/* Microwave Backhaul Transceiver Drum */}
        <group position={[0, 4.2, -0.32]} rotation={[0, Math.PI, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.24, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.4} />
          </mesh>
        </group>

        {/* Disaster Early Warning 4-Horn Siren Assembly */}
        <group position={[0, 6.4, 0]}>
          {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
            <mesh 
              key={`siren-horn-${i}`}
              position={[Math.cos(angle) * 0.32, 0, Math.sin(angle) * 0.32]} 
              rotation={[0, -angle, -Math.PI / 2]}
            >
              <coneGeometry args={[0.12, 0.3, 10, 1, true]} />
              <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>

        {/* Apex Gateway Collinear Mast & Strobe */}
        <group position={[0, 7.05, 0]}>
          {/* Omnidirectional Fiberglass Collinear Repeater Mast */}
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 2.2, 10]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.6} />
          </mesh>

          {/* Aviation Obstruction Beacon */}
          <mesh ref={beaconRef} position={[0, 2.25, 0]}>
            <sphereGeometry args={[0.11, 14, 14]} />
            <meshStandardMaterial 
              color={online ? "#10b981" : "#ef4444"} 
              emissive={online ? "#10b981" : "#ef4444"} 
              emissiveIntensity={online ? 3.2 : 0.5} 
            />
          </mesh>

          {/* Emergency Siren Strobe Light (Flashes brightly when warning issued) */}
          <pointLight 
            ref={sirenLightRef} 
            position={[0, 2.4, 0]} 
            color="#ef4444" 
            intensity={0} 
            distance={50} 
          />
        </group>
      </group>

      {/* Realistic Mountain Evacuation Transport Vehicle */}
      <group ref={evacConvoyRef} visible={false}>
        {/* Chassis Body */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[2.4, 0.75, 1.1]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.35} metalness={0.4} />
        </mesh>
        {/* Cab Roof / Windshield */}
        <mesh position={[-0.2, 0.92, 0]} castShadow>
          <boxGeometry args={[1.4, 0.45, 1.0]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
        </mesh>
        {/* 4 Off-road Tires */}
        {[-0.7, 0.7].map((xOff, xi) => (
          [-0.55, 0.55].map((zOff, zi) => (
            <mesh key={`wheel-${xi}-${zi}`} position={[xOff, 0.22, zOff]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.24, 0.18, 12]} />
              <meshStandardMaterial color="#171717" roughness={0.9} />
            </mesh>
          ))
        ))}
        {/* Flashing Amber Warning Roof Beacon */}
        <mesh position={[-0.2, 1.2, 0]}>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={3.5} />
        </mesh>
      </group>

      {/* Floating 3D Label & Evacuation Status */}
      <Html position={[0, 8.4, 0]} center distanceFactor={30} zIndexRange={[100, 0]}>
        <div className="flex flex-col items-center gap-1">
          <div className="bg-slate-950 border-2 border-emerald-400 text-emerald-300 px-3 py-1 rounded-md text-xs font-mono font-black shadow-2xl flex items-center gap-2 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>VILLAGE COMM GATEWAY</span>
            <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded border border-emerald-700">
              443MHz SINK
            </span>
          </div>

          {/* Evacuation Alert Banner */}
          {evacuationState !== 'STANDBY' && (
            <div className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border shadow-lg animate-bounce ${
              evacuationState === 'EVACUATED_SAFE'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                : 'bg-red-950 text-red-200 border-red-500'
            }`}>
              {evacuationState === 'WARNING_ISSUED' && '🚨 EARLY WARNING: SIRENS ACTIVE'}
              {evacuationState === 'EVACUATING' && `⚠️ VILLAGE EVACUATING (${(evacuationProgress * 100).toFixed(0)}%)`}
              {evacuationState === 'EVACUATED_SAFE' && '✅ VILLAGE SAFELY EVACUATED TO HIGH GROUND'}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
