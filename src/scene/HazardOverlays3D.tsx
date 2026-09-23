import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ScenarioType } from '../types';
import { getTerrainHeight } from '../nodes/NodePhysics';

interface HazardOverlays3DProps {
  scenario: ScenarioType;
  disasterPhase?: number;
}

export const HazardOverlays3D: React.FC<HazardOverlays3DProps> = ({ 
  scenario,
  disasterPhase = 1 
}) => {
  const fireGroupRef = useRef<THREE.Group>(null);
  const smokeGroupRef = useRef<THREE.Group>(null);
  const embersGroupRef = useRef<THREE.Group>(null);
  const floodWaterRef = useRef<THREE.Mesh>(null);
  const debrisRef = useRef<THREE.Group>(null);
  const dustGroupRef = useRef<THREE.Group>(null);
  const driftwoodRef = useRef<THREE.Group>(null);

  // Dynamic exact terrain surface positions
  const fireY = useMemo(() => getTerrainHeight(-22, -23), []);
  const landslideY = useMemo(() => getTerrainHeight(-24, -20), []);

  // Multi-tier flame tongues (inner hot core and outer flame billows)
  const flameParticles = useMemo(() => {
    const list: { offset: [number, number, number]; scale: number; speed: number; rot: number }[] = [];
    for (let i = 0; i < 40; i++) {
      list.push({
        offset: [
          (Math.random() - 0.5) * 6.8,
          Math.random() * 1.8,
          (Math.random() - 0.5) * 6.8
        ],
        scale: 0.7 + Math.random() * 0.9,
        speed: 2.2 + Math.random() * 2.8,
        rot: Math.random() * Math.PI * 2
      });
    }
    return list;
  }, []);

  // Rising convective smoke plume
  const smokeParticles = useMemo(() => {
    const list: { baseOffset: [number, number, number]; scale: number; speed: number }[] = [];
    for (let i = 0; i < 24; i++) {
      list.push({
        baseOffset: [
          (Math.random() - 0.5) * 4.5,
          2.0 + Math.random() * 7.5,
          (Math.random() - 0.5) * 4.5
        ],
        scale: 1.2 + Math.random() * 2.0,
        speed: 0.7 + Math.random() * 1.2
      });
    }
    return list;
  }, []);

  // Floating spark embers dancing upwards
  const sparkEmbers = useMemo(() => {
    const list: { offset: [number, number, number]; speed: number }[] = [];
    for (let i = 0; i < 30; i++) {
      list.push({
        offset: [
          (Math.random() - 0.5) * 7.5,
          1.0 + Math.random() * 6.0,
          (Math.random() - 0.5) * 7.5
        ],
        speed: 2.5 + Math.random() * 3.0
      });
    }
    return list;
  }, []);

  // Landslide rockfall boulders tumbling down the slope
  const debrisRocks = useMemo(() => {
    const list: { 
      offset: [number, number, number]; 
      scale: [number, number, number]; 
      rot: [number, number, number]; 
      rollSpeed: number;
      color: string;
    }[] = [];
    for (let i = 0; i < 32; i++) {
      const isBig = i % 5 === 0;
      const s = isBig ? 1.4 + Math.random() * 0.8 : 0.45 + Math.random() * 0.6;
      list.push({
        offset: [
          (Math.random() - 0.5) * 7.5,
          0.3 + Math.random() * 1.8,
          (Math.random() - 0.5) * 7.5
        ],
        scale: [s, s * (0.7 + Math.random() * 0.5), s],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        rollSpeed: 1.8 + Math.random() * 2.5,
        color: i % 3 === 0 ? '#452b1b' : i % 3 === 1 ? '#332215' : '#573d2a'
      });
    }
    return list;
  }, []);

  // Billowing landslide dust cloud
  const dustParticles = useMemo(() => {
    const list: { offset: [number, number, number]; scale: number; speed: number }[] = [];
    for (let i = 0; i < 18; i++) {
      list.push({
        offset: [
          (Math.random() - 0.5) * 6.5,
          0.8 + Math.random() * 3.5,
          (Math.random() - 0.5) * 6.5
        ],
        scale: 1.1 + Math.random() * 1.8,
        speed: 0.9 + Math.random() * 1.4
      });
    }
    return list;
  }, []);

  // Driftwood logs bobbing in the flood
  const driftwoodLogs = useMemo(() => {
    const list: { offset: [number, number, number]; rotY: number; len: number }[] = [];
    for (let i = 0; i < 8; i++) {
      list.push({
        offset: [-9 + (Math.random() - 0.5) * 6, 0, -20 + i * 6 + (Math.random() - 0.5) * 3],
        rotY: Math.random() * Math.PI,
        len: 1.6 + Math.random() * 1.8
      });
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Fire animations on mountain ridge
    if (fireGroupRef.current && (scenario === 'FIRE' || scenario === 'COMPLETE_DEMO' || scenario === 'MASTER_HANDOVER')) {
      const phaseMultiplier = disasterPhase >= 4 ? 1.4 : disasterPhase === 3 ? 1.0 : disasterPhase === 2 ? 0.7 : 0.4;
      
      // Flickering flame tongues
      fireGroupRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const p = flameParticles[idx % flameParticles.length];
        mesh.position.y = p.offset[1] + Math.sin(time * p.speed + idx) * 0.85;
        mesh.rotation.y = p.rot + time * 1.2;
        mesh.scale.setScalar(p.scale * phaseMultiplier * (0.85 + Math.sin(time * 6.0 + idx) * 0.25));
      });

      // Billowing smoke plume rising
      if (smokeGroupRef.current) {
        smokeGroupRef.current.children.forEach((child, idx) => {
          const mesh = child as THREE.Mesh;
          const s = smokeParticles[idx % smokeParticles.length];
          mesh.position.y = s.baseOffset[1] + ((time * s.speed + idx * 0.8) % 9.0);
          mesh.position.x = s.baseOffset[0] + Math.sin(time * 0.6 + idx) * 0.9;
          const lifeProgress = (mesh.position.y - 2.0) / 9.0;
          mesh.scale.setScalar(s.scale * (1.0 + lifeProgress * 1.5) * phaseMultiplier);
        });
      }

      // Incandescent floating sparks
      if (embersGroupRef.current) {
        embersGroupRef.current.children.forEach((child, idx) => {
          const mesh = child as THREE.Mesh;
          const e = sparkEmbers[idx % sparkEmbers.length];
          mesh.position.y = 0.5 + ((time * e.speed + idx * 0.7) % 7.5);
          mesh.position.x = e.offset[0] + Math.sin(time * 2.0 + idx) * 0.6;
          mesh.position.z = e.offset[2] + Math.cos(time * 2.0 + idx) * 0.6;
        });
      }
    }

    // 2. Flood water plane: Only reaches high inundation in Phase 4 (after village evacuates!)
    if (floodWaterRef.current && scenario === 'FLOOD') {
      let targetWaterY = 0.95;
      if (disasterPhase === 1) targetWaterY = 1.35;
      else if (disasterPhase === 2) targetWaterY = 1.95;
      else if (disasterPhase === 3) targetWaterY = 2.65; // High river, evacuation in progress
      else if (disasterPhase >= 4) targetWaterY = 3.65;  // Peak overflow inundation!

      floodWaterRef.current.position.y = THREE.MathUtils.lerp(
        floodWaterRef.current.position.y,
        targetWaterY,
        delta * 0.95
      );
    }

    // Bobbing driftwood in flood
    if (driftwoodRef.current && scenario === 'FLOOD') {
      driftwoodRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const currentWaterY = floodWaterRef.current ? floodWaterRef.current.position.y : 1.2;
        mesh.position.y = currentWaterY - 0.05 + Math.sin(time * 2.0 + idx) * 0.08;
        mesh.rotation.z = Math.sin(time * 1.5 + idx) * 0.12;
      });
    }

    // 3. Landslide tumbling boulders & dust cloud animation near Node 1
    if (debrisRef.current && scenario === 'LANDSLIDE') {
      const phaseMultiplier = disasterPhase >= 4 ? 1.5 : disasterPhase === 3 ? 1.1 : disasterPhase === 2 ? 0.7 : 0.35;
      
      // Tumbling jagged boulders
      debrisRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const rock = debrisRocks[idx % debrisRocks.length];
        mesh.rotation.x += delta * rock.rollSpeed * phaseMultiplier;
        mesh.rotation.z += delta * (rock.rollSpeed * 0.75) * phaseMultiplier;
        mesh.position.y = rock.offset[1] + Math.sin(time * 3.0 + idx) * 0.35 * phaseMultiplier;
      });

      // Billowing dust cloud
      if (dustGroupRef.current) {
        dustGroupRef.current.children.forEach((child, idx) => {
          const mesh = child as THREE.Mesh;
          const d = dustParticles[idx % dustParticles.length];
          mesh.position.y = d.offset[1] + ((time * d.speed + idx * 0.5) % 4.5);
          mesh.scale.setScalar(d.scale * phaseMultiplier * (1.0 + Math.sin(time * 2.0 + idx) * 0.3));
        });
      }
    }
  });

  const isFire = scenario === 'FIRE' || scenario === 'COMPLETE_DEMO' || scenario === 'MASTER_HANDOVER';
  const isFlood = scenario === 'FLOOD';
  const isLandslide = scenario === 'LANDSLIDE';

  return (
    <group>
      {/* 1. FOREST FIRE (Positioned on Mountain Ridge Surface directly at fireY near Node 1 & Node 2) */}
      {isFire && (
        <group position={[-22, fireY + 0.1, -23]}>
          {/* Dynamic Fire Radiance Light */}
          <pointLight 
            color="#f97316" 
            intensity={disasterPhase >= 4 ? 16.0 : disasterPhase === 3 ? 10.0 : 5.0} 
            distance={36.0} 
            castShadow
          />
          
          {/* Core & Billowing Flame Tongues */}
          <group ref={fireGroupRef}>
            {flameParticles.map((p, idx) => (
              <mesh key={`flame-${idx}`} position={p.offset}>
                <coneGeometry args={[0.55, 1.6, 6]} />
                <meshStandardMaterial 
                  color={idx % 4 === 0 ? "#fef08a" : idx % 4 === 1 ? "#f59e0b" : idx % 4 === 2 ? "#ea580c" : "#dc2626"} 
                  emissive={idx % 4 === 0 ? "#facc15" : idx % 4 === 1 ? "#d97706" : "#b91c1c"} 
                  emissiveIntensity={disasterPhase >= 4 ? 4.5 : 3.0} 
                  roughness={0.25} 
                  transparent 
                  opacity={0.92} 
                />
              </mesh>
            ))}
          </group>

          {/* Incandescent Floating Sparks / Embers */}
          <group ref={embersGroupRef}>
            {sparkEmbers.map((e, idx) => (
              <mesh key={`ember-${idx}`} position={e.offset}>
                <sphereGeometry args={[0.06, 6, 6]} />
                <meshBasicMaterial color="#fef08a" />
              </mesh>
            ))}
          </group>

          {/* Convective Dark Smoke Plume */}
          <group ref={smokeGroupRef}>
            {smokeParticles.map((s, idx) => (
              <mesh key={`smoke-${idx}`} position={s.baseOffset}>
                <sphereGeometry args={[s.scale, 8, 8]} />
                <meshStandardMaterial 
                  color="#1e293b" 
                  roughness={0.95} 
                  transparent 
                  opacity={disasterPhase >= 3 ? 0.7 : 0.38} 
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>

          {/* Charred Ground Ash Burn Scar */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <circleGeometry args={[7.2, 32]} />
            <meshStandardMaterial color="#111827" roughness={0.96} transparent opacity={0.85} />
          </mesh>

          {/* Warning Perimeter Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
            <ringGeometry args={[8.6, 9.4, 32]} />
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
            rotation={[-Math.PI / 2, 0, 0.42]}
          >
            <planeGeometry args={[28, 88]} />
            <meshStandardMaterial 
              color={disasterPhase >= 4 ? "#0369a1" : "#0284c7"} 
              roughness={0.06} 
              metalness={0.45} 
              transparent 
              opacity={disasterPhase >= 4 ? 0.92 : 0.85} 
            />
          </mesh>

          {/* Floating Driftwood Logs Bobbing on River Surface */}
          <group ref={driftwoodRef}>
            {driftwoodLogs.map((log, idx) => (
              <mesh 
                key={`driftwood-${idx}`} 
                position={log.offset} 
                rotation={[0, log.rotY, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.11, 0.14, log.len, 7]} />
                <meshStandardMaterial color="#3e2714" roughness={0.92} />
              </mesh>
            ))}
          </group>

          {/* Catchment Basin Warning Ring */}
          <mesh position={[-14, 2.2, -4]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.2, 4.8, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* 3. LANDSLIDE (Positioned on Mountain Slope directly at landslideY right next to Node 1) */}
      {isLandslide && (
        <group position={[-24, landslideY + 0.1, -20]}>
          <pointLight 
            color="#d97706" 
            intensity={disasterPhase >= 4 ? 8.5 : 4.0} 
            distance={24.0} 
          />

          {/* Tumbling Jagged Rockfall Boulders */}
          <group ref={debrisRef}>
            {debrisRocks.map((r, idx) => (
              <mesh key={`rock-${idx}`} position={r.offset} rotation={r.rot} scale={r.scale} castShadow>
                <dodecahedronGeometry args={[0.85, 0]} />
                <meshStandardMaterial 
                  color={r.color} 
                  roughness={0.94} 
                  flatShading
                />
              </mesh>
            ))}
          </group>

          {/* Snapped Fallen Pine Trunks caught in slide */}
          {[-1.5, 0.8, 2.2].map((xOff, idx) => (
            <mesh 
              key={`fallen-trunk-${idx}`} 
              position={[xOff, 0.25, idx * 1.5 - 1.2]} 
              rotation={[0.3, idx * 0.8, 1.4]}
              castShadow
            >
              <cylinderGeometry args={[0.16, 0.22, 3.2, 7]} />
              <meshStandardMaterial color="#2d1a0c" roughness={0.95} />
            </mesh>
          ))}

          {/* Billowing Dust/Debris Cloud */}
          <group ref={dustGroupRef}>
            {dustParticles.map((d, idx) => (
              <mesh key={`dust-${idx}`} position={d.offset}>
                <sphereGeometry args={[d.scale, 8, 8]} />
                <meshStandardMaterial 
                  color="#634832" 
                  roughness={0.98} 
                  transparent 
                  opacity={disasterPhase >= 3 ? 0.6 : 0.35} 
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>

          {/* Exposed Mud & Raw Earth Scarp Slipway */}
          <mesh rotation={[-Math.PI / 2, 0, 0.32]} position={[0, 0.06, 0]} scale={[1.2, 0.72, 1]}>
            <circleGeometry args={[5.2, 32]} />
            <meshStandardMaterial color="#3b210f" roughness={0.96} transparent opacity={0.9} />
          </mesh>

          {/* Warning Perimeter Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[0, 0.14, 0]}>
            <ringGeometry args={[7.2, 7.9, 32]} />
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
