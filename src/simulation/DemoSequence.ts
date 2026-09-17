export interface DemoStep {
  stepIndex: number;
  title: string;
  durationMs: number;
  description: string;
  action: 'SET_NORMAL' | 'START_FIRE' | 'ESCALATE_FIRE' | 'TRIGGER_HANDOVER' | 'KILL_OLD_MASTER' | 'CONVERGE_REROUTE' | 'VERIFY_GATEWAY' | 'COMPLETE';
}

/**
 * 14-Step Complete Demo sequence as required by the specification:
 * 1. Normal network
 * 2. Fire begins
 * 3. Node AI probabilities increase
 * 4. Neighbouring nodes detect the same hazard
 * 5. Regional risk increases
 * 6. Critical alert travels through mesh
 * 7. Master node becomes unsafe
 * 8. Master announces handover
 * 9. Best healthy node becomes master
 * 10. Network reroutes
 * 11. Village receives alert
 * 12. Original master fails
 * 13. Network continues operating
 * 14. Show final system status
 * Total duration: ~135 seconds (2.2 minutes), with fast-forward/pause controls.
 */
export const COMPLETE_DEMO_STEPS: DemoStep[] = [
  {
    stepIndex: 1,
    title: "1. Nominal Mesh State",
    durationMs: 8000,
    description: "Mesh operating nominally. Node 1 is Regional Master aggregating forest data and routing to Village Gateway.",
    action: 'SET_NORMAL'
  },
  {
    stepIndex: 2,
    title: "2. Fire Ignition in Upper Ridge",
    durationMs: 9000,
    description: "Thermal signatures and combustible smoke particles begin rising near Node 1 & Node 2 in Forest Upper Ridge.",
    action: 'START_FIRE'
  },
  {
    stepIndex: 3,
    title: "3. Edge AI Threat Probability Spikes",
    durationMs: 9000,
    description: "ESP32-S3 Edge AI detects temp rise rate + low humidity + camera flame vectors. Fire probability escalates past 65%.",
    action: 'ESCALATE_FIRE'
  },
  {
    stepIndex: 4,
    title: "4. Multi-Node Corroboration",
    durationMs: 9000,
    description: "Adjacent nodes N2 & N3 corroborate high PM2.5 and smoke density, confirming localized multi-sensor wildfire event.",
    action: 'ESCALATE_FIRE'
  },
  {
    stepIndex: 5,
    title: "5. Regional Risk Escalates to CRITICAL",
    durationMs: 9000,
    description: "Edge AI hysteresis transitions state from WARNING to CRITICAL. Overall threat severity reaches 92%.",
    action: 'ESCALATE_FIRE'
  },
  {
    stepIndex: 6,
    title: "6. LoRa Critical Packets Propagate",
    durationMs: 10000,
    description: "Compact 32-byte LoRa packets broadcast across 443MHz sub-GHz channels, traversing multi-hop mesh links.",
    action: 'ESCALATE_FIRE'
  },
  {
    stepIndex: 7,
    title: "7. Current Master (N1) Becomes Unsafe",
    durationMs: 10000,
    description: "Intense heat engulfs Node 1 (temp > 75°C, health drops to 23%). Master triggers preemptive graceful handover protocol.",
    action: 'TRIGGER_HANDOVER'
  },
  {
    stepIndex: 8,
    title: "8. Master Broadcasts Handover Packet",
    durationMs: 9000,
    description: "Node 1 computes candidate scores and broadcasts MASTER_HANDOVER packet designating top-scored healthy replacement.",
    action: 'TRIGGER_HANDOVER'
  },
  {
    stepIndex: 9,
    title: "9. Best Healthy Node Assumes Master",
    durationMs: 10000,
    description: "New Master assumes regional command based on superior battery, high health, RF degree, and clear line-of-sight.",
    action: 'CONVERGE_REROUTE'
  },
  {
    stepIndex: 10,
    title: "10. Autonomous Mesh Rerouting",
    durationMs: 10000,
    description: "Dijkstra routing tables rebuild dynamically. Sensor nodes bypass failing Node 1 and converge on the new Master.",
    action: 'CONVERGE_REROUTE'
  },
  {
    stepIndex: 11,
    title: "11. Village Gateway Receives Hazard Alert",
    durationMs: 10000,
    description: "Village Gateway receives aggregated early-warning telemetry via the new Master. Evacuation siren triggered.",
    action: 'VERIFY_GATEWAY'
  },
  {
    stepIndex: 12,
    title: "12. Original Master (N1) Shuts Down",
    durationMs: 10000,
    description: "Node 1 suffers terminal thermal failure and powers off. Zero disruption to ongoing mesh telemetry!",
    action: 'KILL_OLD_MASTER'
  },
  {
    stepIndex: 13,
    title: "13. Resilient Continuous Operation",
    durationMs: 11000,
    description: "Self-healing topology maintains continuous stream of environmental telemetry with 0% packet loss to the village.",
    action: 'CONVERGE_REROUTE'
  },
  {
    stepIndex: 14,
    title: "14. Final Resilient Network Audit",
    durationMs: 12000,
    description: "Demonstration complete! Autonomous failover, edge AI inference, and 443MHz LoRa mesh verified successfully.",
    action: 'COMPLETE'
  }
];
