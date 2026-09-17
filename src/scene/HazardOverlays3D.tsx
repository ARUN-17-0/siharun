import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ScenarioType } from '../types';

interface HazardOverlays3DProps {
  scenario: ScenarioType;
}

export const HazardOverlays3D: React.FC<HazardOverlays3DProps> = ({ scenario }) => {
  const fireGroupRef = useRef<THREE.Group>(null);
  const floodWaterRef = useRef<THREE.Mesh>(null);
  const smogRef = useRef<THREE.Mesh>(null);
  const debrisRef = useRef<THREE.Group>(null);

  // Generate randomized particle seeds for fire flames and smoke
  const flameParticles = useMemo(() => {
    const list: { offset: [number, number, number]; scale: number; speed: number }[] = [];
    for (let i = 0; i < 24; i++) {
      list.push({
        offset: [
          (Math.random() - 0.5) * 8.0,
          Math.random() * 2.5,
          (Math.random() - 0.5) * 8.0
        ],
        scale: 0.6 + Math.random() * 0.8,
        speed: 1.5 + Math.random() * 2.0
      });
    }
    return list;
  }, []);

  // Generate landslide debris rocks
  const debrisRocks = useMemo(() => {
    const list: { pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < 18; i++) {
      list.push({
        pos: [
          -20 + (Math.random() - 0.5) * 6.0,
          4.8 - Math.random() * 2.2,
          16 + (Math.random() - 0.5) * 6.0
        ],
        scale: [0.3 + Math.random() * 0.4, 0.2 + Math.random() * 0.3, 0.3 + Math.random() * 0.4],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
      });
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Fire flame flicker animation
    if (fireGroupRef.current && (scenario === 'FIRE' || scenario === 'COMPLETE_DEMO' || scenario === 'MASTER_HANDOVER')) {
      fireGroupRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const p = flameParticles[idx % flameParticles.length];
        mesh.position.y = p.offset[1] + Math.sin(time * p.speed + idx) * 0.6;
        mesh.scale.setScalar(p.scale * (0.8 + Math.sin(time * 4.0 + idx) * 0.25));
      });
    }

    // Flood water surge rise
    if (floodWaterRef.current && scenario === 'FLOOD') {
      const targetY = 2.4; // Elevated flood water plane
      floodWaterRef.current.position.y = THREE.MathUtils.lerp(floodWaterRef.current.position.y, targetY, delta * 0.8);
    }

    // Smog dome rotation
    if (smogRef.current && scenario === 'POLLUTION') {
      smogRef.current.rotation.y += delta * 0.05;
    }
  });

  const isFire = scenario === 'FIRE' || scenario === 'COMPLETE_DEMO' || scenario === 'MASTER_HANDOVER';
  const isFlood = scenario === 'FLOOD';
  const isLandslide = scenario === 'LANDSLIDE';
  const isPollution = scenario === 'POLLUTION';

  return (
    <group>
      {/* 1. FOREST FIRE HAZARD: Flames and rising smoke in Upper Ridge near Node 1 & 2 */}
      {isFire && (
        <group position={[-23, 7.2, -23]}>
          {/* Central Fire Danger Glow */}
          <pointLight color="#f97316" intensity={6.0} distance={22.0} />
          
          <group ref={fireGroupRef}>
            {flameParticles.map((p, idx) => (
              <mesh key={`flame-${idx}`} position={p.offset}>
                <dodecahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial 
                  color={idx % 2 === 0 ? "#ef4444" : "#f59e0b"} 
                  emissive={idx % 2 === 0 ? "#b91c1c" : "#d97706"} 
                  emissiveIntensity={2.8} 
                  roughness={0.4} 
                  transparent 
                  opacity={0.85} 
                />
              </mesh>
            ))}
          </group>

          {/* Warning Perimeter Ring on Terrain */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
            <ringGeometry args={[8.5, 9.2, 32]} />
            <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {/* 2. FLASH FLOOD HAZARD: Rising Turbid River Water */}
      {isFlood && (
        <group>
          <mesh 
            ref={floodWaterRef} 
            position={[-6, 1.2, 2]} 
            rotation={[-Math.PI / 2, 0, 0.45]}
          >
            <planeGeometry args={[22, 78]} />
            <meshStandardMaterial 
              color="#0369a1" 
              roughness={0.1} 
              metalness={0.3} 
              transparent 
              opacity={0.88} 
            />
          </mesh>

          {/* Danger zone markers at river culverts */}
          <mesh position={[-14, 2.5, -4]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.5, 4.0, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* 3. LANDSLIDE HAZARD: Slope Instability, Rockfall Debris & Slip Perimeter */}
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

          {/* Shear Tension Crack Indicator */}
          <mesh rotation={[-Math.PI / 2, 0, 0.4]} position={[0, 0.2, 0]}>
            <ringGeometry args={[6.5, 7.2, 32]} />
            <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.75} />
          </mesh>
        </group>
      )}

      {/* 4. AIR POLLUTION HAZARD: Atmospheric Particulate Inversion Smog Dome */}
      {isPollution && (
        <group position={[12, 2.0, 0]}>
          <mesh ref={smogRef}>
            <sphereGeometry args={[16, 24, 16]} />
            <meshStandardMaterial 
              color="#713f12" 
              transparent 
              opacity={0.35} 
              roughness={1.0} 
              side={THREE.DoubleSide} 
              depthWrite={false} 
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
            <ringGeometry args={[14.5, 15.5, 32]} />
            <meshBasicMaterial color="#a16207" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
};
