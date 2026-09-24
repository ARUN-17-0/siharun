import React from 'react';
import * as THREE from 'three';
import { ActivePacketAnimation } from '../types';

interface PacketStream3DProps {
  animations: ActivePacketAnimation[];
}

export const PacketStream3D: React.FC<PacketStream3DProps> = ({ animations }) => {
  return (
    <group>
      {animations.map(anim => {
        const t = Math.min(1.0, Math.max(0.0, anim.progress));
        const [sx, sy, sz] = anim.startPos;
        const [ex, ey, ez] = anim.endPos;

        // Compute parabolic RF arc trajectory
        const arcY = Math.sin(t * Math.PI) * 1.5;
        const curX = sx + (ex - sx) * t;
        const curY = (sy + 0.8) + ((ey + 0.8) - (sy + 0.8)) * t + arcY;
        const curZ = sz + (ez - sz) * t;

        // Packet type coloring
        let color = '#38bdf8'; // Cyan default
        let size = 0.22;

        if (anim.packet.packetType === 'CRITICAL_ALERT') {
          color = '#ef4444'; // Bright Red
          size = 0.32;
        } else if (anim.packet.packetType === 'MASTER_HANDOVER' || anim.packet.packetType === 'ELECTION_WINNER') {
          color = '#f59e0b'; // Gold Amber
          size = 0.35;
        }

        return (
          <group key={anim.id} position={[curX, curY, curZ]}>
            {/* Core Packet Energy Sphere */}
            <mesh>
              <sphereGeometry args={[size, 16, 16]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={3.5} 
                roughness={0.1} 
              />
            </mesh>

            {/* Subtle Outer Glow Halo */}
            <mesh>
              <sphereGeometry args={[size * 1.8, 12, 12]} />
              <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.35} 
                depthWrite={false} 
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
