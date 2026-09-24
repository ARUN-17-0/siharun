import React, { useMemo } from 'react';
import * as THREE from 'three';
import { NodeState } from '../types';
import { GATEWAY_POSITION, calculateDistance3D, LORA_MAX_RANGE } from '../nodes/NodePhysics';

interface MeshLinks3DProps {
  nodes: NodeState[];
  currentMasterId: number;
  selectedNodeId: number | null;
  showAllNeighbors?: boolean;
}

// Sleek 3D laser / RF beam connection between two 3D positions
interface BeamLinkProps {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  radius?: number;
  opacity?: number;
}

const BeamLink: React.FC<BeamLinkProps> = ({ from, to, color, radius = 0.05, opacity = 0.85 }) => {
  const { position, quaternion, length } = useMemo(() => {
    const vFrom = new THREE.Vector3(...from);
    const vTo = new THREE.Vector3(...to);
    const dir = new THREE.Vector3().subVectors(vTo, vFrom);
    const length = dir.length();

    const midpoint = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);

    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());

    return {
      position: [midpoint.x, midpoint.y, midpoint.z] as [number, number, number],
      quaternion: quat,
      length
    };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 6]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={2.5} 
        transparent 
        opacity={opacity} 
        roughness={0.2}
      />
    </mesh>
  );
};

export const MeshLinks3D: React.FC<MeshLinks3DProps> = ({
  nodes,
  currentMasterId,
  selectedNodeId,
  showAllNeighbors = true
}) => {
  const nodeMap = useMemo(() => {
    const map = new Map<number, [number, number, number]>();
    for (const n of nodes) {
      map.set(n.id, [n.position3D[0], n.position3D[1] + 0.8, n.position3D[2]]);
    }
    // Node 0 is Gateway
    map.set(0, [GATEWAY_POSITION[0], GATEWAY_POSITION[1] + 4.5, GATEWAY_POSITION[2]]);
    return map;
  }, [nodes]);

  // 1. Potential neighbor links (all pairs within LORA_MAX_RANGE)
  const neighborSegments = useMemo(() => {
    if (!showAllNeighbors) return [];
    const segments: [number, number, number][] = [];
    const aliveNodes = nodes.filter(n => n.isAlive);

    for (let i = 0; i < aliveNodes.length; i++) {
      const u = aliveNodes[i];
      for (let j = i + 1; j < aliveNodes.length; j++) {
        const v = aliveNodes[j];
        const dist = calculateDistance3D(u.position3D, v.position3D);
        if (dist <= LORA_MAX_RANGE) {
          const pu = nodeMap.get(u.id);
          const pv = nodeMap.get(v.id);
          if (pu && pv) {
            segments.push(pu, pv);
          }
        }
      }
    }
    return segments;
  }, [nodes, nodeMap, showAllNeighbors]);

  // 2. Active Dijkstra routed links
  const activeRouteSegments = useMemo(() => {
    const segments: { 
      from: [number, number, number]; 
      to: [number, number, number]; 
      color: string; 
      radius: number; 
      opacity: number;
    }[] = [];

    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
    const selectedPath = selectedNode?.routeToGateway || [];

    // Deduplicate undirected edges
    const seenEdges = new Set<string>();

    for (const node of nodes) {
      if (!node.isAlive) continue;

      const path = node.routeToGateway;
      if (!path || path.length < 2) continue;

      for (let i = 0; i < path.length - 1; i++) {
        const uId = path[i];
        const vId = path[i + 1];
        const edgeKey = uId < vId ? `${uId}-${vId}` : `${vId}-${uId}`;

        const pu = nodeMap.get(uId);
        const pv = nodeMap.get(vId);

        if (pu && pv && !seenEdges.has(edgeKey)) {
          seenEdges.add(edgeKey);

          const isSelectedRoute = selectedPath.includes(uId) && selectedPath.includes(vId);
          const isMasterToGw = (uId === currentMasterId && vId === 0) || (vId === currentMasterId && uId === 0);
          const isToMaster = (vId === currentMasterId || uId === currentMasterId);

          let color = "#0ea5e9"; // Default cyan link
          let radius = 0.04;
          let opacity = 0.7;

          if (isSelectedRoute) {
            color = "#38bdf8"; // Highlighted route
            radius = 0.07;
            opacity = 0.95;
          } else if (isMasterToGw) {
            color = "#10b981"; // Master to Gateway green trunk
            radius = 0.08;
            opacity = 0.9;
          } else if (isToMaster) {
            color = "#eab308"; // Golden link into Master
            radius = 0.06;
            opacity = 0.85;
          }

          segments.push({
            from: pu,
            to: pv,
            color,
            radius,
            opacity
          });
        }
      }
    }
    return segments;
  }, [nodes, nodeMap, currentMasterId, selectedNodeId]);

  // 3. Highlighted neighbor beams for selected node (connects selected node to all its immediate neighbors)
  const selectedNeighborBeams = useMemo(() => {
    if (!selectedNodeId) return [];
    const selNode = nodes.find(n => n.id === selectedNodeId);
    if (!selNode || !selNode.isAlive) return [];

    const pu = nodeMap.get(selectedNodeId);
    if (!pu) return [];

    const beams: { from: [number, number, number]; to: [number, number, number]; color: string; radius: number; opacity: number }[] = [];
    for (const neighborId of selNode.neighbors) {
      const pv = nodeMap.get(neighborId);
      if (pv) {
        beams.push({
          from: pu,
          to: pv,
          color: "#38bdf8",
          radius: 0.05,
          opacity: 0.9
        });
      }
    }
    return beams;
  }, [selectedNodeId, nodes, nodeMap]);

  // Line segments geometry for background mesh potential links
  const neighborGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const flat: number[] = [];
    for (const pt of neighborSegments) {
      flat.push(pt[0], pt[1], pt[2]);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
    return geo;
  }, [neighborSegments]);

  return (
    <group>
      {/* Background Mesh Topology (Clearly visible sub-GHz LoRa grid lines) */}
      {neighborSegments.length > 0 && (
        <lineSegments geometry={neighborGeometry}>
          <lineBasicMaterial color="#0284c7" transparent opacity={0.5} depthWrite={false} />
        </lineSegments>
      )}

      {/* Selected Node Direct Neighbor Beams (Shows all nodes connected to the selected node) */}
      {selectedNeighborBeams.map((b, idx) => (
        <BeamLink
          key={`selected-neighbor-${idx}`}
          from={b.from}
          to={b.to}
          color={b.color}
          radius={b.radius}
          opacity={b.opacity}
        />
      ))}

      {/* Active Multi-Hop Routes Rendered as Glowing 3D Beams */}
      {activeRouteSegments.map((seg, idx) => (
        <BeamLink
          key={`active-route-${idx}`}
          from={seg.from}
          to={seg.to}
          color={seg.color}
          radius={seg.radius}
          opacity={seg.opacity}
        />
      ))}
    </group>
  );
};
