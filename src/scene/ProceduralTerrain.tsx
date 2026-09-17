import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '../nodes/NodePhysics';


// Procedural Tree Component (Pine tree or deciduous)
interface TreeProps {
  position: [number, number, number];
  scale?: number;
  isPine?: boolean;
}

const Tree: React.FC<TreeProps> = ({ position, scale = 1, isPine = true }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.22, 1.4, 6]} />
        <meshStandardMaterial color="#4a2e18" roughness={0.9} />
      </mesh>
      {/* Foliage */}
      {isPine ? (
        <group position={[0, 1.4, 0]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <coneGeometry args={[1.2, 1.6, 6]} />
            <meshStandardMaterial color="#1e3a1e" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.2, 0]} castShadow>
            <coneGeometry args={[0.9, 1.4, 6]} />
            <meshStandardMaterial color="#2d522d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.9, 0]} castShadow>
            <coneGeometry args={[0.6, 1.1, 6]} />
            <meshStandardMaterial color="#3d6b3d" roughness={0.8} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, 1.6, 0]} castShadow>
          <sphereGeometry args={[0.9, 7, 7]} />
          <meshStandardMaterial color="#3b6e2e" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
};

// Procedural Village Hut / House
interface HouseProps {
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}

const House: React.FC<HouseProps> = ({ position, rotationY = 0, scale = 1 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* House Base */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.5, 2.0]} />
        <meshStandardMaterial color="#c2a685" roughness={0.85} />
      </mesh>
      {/* Sloped Roof */}
      <mesh position={[0, 1.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.8, 1.0, 4]} />
        <meshStandardMaterial color="#8b4513" roughness={0.7} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.5, 1.01]}>
        <planeGeometry args={[0.5, 1.0]} />
        <meshStandardMaterial color="#331c0a" roughness={0.9} />
      </mesh>
      {/* Window */}
      <mesh position={[0.6, 0.8, 1.01]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshStandardMaterial color="#fef08a" emissive="#ca8a04" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};

export const ProceduralTerrain: React.FC = () => {
  // Generate terrain geometry with vertex height displacement and color gradation
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(80, 80, 70, 70);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      // Color based on height and zone
      // Mountain ridge = rock slate/grey
      // Forest = lush deep green
      // River valley = moist brown/sand
      // Village = warm earth/grass
      if (y > 5.5) {
        // High mountain ridge
        colors[i * 3 + 0] = 0.38; // R
        colors[i * 3 + 1] = 0.42; // G
        colors[i * 3 + 2] = 0.36; // B
      } else if (x < 0 && y > 2.0) {
        // Forest slope
        colors[i * 3 + 0] = 0.18;
        colors[i * 3 + 1] = 0.35;
        colors[i * 3 + 2] = 0.16;
      } else if (y < 1.4) {
        // Riverbed / sand
        colors[i * 3 + 0] = 0.44;
        colors[i * 3 + 1] = 0.40;
        colors[i * 3 + 2] = 0.28;
      } else {
        // Village / meadow
        colors[i * 3 + 0] = 0.24;
        colors[i * 3 + 1] = 0.42;
        colors[i * 3 + 2] = 0.20;
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Procedural tree locations in forest zone
  const trees = useMemo(() => {
    const list: { pos: [number, number, number]; scale: number; isPine: boolean }[] = [];
    const seed = 42;
    for (let i = 0; i < 65; i++) {
      const x = -35 + ((i * 17 + seed) % 45);
      const z = -35 + ((i * 23 + seed) % 55);

      // Avoid putting trees inside river or village houses
      const y = getTerrainHeight(x, z);
      if (y > 1.4 && !(x > 18 && z > 5)) {
        list.push({
          pos: [x, y, z],
          scale: 0.75 + ((i % 5) * 0.12),
          isPine: x < 5
        });
      }
    }
    return list;
  }, []);

  // Village houses around the gateway
  const villageHouses: { pos: [number, number, number]; rot: number; scale: number }[] = [
    { pos: [22, 1.8, 10], rot: 0.3, scale: 1.1 },
    { pos: [26, 1.9, 8], rot: -0.2, scale: 1.0 },
    { pos: [21, 1.7, 18], rot: 0.8, scale: 1.2 },
    { pos: [32, 2.1, 16], rot: -0.6, scale: 1.05 },
    { pos: [25, 2.0, 22], rot: 0.1, scale: 0.95 },
    { pos: [17, 1.6, 14], rot: 0.4, scale: 1.15 }
  ];

  return (
    <group>
      {/* Procedural Main Terrain Mesh */}
      <mesh geometry={terrainGeo} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.88} metalness={0.05} />
      </mesh>

      {/* River Flow Water Plane */}
      <mesh position={[-6, 0.85, 2]} rotation={[-Math.PI / 2, 0, 0.45]} receiveShadow>
        <planeGeometry args={[14, 75]} />
        <meshStandardMaterial 
          color="#0284c7" 
          roughness={0.2} 
          metalness={0.4} 
          transparent 
          opacity={0.82} 
        />
      </mesh>

      {/* Village Dirt Trail / Road */}
      <mesh position={[18, 1.6, 15]} rotation={[-Math.PI / 2, 0, -0.2]} receiveShadow>
        <planeGeometry args={[3.2, 35]} />
        <meshStandardMaterial color="#574837" roughness={0.95} />
      </mesh>

      {/* Ridge Trail */}
      <mesh position={[-20, 6.2, -22]} rotation={[-Math.PI / 2, 0, 0.6]} receiveShadow>
        <planeGeometry args={[2.0, 30]} />
        <meshStandardMaterial color="#4a4238" roughness={0.95} />
      </mesh>

      {/* Forest Trees */}
      {trees.map((t, idx) => (
        <Tree key={`tree-${idx}`} position={t.pos} scale={t.scale} isPine={t.isPine} />
      ))}

      {/* Village Houses */}
      {villageHouses.map((h, idx) => (
        <House key={`house-${idx}`} position={h.pos} rotationY={h.rot} scale={h.scale} />
      ))}

      {/* Grid Floor for Digital-Twin Wireframe Aesthetic at base */}
      <gridHelper args={[84, 42, '#0891b2', '#1e293b']} position={[0, 0.05, 0]} />
    </group>
  );
};
