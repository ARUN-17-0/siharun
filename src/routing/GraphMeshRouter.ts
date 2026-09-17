import { NodeState, NodeHealth } from '../types';
import { 
  NodePositionDefinition, 
  GATEWAY_POSITION, 
  calculateDistance3D, 
  calculateLinkMetrics, 
  LORA_MAX_RANGE, 
  GATEWAY_MAX_RANGE 
} from '../nodes/NodePhysics';

export interface RouteInfo {
  path: number[];             // Full sequence of node IDs e.g. [3, 1] or [7, 9, 0]
  totalCost: number;
  hopCount: number;
  nextHop: number | null;
  linkQualities: number[];
}

export interface RoutingTableResult {
  routesToMaster: Record<number, RouteInfo>;
  routesToGateway: Record<number, RouteInfo>;
  adjacencyList: Record<number, { neighborId: number; cost: number; distance: number; quality: number }[]>;
}

/**
 * Calculates the dynamic edge routing cost from node u to candidate node v.
 * Penalizes low health, depleted battery, high packet loss, and excessive distance.
 */
function calculateEdgeCost(
  posU: [number, number, number],
  posV: [number, number, number],
  targetHealth: NodeHealth | null,
  isGateway: boolean
): { cost: number; distance: number; quality: number; loss: number } {
  const metrics = calculateLinkMetrics(posU, posV);
  
  if (metrics.linkQuality <= 0) {
    return { cost: Infinity, distance: metrics.distance, quality: 0, loss: 1.0 };
  }

  // Base physical RF link cost (normalized 0 to 1)
  const normDist = metrics.distance / LORA_MAX_RANGE;
  const rfCost = 1.0 * normDist + 1.2 * (1.0 - metrics.linkQuality) + 1.5 * metrics.packetLossRate;

  // If routing to gateway, target has infinite health & power
  if (isGateway || !targetHealth) {
    return {
      cost: rfCost + 0.1,
      distance: metrics.distance,
      quality: metrics.linkQuality,
      loss: metrics.packetLossRate
    };
  }

  // Avoid unhealthy, overheating, or dying relay nodes
  const healthPenalty = (100 - targetHealth.overallScore) / 100 * 2.5;
  const batteryPenalty = (100 - targetHealth.batteryLevel) / 100 * 1.8;

  // Severe penalty if node is degraded or unsafe
  const safetyPenalty = !targetHealth.isSafe ? 10.0 : 0;

  const totalCost = rfCost + healthPenalty + batteryPenalty + safetyPenalty;

  return {
    cost: totalCost,
    distance: metrics.distance,
    quality: metrics.linkQuality,
    loss: metrics.packetLossRate
  };
}

/**
 * Dijkstra's shortest-path algorithm over the dynamic wireless mesh graph.
 */
export function dijkstra(
  startId: number,
  targetId: number,
  adjacency: Record<number, { neighborId: number; cost: number; quality: number }[]>
): RouteInfo {
  if (startId === targetId) {
    return { path: [startId], totalCost: 0, hopCount: 0, nextHop: null, linkQualities: [] };
  }

  const distances: Record<number, number> = {};
  const previous: Record<number, number | null> = {};
  const linkQualities: Record<number, number> = {};
  const unvisited = new Set<number>();

  for (const idStr of Object.keys(adjacency)) {
    const id = Number(idStr);
    distances[id] = Infinity;
    previous[id] = null;
    unvisited.add(id);
  }

  distances[startId] = 0;

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current: number | null = null;
    let minDistance = Infinity;

    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    }

    if (current === null || minDistance === Infinity) break;
    if (current === targetId) break;

    unvisited.delete(current);

    const neighbors = adjacency[current] || [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.neighborId)) continue;

      const alt = distances[current] + edge.cost;
      if (alt < distances[edge.neighborId]) {
        distances[edge.neighborId] = alt;
        previous[edge.neighborId] = current;
        linkQualities[edge.neighborId] = edge.quality;
      }
    }
  }

  // Reconstruct path
  if (distances[targetId] === Infinity || previous[targetId] === null && startId !== targetId) {
    // No route found
    return { path: [startId], totalCost: Infinity, hopCount: 0, nextHop: null, linkQualities: [] };
  }

  const path: number[] = [];
  let curr: number | null = targetId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  const routeQualities: number[] = [];
  for (let i = 1; i < path.length; i++) {
    routeQualities.push(linkQualities[path[i]] || 0.8);
  }

  return {
    path,
    totalCost: Math.round(distances[targetId] * 100) / 100,
    hopCount: path.length - 1,
    nextHop: path.length > 1 ? path[1] : null,
    linkQualities: routeQualities
  };
}

/**
 * Computes the global mesh routing tables for all alive nodes.
 * Connects regular nodes -> Master Node -> Village Gateway (Node 0).
 */
export function computeMeshRouting(
  nodeStates: NodeState[],
  masterId: number,
  gatewayOnline: boolean
): RoutingTableResult {
  const aliveNodes = nodeStates.filter(n => n.isAlive);
  const aliveMap = new Map<number, NodeState>(aliveNodes.map(n => [n.id, n]));

  // Build Adjacency Graph
  const adjacencyList: Record<number, { neighborId: number; cost: number; distance: number; quality: number }[]> = {};

  // Initialize graph nodes (0 for Gateway, 1..10 for sensor nodes)
  adjacencyList[0] = [];
  for (const node of aliveNodes) {
    adjacencyList[node.id] = [];
  }

  // Connect inter-node wireless edges
  for (let i = 0; i < aliveNodes.length; i++) {
    const u = aliveNodes[i];
    for (let j = i + 1; j < aliveNodes.length; j++) {
      const v = aliveNodes[j];
      const dist = calculateDistance3D(u.position3D, v.position3D);
      if (dist <= LORA_MAX_RANGE) {
        const costUV = calculateEdgeCost(u.position3D, v.position3D, v.health, false);
        const costVU = calculateEdgeCost(v.position3D, u.position3D, u.health, false);

        adjacencyList[u.id].push({
          neighborId: v.id,
          cost: costUV.cost,
          distance: costUV.distance,
          quality: costUV.quality
        });
        adjacencyList[v.id].push({
          neighborId: u.id,
          cost: costVU.cost,
          distance: costVU.distance,
          quality: costVU.quality
        });
      }
    }

    // Connect node to Gateway (Node 0) if within reach and gateway is online
    if (gatewayOnline) {
      const distToGateway = calculateDistance3D(u.position3D, GATEWAY_POSITION);
      if (distToGateway <= GATEWAY_MAX_RANGE) {
        const edgeUToGw = calculateEdgeCost(u.position3D, GATEWAY_POSITION, null, true);
        adjacencyList[u.id].push({
          neighborId: 0,
          cost: edgeUToGw.cost,
          distance: edgeUToGw.distance,
          quality: edgeUToGw.quality
        });
        adjacencyList[0].push({
          neighborId: u.id,
          cost: edgeUToGw.cost,
          distance: edgeUToGw.distance,
          quality: edgeUToGw.quality
        });
      }
    }
  }

  const routesToMaster: Record<number, RouteInfo> = {};
  const routesToGateway: Record<number, RouteInfo> = {};

  // 1. Calculate Master's route to Gateway (Node 0)
  let masterToGatewayRoute: RouteInfo = {
    path: [masterId],
    totalCost: Infinity,
    hopCount: 0,
    nextHop: null,
    linkQualities: []
  };

  if (aliveMap.has(masterId) && gatewayOnline) {
    masterToGatewayRoute = dijkstra(masterId, 0, adjacencyList);
  }

  // 2. For each node, calculate path to Master, then compose full path to Gateway
  for (const node of aliveNodes) {
    if (node.id === masterId) {
      // Master node route to master is trivial [masterId]
      routesToMaster[node.id] = {
        path: [node.id],
        totalCost: 0,
        hopCount: 0,
        nextHop: null,
        linkQualities: []
      };
      routesToGateway[node.id] = masterToGatewayRoute;
    } else {
      // Route node -> Master
      const routeToM = dijkstra(node.id, masterId, adjacencyList);
      routesToMaster[node.id] = routeToM;

      // Full route node -> Master -> Gateway
      if (routeToM.path.length > 0 && masterToGatewayRoute.path.length > 1) {
        // Concatenate without duplicating the master node
        const fullPath = [...routeToM.path, ...masterToGatewayRoute.path.slice(1)];
        routesToGateway[node.id] = {
          path: fullPath,
          totalCost: routeToM.totalCost + masterToGatewayRoute.totalCost,
          hopCount: fullPath.length - 1,
          nextHop: routeToM.nextHop,
          linkQualities: [...routeToM.linkQualities, ...masterToGatewayRoute.linkQualities]
        };
      } else {
        routesToGateway[node.id] = routeToM;
      }
    }
  }

  return {
    routesToMaster,
    routesToGateway,
    adjacencyList
  };
}
