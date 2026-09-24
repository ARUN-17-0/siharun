import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight, getRiverCenter } from '../nodes/NodePhysics';

// Realistic Procedural Himalayan Pine / Fir Conifer Tree
interface ConiferTreeProps {
  position: [number, number, number];
  scale?: number;
  species?: 'PINE' | 'FIR' | 'BIRCH';
}

const ConiferTree: React.FC<ConiferTreeProps> = ({ position, scale = 1, species = 'PINE' }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk with Bark Depth */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[species === 'BIRCH' ? 0.12 : 0.18, 0.28, 1.8, 8]} />
        <meshStandardMaterial 
          color={species === 'BIRCH' ? '#e2e8f0' : '#332014'} 
          roughness={0.94} 
          metalness={0.05} 
        />
      </mesh>

      {/* Foliage Canopy */}
      {species === 'BIRCH' ? (
        // Deciduous Birch foliage (organic leafy masses)
        <group position={[0, 1.8, 0]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <sphereGeometry args={[0.9, 6, 6]} />
            <meshStandardMaterial color="#4d7c0f" roughness={0.82} />
          </mesh>
          <mesh position={[0.3, 0.8, 0.2]}>
            <sphereGeometry args={[0.65, 5, 5]} />
            <meshStandardMaterial color="#65a30d" roughness={0.8} />
          </mesh>
        </group>
      ) : (
        // Conifer Pine / Alpine Fir (3-tier realistic needle foliage)
        <group position={[0, 1.3, 0]}>
          {/* Tier 1 (Lowest broad tier - casts primary ground shadow) */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <coneGeometry args={[1.5, 1.4, 7]} />
            <meshStandardMaterial color="#142c16" roughness={0.85} />
          </mesh>
          {/* Tier 2 (Mid tier) */}
          <mesh position={[0, 1.25, 0]} rotation={[0, 0.5, 0]}>
            <coneGeometry args={[1.15, 1.3, 7]} />
            <meshStandardMaterial color="#1c3b1e" roughness={0.85} />
          </mesh>
          {/* Tier 3 (Top spire) */}
          <mesh position={[0, 2.1, 0]} rotation={[0, 1.0, 0]}>
            <coneGeometry args={[0.68, 1.15, 6]} />
            <meshStandardMaterial color="#2d5e32" roughness={0.85} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// Realistic Himalayan Mountain House
interface MountainHouseProps {
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}

const MountainHouse: React.FC<MountainHouseProps> = ({ position, rotationY = 0, scale = 1 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* 1. Stone Masonry Basement / Foundation */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.8, 2.6]} />
        <meshStandardMaterial color="#64748b" roughness={0.95} metalness={0.1} />
      </mesh>

      {/* 2. Weathered Timber Upper Floor */}
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 1.1, 2.4]} />
        <meshStandardMaterial color="#573e27" roughness={0.9} />
      </mesh>

      {/* 3. Pitched Slate / Tin Roof */}
      <group position={[0, 2.1, 0]}>
        {/* Main Gabled Roof Ridge */}
        <mesh rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[2.5, 1.2, 4]} />
          <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.25} />
        </mesh>
        {/* Overhanging Eaves Trim */}
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[3.6, 0.08, 3.0]} />
          <meshStandardMaterial color="#2d1f14" roughness={0.9} />
        </mesh>
      </group>

      {/* 4. Stone Chimney */}
      <mesh position={[0.9, 2.3, 0.4]} castShadow>
        <boxGeometry args={[0.35, 1.2, 0.35]} />
        <meshStandardMaterial color="#475569" roughness={0.95} />
      </mesh>

      {/* 5. Wooden Porch & Door */}
      <mesh position={[0, 0.4, 1.35]} castShadow>
        <boxGeometry args={[1.2, 0.15, 0.6]} />
        <meshStandardMaterial color="#422e1b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.05, 1.21]}>
        <planeGeometry args={[0.65, 1.2]} />
        <meshStandardMaterial color="#261a10" roughness={0.8} />
      </mesh>

      {/* 6. Multi-pane Windows with Warm Interior Light */}
      <mesh position={[0.9, 1.4, 1.21]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={0.65} roughness={0.2} />
      </mesh>
      <mesh position={[-0.9, 1.4, 1.21]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={0.65} roughness={0.2} />
      </mesh>

      {/* 7. Woodpile by the side */}
      <mesh position={[1.7, 0.45, 0]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.6, 0.7, 1.2]} />
        <meshStandardMaterial color="#713f12" roughness={0.95} />
      </mesh>
    </group>
  );
};

// Realistic Natural Mossy Boulder
interface BoulderProps {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

const Boulder: React.FC<BoulderProps> = ({ position, scale, rotation }) => {
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
      <dodecahedronGeometry args={[1.0, 1]} />
      <meshStandardMaterial color="#475569" roughness={0.92} metalness={0.05} />
    </mesh>
  );
};

// Realistic Timber Truss Road Bridge across the river
interface BridgeProps {
  position: [number, number, number];
  rotationY: number;
}

const RiverBridge: React.FC<BridgeProps> = ({ position, rotationY }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Stone Abutments on both banks */}
      <mesh position={[-5.5, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.4, 3.6]} />
        <meshStandardMaterial color="#475569" roughness={0.95} />
      </mesh>
      <mesh position={[5.5, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.4, 3.6]} />
        <meshStandardMaterial color="#475569" roughness={0.95} />
      </mesh>

      {/* Center Stone Pier in Riverbed */}
      <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.9, 2.2, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.95} />
      </mesh>

      {/* Heavy Timber Deck */}
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[12.5, 0.25, 3.2]} />
        <meshStandardMaterial color="#452b17" roughness={0.9} />
      </mesh>

      {/* Wooden Handrails & Cross-trusses */}
      <group position={[0, 1.6, 1.45]}>
        <mesh castShadow>
          <boxGeometry args={[12.5, 0.08, 0.1]} />
          <meshStandardMaterial color="#2e1d0f" roughness={0.9} />
        </mesh>
        {/* Railing posts */}
        {[-5, -2.5, 0, 2.5, 5].map((xOffset, i) => (
          <mesh key={`post-f-${i}`} position={[xOffset, -0.22, 0]} castShadow>
            <boxGeometry args={[0.1, 0.55, 0.1]} />
            <meshStandardMaterial color="#2e1d0f" roughness={0.9} />
          </mesh>
        ))}
      </group>
      <group position={[0, 1.6, -1.45]}>
        <mesh castShadow>
          <boxGeometry args={[12.5, 0.08, 0.1]} />
          <meshStandardMaterial color="#2e1d0f" roughness={0.9} />
        </mesh>
        {[-5, -2.5, 0, 2.5, 5].map((xOffset, i) => (
          <mesh key={`post-b-${i}`} position={[xOffset, -0.22, 0]} castShadow>
            <boxGeometry args={[0.1, 0.55, 0.1]} />
            <meshStandardMaterial color="#2e1d0f" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export const ProceduralTerrain: React.FC = () => {
  const waterRef = useRef<THREE.Mesh>(null);

  // Generate High-Resolution Satellite Orthophoto & Topographic Contours Texture
  const { satelliteTexture, bumpTexture } = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 1. Base dark alpine earth
    ctx.fillStyle = '#1e331f';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    // Sample terrain heights & river positions to color the satellite orthophoto
    for (let py = 0; py < size; py += 2) {
      const v = py / size;
      const worldZ = (v - 0.5) * 105;

      for (let px = 0; px < size; px += 2) {
        const u = px / size;
        const worldX = (u - 0.5) * 105;

        const h = getTerrainHeight(worldX, worldZ);
        const riverX = getRiverCenter(worldZ);
        const distRiver = Math.abs(worldX - riverX);

        // Natural color palette
        let r = 42, g = 74, b = 34; // Evergreen alpine meadow

        if (h > 15.0) {
          // Alpine mountain peak (Slate granite & frost)
          const f = Math.min(1, (h - 15.0) / 7.0);
          r = Math.floor(135 + f * 50);
          g = Math.floor(142 + f * 45);
          b = Math.floor(155 + f * 45);
        } else if (h > 8.0 && worldX < -8) {
          // Steep cliff rock strata
          r = 88; g = 92; b = 96;
        } else if (distRiver < 5.0) {
          // River gravel & sand
          r = 115; g = 106; b = 86;
        } else if (worldX > 10 && worldZ > -6 && worldZ < 26) {
          // Village agricultural terraces & pastures
          r = 75; g = 115; b = 48;
        }

        // Topographic contour line overlay (drawn every 4.0 meters of elevation)
        const contour = Math.abs((h % 4.0) - 2.0);
        if (contour < 0.24) {
          const isIndex = Math.abs((h % 8.0) - 4.0) < 0.28;
          const alpha = isIndex ? 0.38 : 0.20;
          r = Math.floor(r * (1 - alpha) + 230 * alpha);
          g = Math.floor(g * (1 - alpha) + 242 * alpha);
          b = Math.floor(b * (1 - alpha) + 255 * alpha);
        }

        // High-frequency surface grain noise
        const grain = ((px * 17 + py * 31) % 19) - 9;
        r = Math.max(0, Math.min(255, r + grain));
        g = Math.max(0, Math.min(255, g + grain));
        b = Math.max(0, Math.min(255, b + grain));

        // 2x2 block fill
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const idx = ((py + dy) * size + (px + dx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Mountain dirt trails & roads
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#634c35'; // Village access road
    ctx.beginPath();
    ctx.moveTo(size * 0.46, size * 0.52);
    ctx.quadraticCurveTo(size * 0.64, size * 0.55, size * 0.82, size * 0.62);
    ctx.stroke();

    // GIS spatial grid ticks
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    for (let g = 128; g < size; g += 128) {
      ctx.beginPath();
      ctx.moveTo(g, 0); ctx.lineTo(g, size);
      ctx.moveTo(0, g); ctx.lineTo(size, g);
      ctx.stroke();
    }

    const satTex = new THREE.CanvasTexture(canvas);
    satTex.wrapS = THREE.ClampToEdgeWrapping;
    satTex.wrapT = THREE.ClampToEdgeWrapping;

    // Companion surface bump relief texture
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    const bData = bCtx.createImageData(256, 256);
    for (let i = 0; i < bData.data.length; i += 4) {
      const n = Math.floor(Math.random() * 80 + 90);
      bData.data[i] = n;
      bData.data[i + 1] = n;
      bData.data[i + 2] = n;
      bData.data[i + 3] = 255;
    }
    bCtx.putImageData(bData, 0, 0);
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(12, 12);

    return { satelliteTexture: satTex, bumpTexture: bumpTex };
  }, []);

  // 1. High-Resolution Multi-Tone Fractal Mountain Mesh
  const terrainGeo = useMemo(() => {
    // 100x100 resolution for smooth organic curvature and jagged ridge crests
    const geo = new THREE.PlaneGeometry(105, 105, 110, 110);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const count = pos.count;

    // First pass: Calculate all elevations
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);
    }

    geo.computeVertexNormals();
    const normals = geo.attributes.normal;
    const colors = new Float32Array(count * 3);

    // Second pass: Physical geology-based PBR vertex coloring
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const normalY = normals.getY(i); // 1.0 = flat, <0.75 = steep cliff!
      const riverCenter = getRiverCenter(z);
      const distToRiver = Math.abs(x - riverCenter);

      let r = 0.22, g = 0.38, b = 0.18; // Default lush alpine grass

      if (normalY < 0.72 && y > 3.0) {
        // Steep Rock Cliff / Mountain Strata
        const band = Math.sin(y * 1.5) * 0.08;
        r = 0.34 + band;
        g = 0.36 + band;
        b = 0.38 + band;
      } else if (y > 15.0) {
        // High Alpine Ridge Peak with Frost / Scree
        r = 0.55;
        g = 0.58;
        b = 0.62;
      } else if (distToRiver < 5.0) {
        // Riverbed Gravel & Sand Shoreline
        const wetness = Math.max(0, 1 - distToRiver / 4.5);
        r = 0.40 - wetness * 0.15;
        g = 0.37 - wetness * 0.14;
        b = 0.28 - wetness * 0.10;
      } else if (x < 0 && y > 2.5) {
        // Dense Conifer Forest Floor (Dark humus, needle litter, damp moss)
        r = 0.13;
        g = 0.26;
        b = 0.12;
      } else if (x > 8 && z > -8 && z < 28) {
        // Village Farmland & Pasture Meadow
        r = 0.30;
        g = 0.48;
        b = 0.22;
      } else {
        // Open Hillside Meadow
        r = 0.24;
        g = 0.40;
        b = 0.18;
      }

      colors[i * 3 + 0] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // 2. Continuous Curving River Mesh Geometry
  const riverGeo = useMemo(() => {
    // Generate curved ribbon following getRiverCenter(z)
    const segments = 60;
    const geo = new THREE.PlaneGeometry(11, 95, 12, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const riverCenterX = getRiverCenter(z);
      // Offset lateral X relative to curving river path
      const currentX = pos.getX(i);
      pos.setX(i, riverCenterX + currentX);
      // River water surface elevation sits slightly above riverbed
      pos.setY(i, 0.95);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 3. Procedural Trees across the mountain and forest zones
  const trees = useMemo(() => {
    const list: { pos: [number, number, number]; scale: number; species: 'PINE' | 'FIR' | 'BIRCH' }[] = [];
    const seed = 1337;

    for (let i = 0; i < 90; i++) {
      const x = -44 + ((i * 19 + seed) % 65);
      const z = -44 + ((i * 29 + seed) % 85);
      const riverCenter = getRiverCenter(z);
      const distToRiver = Math.abs(x - riverCenter);

      // Avoid placing trees inside river channel or village cluster
      if (distToRiver > 6.0 && !(x > 14 && z > 0 && z < 26)) {
        const y = getTerrainHeight(x, z);
        if (y > 1.2 && y < 18.0) {
          const species: 'PINE' | 'FIR' | 'BIRCH' = 
            distToRiver < 10.0 ? 'BIRCH' : (i % 3 === 0 ? 'FIR' : 'PINE');
          list.push({
            pos: [x, y, z],
            scale: 0.85 + ((i % 7) * 0.11),
            species
          });
        }
      }
    }
    return list;
  }, []);

  // 4. Natural Mossy Boulders scattered along slopes and riverbanks
  const boulders = useMemo(() => {
    const list: { pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < 30; i++) {
      const x = -30 + ((i * 23) % 55);
      const z = -35 + ((i * 17) % 70);
      const y = getTerrainHeight(x, z);
      if (y > 0.8) {
        list.push({
          pos: [x, y + 0.3, z],
          scale: [0.7 + (i % 4) * 0.3, 0.5 + (i % 3) * 0.25, 0.7 + (i % 5) * 0.25],
          rot: [(i * 0.7) % Math.PI, (i * 1.3) % Math.PI, (i * 0.5) % Math.PI]
        });
      }
    }
    return list;
  }, []);

  // 5. Authentic Himalayan Mountain Village Houses
  const villageHouses: { pos: [number, number, number]; rot: number; scale: number }[] = useMemo(() => [
    { pos: [20, getTerrainHeight(20, 10), 10], rot: 0.25, scale: 1.1 },
    { pos: [25, getTerrainHeight(25, 7), 7], rot: -0.35, scale: 1.05 },
    { pos: [22, getTerrainHeight(22, 17), 17], rot: 0.6, scale: 1.15 },
    { pos: [31, getTerrainHeight(31, 15), 15], rot: -0.5, scale: 1.0 },
    { pos: [26, getTerrainHeight(26, 23), 23], rot: 0.15, scale: 0.95 },
    { pos: [17, getTerrainHeight(17, 13), 13], rot: 0.45, scale: 1.2 },
    { pos: [30, getTerrainHeight(30, 24), 24], rot: -0.2, scale: 0.9 },
    { pos: [16, getTerrainHeight(16, 21), 21], rot: 0.8, scale: 1.0 }
  ], []);

  // River water ripple animation
  useFrame((state) => {
    if (waterRef.current) {
      const time = state.clock.getElapsedTime();
      // Gentle, slow organic wave undulation
      waterRef.current.position.y = 0.95 + Math.sin(time * 0.65) * 0.025;
    }
  });

  // Calculate bridge position crossing the river near village entrance (Z = 6)
  const bridgeZ = 6;
  const bridgeX = getRiverCenter(bridgeZ);
  const bridgeY = getTerrainHeight(bridgeX, bridgeZ);

  return (
    <group>
      {/* 1. PHOTOREALISTIC PROCEDURAL MOUNTAIN TERRAIN WITH SATELLITE ORTHOPHOTO & CONTOURS */}
      <mesh geometry={terrainGeo} receiveShadow castShadow>
        <meshStandardMaterial 
          map={satelliteTexture}
          bumpMap={bumpTexture}
          bumpScale={0.16}
          vertexColors 
          roughness={0.88} 
          metalness={0.08} 
          flatShading={false} 
        />
      </mesh>

      {/* 2. REALISTIC ANIMATED CURVING MEANDERING RIVER */}
      <mesh 
        ref={waterRef} 
        geometry={riverGeo} 
        receiveShadow
      >
        <meshStandardMaterial 
          color="#0891b2" 
          roughness={0.08} 
          metalness={0.55} 
          transparent 
          opacity={0.88} 
          depthWrite={false}
        />
      </mesh>

      {/* 3. TIMBER TRUSS ROAD BRIDGE OVER RIVER */}
      <RiverBridge 
        position={[bridgeX, bridgeY + 0.2, bridgeZ]} 
        rotationY={0.35} 
      />

      {/* 4. MAIN GRAVEL ROAD (Connecting Village to Bridge and Forest Trails) */}
      <mesh 
        position={[18, 1.8, 12]} 
        rotation={[-Math.PI / 2, 0, -0.3]} 
        receiveShadow
      >
        <planeGeometry args={[3.2, 38]} />
        <meshStandardMaterial color="#574635" roughness={0.96} />
      </mesh>

      {/* 5. MOUNTAIN FOREST CONIFER TREES */}
      {trees.map((t, idx) => (
        <ConiferTree 
          key={`conifer-${idx}`} 
          position={t.pos} 
          scale={t.scale} 
          species={t.species} 
        />
      ))}

      {/* 6. MOSSY BOULDERS & RIVERBANK STONES */}
      {boulders.map((b, idx) => (
        <Boulder 
          key={`boulder-${idx}`} 
          position={b.pos} 
          scale={b.scale} 
          rotation={b.rot} 
        />
      ))}

      {/* 7. AUTHENTIC HIMALAYAN VILLAGE HOUSES */}
      {villageHouses.map((h, idx) => (
        <MountainHouse 
          key={`house-${idx}`} 
          position={h.pos} 
          rotationY={h.rot} 
          scale={h.scale} 
        />
      ))}

      {/* 8. RUSTIC TIMBER FENCES AROUND PASTURE */}
      <group position={[23, getTerrainHeight(23, 14), 14]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[8.0, 0.08, 0.08]} />
          <meshStandardMaterial color="#3b2716" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[8.0, 0.08, 0.08]} />
          <meshStandardMaterial color="#3b2716" roughness={0.9} />
        </mesh>
        {[-3.6, -1.8, 0, 1.8, 3.6].map((px, i) => (
          <mesh key={`fence-post-${i}`} position={[px, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.9, 6]} />
            <meshStandardMaterial color="#2d1c0f" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
