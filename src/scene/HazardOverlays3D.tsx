import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ScenarioType } from '../types';

interface HazardOverlays3DProps {
  scenario: ScenarioType;
  disasterPhase?: number;
}

export const HazardOverlays3D: React.FC<HazardOverlays3DProps> = ({ 
  scenario,
  disasterPhase = 1 
}) => {
  const fireGroupRef = useRef<THREE.Group>(null);
  const floodWaterRef = useRef<THREE.Mesh>(null);
  const debrisRef = useRef<THREE.Group>(null);

  // Flame particles
  const flameParticles = useMemo(() => {
    const list: { offset: [number, number, number]; scale: number; speed: number }[] = [];
    for (let i = 0; i < 28; i++) {
      list.push({
        offset: [
          (Math.random() - 0.5) * 8.0,
          Math.random() * 2.8,
          (Math.random() - 0.5) * 8.0
        ],
        scale: 0.6 + Math.random() * 0.9,
        speed: 1.5 + Math.random() * 2.0
      });
    }
    return list;
  }, []);

  // Landslide rock debris
  const debrisRocks = useMemo(() => {
    const list: { pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < 20; i++) {
      list.push({
        pos: [
          -19 + (Math.random() - 0.5) * 6.5,
          4.8 - Math.random() * 2.5,
          16 + (Math.random() - 0.5) * 6.5
        ],
        scale: [0.35 + Math.random() * 0.4, 0.25 + Math.random() * 0.3, 0.35 + Math.random() * 0.4],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
      });
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Fire animation
    if (fireGroupRef.current && (scenario === 'FIRE' || scenario === 'COMPLETE_DEMO' || scenario === 'MASTER_HANDOVER')) {
      const phaseMultiplier = disasterPhase >= 4 ? 1.0 : disasterPhase === 3 ? 0.7 : disasterPhase === 2 ? 0.45 : 0.25;
      fireGroupRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const p = flameParticles[idx % flameParticles.length];
        mesh.position.y = p.offset[1] + Math.sin(time * p.speed + idx) * 0.6;
        mesh.scale.setScalar(p.scale * phaseMultiplier * (0.8 + Math.sin(time * 4.0 + idx) * 0.25));
      });
    }

    // 2. Flood water plane: Only reaches high overflow in Phase 4 (after village evacuates!)
    if (floodWaterRef.current && scenario === 'FLOOD') {
      let targetWaterY = 0.95;
      if (disasterPhase === 1) targetWaterY = 1.35;
      else if (disasterPhase === 2) targetWaterY = 1.95;
      else if (disasterPhase === 3) targetWaterY = 2.65; // High river, evacuation in progress
      else if (disasterPhase >= 4) targetWaterY = 3.65;  // Peak overflow inundation!

      floodWaterRef.current.position.y = THREE.MathUtils.lerp(
        floodWaterRef.current.position.y,
        targetWaterY,
        delta * 0.9
      );
    }
  });

  const isFire = scenario === 'FIRE' || scenario === 'COMPLETE_DEMO' || scenario === 'MASTER_HANDOVER';
  const isFlood = scenario === 'FLOOD';
  const isLandslide = scenario === 'LANDSLIDE';

  return (
    <group>
      {/* 1. FOREST FIRE */}
      {isFire && (
        <group position={[-23, 7.2, -23]}>
          <pointLight 
            color="#f97316" 
            intensity={disasterPhase >= 4 ? 8.0 : disasterPhase === 3 ? 5.0 : 2.5} 
            distance={24.0} 
          />
          
          <group ref={fireGroupRef}>
            {flameParticles.map((p, idx) => (
              <mesh key={`flame-${idx}`} position={p.offset}>
                <dodecahedronGeometry args={[0.55, 0]} />
                <meshStandardMaterial 
                  color={idx % 2 === 0 ? "#ef4444" : "#f59e0b"} 
                  emissive={idx % 2 === 0 ? "#b91c1c" : "#d97706"} 
                  emissiveIntensity={disasterPhase >= 4 ? 3.5 : 2.2} 
                  roughness={0.4} 
                  transparent 
                  opacity={0.88} 
                />
              </mesh>
            ))}
          </group>

          {/* Warning Perimeter Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
            <ringGeometry args={[8.5, 9.2, 32]} />
            <meshBasicMaterial 
              color={disasterPhase >= 4 ? "#ef4444" : "#f59e0b"} 
              side={THREE.DoubleSide} 
              transparent 
              opacity={0.8} 
            />
          </mesh>
        </group>
      )}

      {/* 2. FLASH FLOOD */}
      {isFlood && (
        <group>
          {/* Main River Flood Surge Plane */}
          <mesh 
            ref={floodWaterRef} 
            position={[-6, 1.2, 2]} 
            rotation={[-Math.PI / 2, 0, 0.45]}
          >
            <planeGeometry args={[26, 80]} />
            <meshStandardMaterial 
              color={disasterPhase >= 4 ? "#0369a1" : "#0284c7"} 
              roughness={0.08} 
              metalness={0.4} 
              transparent 
              opacity={disasterPhase >= 4 ? 0.92 : 0.85} 
            />
          </mesh>

          {/* Catchment Basin Warning Ring */}
          <mesh position={[-14, 2.2, -4]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.2, 4.8, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* 3. LANDSLIDE */}
      {isLandslide && (
        <group position={[-19, 4.8, 16]}>
          <group ref={debrisRef}>
            {debrisRocks.map((r, idx) => (
              <mesh key={`rock-${idx}`} position={r.pos} rotation={r.rot} scale={r.scale} castShadow>
                <dodecahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial color="#78350f" roughness={0.95} />
              </mesh>
            ))}
          </group>

          <mesh rotation={[-Math.PI / 2, 0, 0.4]} position={[0, 0.2, 0]}>
            <ringGeometry args={[6.5, 7.2, 32]} />
            <meshBasicMaterial 
              color={disasterPhase >= 4 ? "#ef4444" : "#f59e0b"} 
              side={THREE.DoubleSide} 
              transparent 
              opacity={0.85} 
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
