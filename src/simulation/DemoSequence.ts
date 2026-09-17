export interface DemoStep {
  stepIndex: number;
  title: string;
  durationMs: number;
  description: string;
  action: 'SET_NORMAL' | 'DETECT_ANOMALY' | 'DISPATCH_WARNING' | 'EVACUATE_VILLAGE' | 'PEAK_DISASTER' | 'TRIGGER_HANDOVER' | 'KILL_OLD_MASTER' | 'CONVERGE_REROUTE' | 'VERIFY_GATEWAY' | 'COMPLETE';
}

/**
 * 14-Step Complete Demo sequence:
 * 1. Normal network baseline
 * 2. Wildfire incipient thermal anomaly
 * 3. Sensor nodes 1, 2, 3 detect heat rise rate
 * 4. Multi-sensor corroboration flags early hazard
 * 5. Early warning packet dispatched through mesh
 * 6. Village Gateway receives warning & triggers evacuation
 * 7. Village successfully evacuated to high ground
 * 8. Fire peaks: Master node 1 becomes thermally stressed (82°C)
 * 9. Master node 1 initiates graceful handover
 * 10. Node 7 elected new Regional Master
 * 11. Mesh reroutes: Nodes 2 and 3 route via multi-hop to Node 7
 * 12. Original Master Node 1 fails/powers down safely
 * 13. Network continues uninterrupted telemetry collection
 * 14. Final resilient system audit
 */
export const COMPLETE_DEMO_STEPS: DemoStep[] = [
  {
    stepIndex: 1,
    title: "1. Baseline Nominal State",
    durationMs: 7000,
    description: "Mesh operating nominally. Node 1 is Regional Master aggregating forest data and routing to Village Gateway.",
    action: 'SET_NORMAL'
  },
  {
    stepIndex: 2,
    title: "2. Forest Fire Incipient Thermal Plume",
    durationMs: 8000,
    description: "Combustible gas and temperature rise rate detected near Forest Upper Ridge sensors (Nodes 1, 2, 3).",
    action: 'DETECT_ANOMALY'
  },
  {
    stepIndex: 3,
    title: "3. Edge AI Early Threat Detection",
    durationMs: 8000,
    description: "ESP32-S3 detects steep delta-T/delta-t + optical flame vector. Early Warning status triggered before peak fire.",
    action: 'DISPATCH_WARNING'
  },
  {
    stepIndex: 4,
    title: "4. Multi-Node Mesh Corroboration",
    durationMs: 8000,
    description: "Adjacent nodes N2 & N3 corroborate high PM2.5 and smoke density, verifying localized wildfire event.",
    action: 'DISPATCH_WARNING'
  },
  {
    stepIndex: 5,
    title: "5. Early Warning Broadcast to Gateway",
    durationMs: 9000,
    description: "Compact 32-byte LoRa packets travel across multi-hop links to Village Gateway, warning of incoming danger.",
    action: 'DISPATCH_WARNING'
  },
  {
    stepIndex: 6,
    title: "6. Village Emergency Siren & Evacuation Starts",
    durationMs: 10000,
    description: "Village Gateway sounds emergency sirens BEFORE fire peak. Evacuation transports start moving toward high ground.",
    action: 'EVACUATE_VILLAGE'
  },
  {
    stepIndex: 7,
    title: "7. Village Successfully Evacuated",
    durationMs: 9000,
    description: "All personnel and livestock safely evacuated to designated high-ground safety perimeter.",
    action: 'EVACUATE_VILLAGE'
  },
  {
    stepIndex: 8,
    title: "8. Fire Reaches Peak: Master (N1) Overheats",
    durationMs: 10000,
    description: "Fire engulfs upper ridge (82°C). Master Node 1 health drops to 23%. Preemptive handover protocol triggered.",
    action: 'TRIGGER_HANDOVER'
  },
  {
    stepIndex: 9,
    title: "9. Master Handover Packet Broadcast",
    durationMs: 9000,
    description: "Node 1 evaluates candidate fitness scores and designates healthy, high-battery Node 7 as new Regional Master.",
    action: 'TRIGGER_HANDOVER'
  },
  {
    stepIndex: 10,
    title: "10. Node 7 Assumes Regional Command",
    durationMs: 9000,
    description: "Node 7 assumes Master role with 96% battery, excellent RF connectivity, and clear line-of-sight to the Gateway.",
    action: 'CONVERGE_REROUTE'
  },
  {
    stepIndex: 11,
    title: "11. Multi-Hop Rerouting: N2 & N3 Route to N7",
    durationMs: 10000,
    description: "Dijkstra routing updates. Isolated nodes N2 & N3 forward data through intermediate relays (N4, N5) to new Master N7.",
    action: 'CONVERGE_REROUTE'
  },
  {
    stepIndex: 12,
    title: "12. Original Master (N1) Powered Off",
    durationMs: 9000,
    description: "Node 1 is de-energized post-handover. Zero disruption to ongoing mesh telemetry collection!",
    action: 'KILL_OLD_MASTER'
  },
  {
    stepIndex: 13,
    title: "13. Continued Resilient Telemetry Flow",
    durationMs: 10000,
    description: "All active sector sensors continue streaming environmental telemetry to the Village Gateway via Master N7.",
    action: 'VERIFY_GATEWAY'
  },
  {
    stepIndex: 14,
    title: "14. System Audit Complete & Verified",
    durationMs: 11000,
    description: "Early detection, proactive evacuation, graceful master failover, and multi-hop resilience verified successfully.",
    action: 'COMPLETE'
  }
];
