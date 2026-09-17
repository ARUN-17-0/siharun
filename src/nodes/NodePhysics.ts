export interface NodePositionDefinition {
  id: number;
  name: string;
  zone: 'FOREST_UPPER' | 'RIVER_VALLEY' | 'SLOPE_RIDGE' | 'VILLAGE_APPROACH';
  position3D: [number, number, number];
  gps: {
    lat: number;
    lng: number;
    alt: number;
  };
  description: string;
}

// Elevation mathematical function for the landscape
// Mountain ridge on west/north, river valley in center, village plateau on east
export function getTerrainHeight(x: number, z: number): number {
  const mountainFactor = Math.max(0, (-x * 0.4 - z * 0.35 + 5) / 18);
  const mountainHeight = Math.pow(mountainFactor, 1.6) * 8.5;

  const valleyCenter = -12 + (z + 20) * 0.5;
  const distToRiver = Math.abs(x - valleyCenter);
  const riverTrough = Math.max(0, 1 - distToRiver / 8) * 3.2;

  const undulation = Math.sin(x * 0.12) * Math.cos(z * 0.1) * 1.2;
  const villagePlateau = (x > 10 && z > -5 && z < 25) ? 1.5 : 0;

  const rawHeight = mountainHeight - riverTrough + undulation + villagePlateau;
  return Math.max(0.2, rawHeight);
}

// Village Gateway location (Node 0)
export const GATEWAY_POSITION: [number, number, number] = [28, 2.2, 14];
export const GATEWAY_GPS = { lat: 30.1448, lng: 79.1285, alt: 1420 };

// 10 Sensor Nodes strategically placed over procedural terrain zones
// Node 1 is elevated high on a mountain pine tree (+3.2m above terrain surface)
export const INITIAL_NODE_DEFINITIONS: NodePositionDefinition[] = [
  {
    id: 1,
    name: "Mountain Tree Post N1 (Master)",
    zone: "FOREST_UPPER",
    position3D: [-26, Math.round((getTerrainHeight(-26, -22) + 3.2) * 10) / 10, -22], // ~15.9m (Tree-mounted)
    gps: { lat: 30.1652, lng: 79.1021, alt: 1890 },
    description: "High mountain tree-mounted observation post on forest ridge. Line-of-sight LoRa backbone."
  },
  {
    id: 2,
    name: "North Canopy N2",
    zone: "FOREST_UPPER",
    position3D: [-12, Math.round((getTerrainHeight(-12, -26) + 0.3) * 10) / 10, -26], // ~8.5m
    gps: { lat: 30.1685, lng: 79.1143, alt: 1840 },
    description: "Dense pine canopy monitor for forest thermal & combustible smoke signatures."
  },
  {
    id: 3,
    name: "West Escarpment N3",
    zone: "FOREST_UPPER",
    position3D: [-32, Math.round((getTerrainHeight(-32, -8) + 0.3) * 10) / 10, -8], // ~11.4m
    gps: { lat: 30.1580, lng: 79.0965, alt: 1795 },
    description: "Western cliff boundary monitor for wildfires and gust winds."
  },
  {
    id: 4,
    name: "River Weir N4",
    zone: "RIVER_VALLEY",
    position3D: [-14, Math.round((getTerrainHeight(-14, -4) + 0.3) * 10) / 10, -4], // ~3.6m
    gps: { lat: 30.1520, lng: 79.1118, alt: 1460 },
    description: "Catchment basin and hydrologic telemetry station with ultrasonic water level sensor."
  },
  {
    id: 5,
    name: "Valley Culvert N5",
    zone: "RIVER_VALLEY",
    position3D: [-2, Math.round((getTerrainHeight(-2, 8) + 0.3) * 10) / 10, 8], // ~0.5m
    gps: { lat: 30.1462, lng: 79.1215, alt: 1435 },
    description: "Downstream gorge bottleneck for flash-flood surge detection."
  },
  {
    id: 6,
    name: "Slope Geophone N6",
    zone: "SLOPE_RIDGE",
    position3D: [-20, Math.round((getTerrainHeight(-20, 16) + 0.3) * 10) / 10, 16], // ~2.4m
    gps: { lat: 30.1408, lng: 79.1054, alt: 1680 },
    description: "Steep shale embankment with dual-axis tiltmeters and seismometers for landslide shear."
  },
  {
    id: 7,
    name: "Rock Terrace N7",
    zone: "SLOPE_RIDGE",
    position3D: [-8, Math.round((getTerrainHeight(-8, 22) + 0.3) * 10) / 10, 22], // ~0.9m
    gps: { lat: 30.1384, lng: 79.1170, alt: 1640 },
    description: "Solid bedrock terrace with high solar insolation. High battery capacity candidate."
  },
  {
    id: 8,
    name: "Forest Trail N8",
    zone: "VILLAGE_APPROACH",
    position3D: [8, Math.round((getTerrainHeight(8, -10) + 0.3) * 10) / 10, -10], // ~2.0m
    gps: { lat: 30.1555, lng: 79.1302, alt: 1510 },
    description: "Main timber trail and agricultural transition point with particulate air monitor."
  },
  {
    id: 9,
    name: "Village Border N9",
    zone: "VILLAGE_APPROACH",
    position3D: [15, Math.round((getTerrainHeight(15, 6) + 0.3) * 10) / 10, 6], // ~2.8m
    gps: { lat: 30.1478, lng: 79.1264, alt: 1445 },
    description: "Village entrance bridge relay node. Direct line-of-sight to Village Gateway."
  },
  {
    id: 10,
    name: "Hill Relay N10",
    zone: "VILLAGE_APPROACH",
    position3D: [21, Math.round((getTerrainHeight(21, -4) + 0.3) * 10) / 10, -4], // ~2.4m
    gps: { lat: 30.1512, lng: 79.1330, alt: 1490 },
    description: "Commanding village hill relay node with dedicated redundant antenna."
  }
];

// Maximum RF transmission distance in simulation 3D units (equivalent to ~1.4 km)
export const LORA_MAX_RANGE = 25.0;

// Gateway communication range (Gateway has a 12dBi omni antenna with extended range)
export const GATEWAY_MAX_RANGE = 28.0;

export function calculateDistance3D(
  p1: [number, number, number], 
  p2: [number, number, number]
): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Compute RF link quality (0.0 to 1.0) and RSSI in dBm based on distance and elevation
export function calculateLinkMetrics(
  p1: [number, number, number],
  p2: [number, number, number]
): { distance: number; linkQuality: number; rssiDbm: number; packetLossRate: number } {
  const distance = calculateDistance3D(p1, p2);
  if (distance > LORA_MAX_RANGE) {
    return { distance, linkQuality: 0, rssiDbm: -130, packetLossRate: 1.0 };
  }

  // 443 MHz Log-Distance Path Loss model approximation
  // Reference RSSI at 1 unit ~ -55 dBm, path loss exponent n ~ 2.4
  const rssiDbm = -55 - 10 * 2.4 * Math.log10(Math.max(1, distance));
  
  // Link quality (1.0 at close distance, down to 0.1 at edge of sensitivity)
  const normQuality = Math.max(0.05, 1 - (distance / LORA_MAX_RANGE) * 0.9);
  
  // Packet loss rate under nominal conditions
  const packetLossRate = Math.min(0.35, Math.max(0.01, (distance / LORA_MAX_RANGE) ** 2 * 0.25));

  return {
    distance,
    linkQuality: Math.round(normQuality * 100) / 100,
    rssiDbm: Math.round(rssiDbm),
    packetLossRate: Math.round(packetLossRate * 100) / 100
  };
}

// Get all reachable neighbors for a node among active nodes
export function getReachableNeighbors(
  nodeId: number, 
  allNodes: NodePositionDefinition[], 
  aliveNodeIds: Set<number>
): number[] {
  const sourceNode = allNodes.find(n => n.id === nodeId);
  if (!sourceNode || !aliveNodeIds.has(nodeId)) return [];

  const neighbors: number[] = [];
  for (const other of allNodes) {
    if (other.id === nodeId) continue;
    if (!aliveNodeIds.has(other.id)) continue;

    const dist = calculateDistance3D(sourceNode.position3D, other.position3D);
    if (dist <= LORA_MAX_RANGE) {
      neighbors.push(other.id);
    }
  }
  return neighbors;
}

// Check if a node can reach the Gateway directly
export function canReachGateway(nodePosition: [number, number, number]): boolean {
  return calculateDistance3D(nodePosition, GATEWAY_POSITION) <= GATEWAY_MAX_RANGE;
}
