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
      {/* Base Concrete Foundation */}
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.2, 0.5, 3.2]} />
        <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Communications Shelter */}
      <mesh position={[-0.8, 1.15, -0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.3, 1.4]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Steel Communications Tower */}
      <group position={[0.7, 0.5, 0.7]}>
        <mesh position={[0, 3.2, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.65, 6.4, 4]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} wireframe />
        </mesh>

        <mesh position={[0, 3.6, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 7.2, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>

        {/* Satellite Dish */}
        <group ref={dishRef} position={[0, 5.2, 0.2]}>
          <mesh rotation={[0.4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.9, 0.08, 0.25, 16, 1, true]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.4} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.1, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
        </group>

        {/* Antenna Mast & Siren Strobe */}
        <group position={[0, 6.8, 0]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.6} />
          </mesh>

          {/* Regular Obstruction Light */}
          <mesh ref={beaconRef} position={[0, 1.85, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial 
              color={online ? "#10b981" : "#ef4444"} 
              emissive={online ? "#10b981" : "#ef4444"} 
              emissiveIntensity={online ? 3.0 : 0.5} 
            />
          </mesh>

          {/* Emergency Siren Strobe Light (Flashes when disaster detected) */}
          <pointLight 
            ref={sirenLightRef} 
            position={[0, 2.2, 0]} 
            color="#ef4444" 
            intensity={0} 
            distance={45} 
          />
        </group>
      </group>

      {/* Visual Village Evacuation Transport (Appears and drives to safety) */}
      <group ref={evacConvoyRef} visible={false}>
        {/* Evacuation Bus / Transport */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.8, 0.8, 0.9]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Flashing Amber Hazard Light on transport */}
        <mesh position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={3.0} />
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
