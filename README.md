# SIH 2026: Resilient AI-Powered Environmental Monitoring Digital-Twin

> **"A resilient, AI-powered environmental monitoring network for early detection of floods, forest fires, landslides and pollution."**

An interactive, browser-based 3D digital-twin simulation demonstrating a ruggedized edge-computing mesh network for Smart India Hackathon (SIH) 2026.

---

## 🌟 Key Architecture & Capabilities

1. **3D Procedural Digital-Twin**:
   - 100% offline, lightweight Three.js & React Three Fiber graphics (zero external 3D asset downloads).
   - High-elevation forest ridge, river catchment basin, steep unstable slopes, and rural village with central communication gateway.

2. **10 Sensor Nodes (`ESP32-S3 + Edge AI + 443MHz LoRa`)**:
   - Simulates **11 continuous telemetry streams**: Temperature, Humidity, Smoke/Gas (ppm), PM2.5/PM10, Rainfall rate, Soil moisture, River water level, Tilt angle, Vibration, GPS coordinates, and Edge CNN Camera classification vectors.
   - Deterministic multi-sensor correlation model producing Fire, Flood, Landslide, and Pollution probabilities ($0–100\%$) and overall Severity ($0–100\%$).
   - Multi-cycle **Hysteresis Debouncing** preventing state oscillations between `NORMAL`, `WATCH`, `WARNING`, and `CRITICAL`.

3. **Compact LoRa Sub-GHz Packets (32-Byte Payload)**:
   - Emulates bandwidth-efficient 443MHz LoRa SF9 transmission with live byte serialization preview.
   - Transmits compact threat probabilities and telemetry summaries rather than heavy raw sensor/camera streams.

4. **Dynamic Dijkstra Mesh Routing**:
   - Real-time graph routing considering distance, link quality, packet loss, target node health, and battery levels.
   - Renders active routes as glowing 3D laser beams and flying energy packets.

5. **Self-Healing Master Node Handover & Election**:
   - **Graceful Handover**: Preemptive failover when Master experiences thermal or battery degradation ($T > 72^\circ\text{C}$). Evaluates candidate fitness scores across neighbors and broadcasts `MASTER_HANDOVER`.
   - **Sudden Failure Recovery**: Heartbeat watchdog timeout ($T_{timeout} > 3000\text{ms}$) initiates distributed consensus election to elect a new Regional Master and rebuild routes autonomously.

6. **Interactive Disaster Scenarios & Complete Demo**:
   - `Normal`, `Forest Fire`, `Flood`, `Landslide`, `Pollution`, `Trigger Master Handover`, `Kill Master`.
   - **Complete Demo (2 Min)**: Automated 14-step presentation sequence with narration overlay.

---

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **3D Graphics**: Three.js + React Three Fiber + Drei
- **Styling**: Tailwind CSS + Glassmorphism HUD
- **Icons**: Lucide React
- **Deployment**: GitHub Pages

---

## 🚀 Getting Started

### Local Development
```bash
# Clone the repository
git clone https://github.com/ARUN-17-0/siharun.git
cd siharun

# Install dependencies
npm install --legacy-peer-deps

# Start Vite local development server
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 👥 Author
- **ARUN KARTHIK** ([@ARUN-17-0](https://github.com/ARUN-17-0))
- Smart India Hackathon (SIH) 2026
