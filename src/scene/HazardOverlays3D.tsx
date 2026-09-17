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

  // Flame particles with upward smoke plume
  const flameParticles = useMemo(() => {
    const list: { offset: [number, number, number]; scale: number; speed: number }[] = [];
    for (let i = 0; i < 36; i++) {
      list.push({
        offset: [
          (Math.random() - 0.5) * 6.5,
          Math.random() * 2.2,
          (Math.random() - 0.5) * 6.5
        ],
        scale: 0.8 + Math.random() * 0.9,
        speed: 1.8 + Math.random() * 2.5
      });
    }
    return list;
  }, []);

  // Smoke plume particles rising above the fire
  const smokeParticles = useMemo(() => {
    const list: { offset: [number, number, number]; scale: number; speed: number }[] = [];
    for (let i = 0; i < 20; i++) {
      list.push({
        offset: [
          (Math.random() - 0.5) * 5.0,
          2.5 + Math.random() * 4.5,
          (Math.random() - 0.5) * 5.0
        ],
        scale: 1.2 + Math.random() * 1.5,
        speed: 0.8 + Math.random() * 1.2
      });
    }
    return list;
  }, []);

  // Landslide rock boulders tumbling down the mountain slope near Node 1
  const debrisRocks = useMemo(() => {
    const list: { offset: [number, number, number]; scale: [number, number, number]; rot: [number, number, number]; rollSpeed: number }[] = [];
    for (let i = 0; i < 28; i++) {
      list.push({
        offset: [
          (Math.random() - 0.5) * 7.0,
          0.4 + Math.random() * 1.5,
          (Math.random() - 0.5) * 7.0
        ],
        scale: [0.6 + Math.random() * 0.7, 0.45 + Math.random() * 0.5, 0.6 + Math.random() * 0.7],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        rollSpeed: 1.5 + Math.random() * 2.0
      });
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Fire animation on mountain ridge
    if (fireGroupRef.current && (scenario === 'FIRE' || scenario === 'COMPLETE_DEMO' || scenario === 'MASTER_HANDOVER')) {
      const phaseMultiplier = disasterPhase >= 4 ? 1.4 : disasterPhase === 3 ? 1.0 : disasterPhase === 2 ? 0.7 : 0.4;
      fireGroupRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const p = flameParticles[idx % flameParticles.length];
        mesh.position.y = p.offset[1] + Math.sin(time * p.speed + idx) * 0.8;
        mesh.scale.setScalar(p.scale * phaseMultiplier * (0.85 + Math.sin(time * 5.0 + idx) * 0.25));
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

    // 3. Landslide tumbling boulders animation near Node 1
    if (debrisRef.current && scenario === 'LANDSLIDE') {
      const phaseMultiplier = disasterPhase >= 4 ? 1.5 : disasterPhase === 3 ? 1.1 : disasterPhase === 2 ? 0.7 : 0.35;
      debrisRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const rock = debrisRocks[idx % debrisRocks.length];
        mesh.rotation.x += delta * rock.rollSpeed * phaseMultiplier;
        mesh.rotation.z += delta * (rock.rollSpeed * 0.7) * phaseMultiplier;
        mesh.position.y = rock.offset[1] + Math.sin(time * 2.5 + idx) * 0.3 * phaseMultiplier;
      });
    }
  });

  const isFire = scenario === 'FIRE' || scenario === 'COMPLETE_DEMO' || scenario === 'MASTER_HANDOVER';
  const isFlood = scenario === 'FLOOD';
  const isLandslide = scenario === 'LANDSLIDE';

  return (
    <group>
      {/* 1. FOREST FIRE (Positioned on Mountain Ridge Surface at Y=11.8 near Node 1 & Node 2) */}
      {isFire && (
        <group position={[-22, 11.8, -23]}>
          <pointLight 
            color="#f97316" 
            intensity={disasterPhase >= 4 ? 14.0 : disasterPhase === 3 ? 9.0 : 4.5} 
            distance={32.0} 
          />
          
          {/* Flame Billows */}
          <group ref={fireGroupRef}>
            {flameParticles.map((p, idx) => (
              <mesh key={`flame-${idx}`} position={p.offset}>
                <dodecahedronGeometry args={[0.75, 0]} />
                <meshStandardMaterial 
                  color={idx % 3 === 0 ? "#ef4444" : idx % 3 === 1 ? "#f59e0b" : "#ea580c"} 
                  emissive={idx % 3 === 0 ? "#b91c1c" : idx % 3 === 1 ? "#d97706" : "#c2410c"} 
                  emissiveIntensity={disasterPhase >= 4 ? 4.2 : 2.8} 
                  roughness={0.3} 
                  transparent 
                  opacity={0.9} 
                />
              </mesh>
            ))}
          </group>

          {/* Billowing Smoke Column */}
          <group>
            {smokeParticles.map((s, idx) => (
              <mesh key={`smoke-${idx}`} position={s.offset}>
                <sphereGeometry args={[s.scale, 8, 8]} />
                <meshStandardMaterial 
                  color="#262626" 
                  roughness={0.95} 
                  transparent 
                  opacity={disasterPhase >= 3 ? 0.65 : 0.35} 
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>

          {/* Ground Ash Burn Decal */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <circleGeometry args={[6.5, 32]} />
            <meshStandardMaterial color="#171717" roughness={0.95} transparent opacity={0.8} />
          </mesh>

          {/* Warning Perimeter Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
            <ringGeometry args={[8.5, 9.2, 32]} />
            <meshBasicMaterial 
              color={disasterPhase >= 4 ? "#ef4444" : "#f59e0b"} 
              side={THREE.DoubleSide} 
              transparent 
              opacity={0.85} 
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

      {/* 3. LANDSLIDE (Positioned on Mountain Slope Surface at Y=11.8 right next to Node 1) */}
      {isLandslide && (
        <group position={[-24, 11.8, -20]}>
          <pointLight 
            color="#d97706" 
            intensity={disasterPhase >= 4 ? 7.0 : 3.5} 
            distance={20.0} 
          />

          {/* Tumbling Jagged Rockfall Boulders */}
          <group ref={debrisRef}>
            {debrisRocks.map((r, idx) => (
              <mesh key={`rock-${idx}`} position={r.offset} rotation={r.rot} scale={r.scale} castShadow>
                <dodecahedronGeometry args={[0.85, 0]} />
                <meshStandardMaterial 
                  color={idx % 2 === 0 ? "#573010" : "#3d220a"} 
                  roughness={0.95} 
                />
              </mesh>
            ))}
          </group>

          {/* Mud & Shear Ground Scar */}
          <mesh rotation={[-Math.PI / 2, 0, 0.35]} position={[0, 0.08, 0]}>
            <circleGeometry args={[5.5, 32]} />
            <meshStandardMaterial color="#45260f" roughness={0.95} transparent opacity={0.85} />
          </mesh>

          {/* Warning Perimeter Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[0, 0.15, 0]}>
            <ringGeometry args={[6.8, 7.5, 32]} />
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
