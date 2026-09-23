import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ScenarioType } from '../types';

interface DynamicWeather3DProps {
  scenario: ScenarioType;
  disasterPhase?: number;
}

export const DynamicWeather3D: React.FC<DynamicWeather3DProps> = ({
  scenario,
  disasterPhase = 1
}) => {
  const rainLinesRef = useRef<THREE.LineSegments>(null);
  const lightningLightRef = useRef<THREE.PointLight>(null);
  const fireEmbersRef = useRef<THREE.Points>(null);

  const isRain = scenario === 'FLOOD' || scenario === 'LANDSLIDE';
  const isFire = scenario === 'FIRE' || scenario === 'COMPLETE_DEMO';

  // 1. Torrential Mountain Rainstorm Particle Stream (1200 streaks)
  const { rainPositions, rainVelocities, rainCount } = useMemo(() => {
    const count = 1200;
    const positions = new Float32Array(count * 6); // 2 vertices per line streak
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 110;
      const y = Math.random() * 45;
      const z = (Math.random() - 0.5) * 110;
      const len = 0.9 + Math.random() * 0.7;

      const idx = i * 6;
      // Top vertex of streak
      positions[idx + 0] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      // Bottom vertex of streak (slanted slightly by wind)
      positions[idx + 3] = x - 0.15;
      positions[idx + 4] = y - len;
      positions[idx + 5] = z + 0.12;

      velocities[i] = 26.0 + Math.random() * 18.0; // Rapid downward speed
    }

    return { rainPositions: positions, rainVelocities: velocities, rainCount: count };
  }, []);

  const rainGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    return geo;
  }, [rainPositions]);

  // 2. Wildfire Wind-Blown Embers Particle Cloud
  const { emberGeo, emberCount } = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = -22 + (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = 10 + Math.random() * 20;
      positions[i * 3 + 2] = -23 + (Math.random() - 0.5) * 25;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { emberGeo: geo, emberCount: count };
  }, []);

  // Frame update for rain descent, lightning flash, and fire embers
  useFrame((state, delta) => {
    // A. Rain movement
    if (rainLinesRef.current && isRain) {
      const posAttr = rainLinesRef.current.geometry.attributes.position;
      const arr = posAttr.array as Float32Array;

      const rainIntensity = disasterPhase >= 4 ? 1.5 : disasterPhase === 3 ? 1.2 : 0.8;

      for (let i = 0; i < rainCount; i++) {
        const topYIdx = i * 6 + 1;
        const botYIdx = i * 6 + 4;
        const v = rainVelocities[i] * rainIntensity * delta;

        arr[topYIdx] -= v;
        arr[botYIdx] -= v;

        // Reset to sky once hitting mountain terrain or zero
        if (arr[botYIdx] < 0) {
          const resetY = 40 + Math.random() * 5;
          const len = 0.9 + Math.random() * 0.7;
          arr[topYIdx] = resetY;
          arr[botYIdx] = resetY - len;
        }
      }
      posAttr.needsUpdate = true;
    }

    // B. Thunderstorm Lightning Flashes in Disaster Phases 3 & 4
    if (lightningLightRef.current && isRain) {
      const t = state.clock.getElapsedTime();
      // Deterministic periodic realistic double-strike lightning flash
      const flashCycle = (t * 0.28) % 1.0;
      if (disasterPhase >= 3 && flashCycle > 0.94 && flashCycle < 0.97) {
        // High-intensity white-blue atmospheric flash
        lightningLightRef.current.intensity = Math.sin((flashCycle - 0.94) * 80) > 0.4 ? 42.0 : 0.0;
      } else {
        lightningLightRef.current.intensity = 0;
      }
    }

    // C. Fire embers wind drift
    if (fireEmbersRef.current && isFire) {
      const posAttr = fireEmbersRef.current.geometry.attributes.position;
      const arr = posAttr.array as Float32Array;
      const t = state.clock.getElapsedTime();

      for (let i = 0; i < emberCount; i++) {
        const idx = i * 3;
        // Drift downwind towards northeast
        arr[idx + 0] += delta * 3.5;
        arr[idx + 1] += Math.sin(t * 2.0 + i) * delta * 2.0;
        arr[idx + 2] += delta * 2.2;

        // Reset if drifted too far
        if (arr[idx + 0] > 15 || arr[idx + 1] > 32) {
          arr[idx + 0] = -22 + (Math.random() - 0.5) * 10;
          arr[idx + 1] = 12 + Math.random() * 5;
          arr[idx + 2] = -23 + (Math.random() - 0.5) * 10;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Heavy Mountain Rainstorm Lines */}
      {isRain && (
        <group>
          <lineSegments ref={rainLinesRef} geometry={rainGeo}>
            <lineBasicMaterial 
              color="#93c5fd" 
              transparent 
              opacity={disasterPhase >= 4 ? 0.75 : disasterPhase === 3 ? 0.55 : 0.35} 
              linewidth={1} 
              depthWrite={false}
            />
          </lineSegments>

          {/* Atmospheric Lightning Point Light */}
          <pointLight 
            ref={lightningLightRef} 
            position={[12, 45, 0]} 
            color="#e0f2fe" 
            intensity={0} 
            distance={160} 
          />
        </group>
      )}

      {/* 2. Wildfire Wind-Blown Burning Embers */}
      {isFire && (
        <points ref={fireEmbersRef} geometry={emberGeo}>
          <pointsMaterial 
            color="#f59e0b" 
            size={0.22} 
            transparent 
            opacity={0.85} 
            blending={THREE.AdditiveBlending} 
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
};
