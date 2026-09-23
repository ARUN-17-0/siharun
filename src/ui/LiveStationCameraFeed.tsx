import React, { useRef, useEffect, useState } from 'react';
import { Camera, Eye, Zap, Maximize2, ShieldAlert, Thermometer, Radio } from 'lucide-react';
import { NodeState, ScenarioType } from '../types';

interface LiveStationCameraFeedProps {
  node: NodeState;
  scenario: ScenarioType;
  disasterPhase?: number;
}

export const LiveStationCameraFeed: React.FC<LiveStationCameraFeedProps> = ({
  node,
  scenario,
  disasterPhase = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visionMode, setVisionMode] = useState<'OPTICAL' | 'THERMAL'>('OPTICAL');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Procedural real-time synthetic camera feed renderer
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const time = performance.now() * 0.001;

      // 1. Background Sky & Horizon based on Vision Mode & Weather
      if (visionMode === 'OPTICAL') {
        // Natural RGB Daylight
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
        if (scenario === 'FIRE' || scenario === 'COMPLETE_DEMO') {
          // Amber smoky haze
          skyGrad.addColorStop(0, '#78350f');
          skyGrad.addColorStop(1, '#b45309');
        } else if (scenario === 'FLOOD' || scenario === 'LANDSLIDE') {
          // Stormy overcast slate
          skyGrad.addColorStop(0, '#1e293b');
          skyGrad.addColorStop(1, '#475569');
        } else {
          // Clear alpine blue
          skyGrad.addColorStop(0, '#0284c7');
          skyGrad.addColorStop(1, '#7dd3fc');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.55);

        // Mountain silhouettes in background
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.55);
        ctx.lineTo(w * 0.25, h * 0.32);
        ctx.lineTo(w * 0.55, h * 0.48);
        ctx.lineTo(w * 0.85, h * 0.28);
        ctx.lineTo(w, h * 0.52);
        ctx.lineTo(w, h * 0.55);
        ctx.closePath();
        ctx.fill();

        // Foreground Terrain & Forest Floor
        const groundGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
        groundGrad.addColorStop(0, '#142c16');
        groundGrad.addColorStop(1, '#0b190c');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, h * 0.55, w, h * 0.45);

        // Pine Conifer trees along horizon
        ctx.fillStyle = '#0f2411';
        for (let i = 0; i < 12; i++) {
          const tx = (i * w) / 11;
          const ty = h * 0.52 + Math.sin(i * 1.5) * 8;
          ctx.beginPath();
          ctx.moveTo(tx, ty - 18);
          ctx.lineTo(tx + 9, ty);
          ctx.lineTo(tx - 9, ty);
          ctx.closePath();
          ctx.fill();
        }

        // River Channel View for River Valley nodes (Node 4, 5, 6)
        if (node.zone === 'RIVER_VALLEY') {
          ctx.fillStyle = scenario === 'FLOOD' ? '#0369a1' : '#0891b2';
          ctx.beginPath();
          ctx.moveTo(w * 0.25, h);
          ctx.lineTo(w * 0.42, h * 0.6);
          ctx.lineTo(w * 0.62, h * 0.6);
          ctx.lineTo(w * 0.78, h);
          ctx.closePath();
          ctx.fill();
        }

        // Rain streak effect during flood/landslide
        if (scenario === 'FLOOD' || scenario === 'LANDSLIDE') {
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
          ctx.lineWidth = 1;
          for (let r = 0; r < 35; r++) {
            const rx = (Math.sin(r * 99 + time * 5) * 0.5 + 0.5) * w;
            const ry = ((time * 120 + r * 15) % h);
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 3, ry + 12);
            ctx.stroke();
          }
        }
      } else {
        // FLIR Ironbow Thermal IR Mode
        // Gradient from dark purple (cold) -> orange -> bright yellow/white (hot)
        const thermGrad = ctx.createLinearGradient(0, 0, 0, h);
        thermGrad.addColorStop(0, '#1e1b4b'); // Deep purple (cold sky)
        thermGrad.addColorStop(0.55, '#3b0764');
        thermGrad.addColorStop(1, '#4c0519'); // Cool ground
        ctx.fillStyle = thermGrad;
        ctx.fillRect(0, 0, w, h);

        // Warm mountain ridges
        ctx.fillStyle = '#6b21a8';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.55);
        ctx.lineTo(w * 0.25, h * 0.32);
        ctx.lineTo(w * 0.55, h * 0.48);
        ctx.lineTo(w * 0.85, h * 0.28);
        ctx.lineTo(w, h * 0.52);
        ctx.lineTo(w, h * 0.55);
        ctx.closePath();
        ctx.fill();

        // Cool river ribbon in thermal
        if (node.zone === 'RIVER_VALLEY') {
          ctx.fillStyle = '#172554';
          ctx.beginPath();
          ctx.moveTo(w * 0.25, h);
          ctx.lineTo(w * 0.42, h * 0.6);
          ctx.lineTo(w * 0.62, h * 0.6);
          ctx.lineTo(w * 0.78, h);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 2. Disaster-Specific Visual Anomalies in Camera View
      if ((scenario === 'FIRE' || scenario === 'COMPLETE_DEMO') && (node.id === 1 || node.id === 2 || node.id === 3)) {
        // Wildfire plume in field of view
        const fireCenterX = w * 0.48 + Math.sin(time * 2) * 4;
        const fireCenterY = h * 0.48;

        if (visionMode === 'OPTICAL') {
          // Billowing smoke column
          ctx.fillStyle = 'rgba(55, 65, 81, 0.75)';
          for (let s = 0; s < 6; s++) {
            const sx = fireCenterX + Math.sin(time + s) * 12;
            const sy = fireCenterY - s * 14;
            ctx.beginPath();
            ctx.arc(sx, sy, 12 + s * 6, 0, Math.PI * 2);
            ctx.fill();
          }
          // Glowing orange flame base
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(fireCenterX, fireCenterY, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(fireCenterX, fireCenterY, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Intense FLIR White-Hot Thermal Hotspot (420°C)
          const heatRad = 28 + Math.sin(time * 6) * 4;
          const heatGrad = ctx.createRadialGradient(fireCenterX, fireCenterY, 2, fireCenterX, fireCenterY, heatRad);
          heatGrad.addColorStop(0, '#ffffff'); // White hot core
          heatGrad.addColorStop(0.35, '#fef08a'); // Yellow
          heatGrad.addColorStop(0.7, '#ea580c'); // Red orange
          heatGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = heatGrad;
          ctx.beginPath();
          ctx.arc(fireCenterX, fireCenterY, heatRad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Edge Vision AI Bounding Box for Fire
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(fireCenterX - 35, fireCenterY - 60, 70, 80);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(fireCenterX - 35, fireCenterY - 76, 70, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('FIRE: 98.4%', fireCenterX - 32, fireCenterY - 64);
      }

      if (scenario === 'FLOOD' && (node.zone === 'RIVER_VALLEY' || node.id === 4 || node.id === 5)) {
        // High river inundation waterline marker in camera view
        const waterLineY = h * (0.82 - (disasterPhase >= 4 ? 0.22 : 0.08));
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(w * 0.1, waterLineY);
        ctx.lineTo(w * 0.9, waterLineY);
        ctx.stroke();
        ctx.setLineDash([]);

        // AI Bounding Box for River Gauge
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(w * 0.35, waterLineY - 30, 95, 45);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(w * 0.35, waterLineY - 45, 95, 15);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('STAGE: CRITICAL 3.4m', w * 0.37, waterLineY - 34);
      }

      if (scenario === 'LANDSLIDE' && (node.id === 1 || node.id === 2)) {
        // Scarp shear scar & rolling debris
        const slideX = w * 0.38;
        const slideY = h * 0.52;
        ctx.fillStyle = visionMode === 'OPTICAL' ? '#452b17' : '#eab308';
        ctx.beginPath();
        ctx.ellipse(slideX, slideY + 12, 35, 18, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // AI Bounding Box for Slope Displacement
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(slideX - 42, slideY - 12, 85, 45);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(slideX - 42, slideY - 26, 85, 14);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('SHEAR: 18.2 cm/s', slideX - 40, slideY - 16);
      }

      // 3. Surveillance OSD Reticle & Telemetry Overlay
      // Center Crosshairs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 12, h / 2); ctx.lineTo(w / 2 + 12, h / 2);
      ctx.moveTo(w / 2, h / 2 - 12); ctx.lineTo(w / 2, h / 2 + 12);
      ctx.stroke();

      // Corner Brackets
      const cL = 12;
      ctx.beginPath();
      // Top-Left
      ctx.moveTo(10, 10 + cL); ctx.lineTo(10, 10); ctx.lineTo(10 + cL, 10);
      // Top-Right
      ctx.moveTo(w - 10 - cL, 10); ctx.lineTo(w - 10, 10); ctx.lineTo(w - 10, 10 + cL);
      // Bottom-Left
      ctx.moveTo(10, h - 10 - cL); ctx.lineTo(10, h - 10); ctx.lineTo(10 + cL, h - 10);
      // Bottom-Right
      ctx.moveTo(w - 10 - cL, h - 10); ctx.lineTo(w - 10, h - 10); ctx.lineTo(w - 10, h - 10 - cL);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [node, scenario, disasterPhase, visionMode]);

  return (
    <div className="bg-[#060a12] border-2 border-slate-700 rounded-lg overflow-hidden shadow-xl text-xs font-mono">
      {/* Top Feed Header & OSD Bar */}
      <div className="bg-slate-900 px-2.5 py-1.5 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-white font-bold text-[11px] tracking-wider uppercase">
            CAM N{node.id} // {visionMode}
          </span>
          <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.2 rounded border border-slate-700">
            30 FPS
          </span>
        </div>

        {/* Optical vs Thermal Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px]">
          <button
            onClick={() => setVisionMode('OPTICAL')}
            className={`px-2 py-0.5 rounded font-bold transition-all ${
              visionMode === 'OPTICAL'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            RGB
          </button>
          <button
            onClick={() => setVisionMode('THERMAL')}
            className={`px-2 py-0.5 rounded font-bold transition-all ${
              visionMode === 'THERMAL'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            FLIR IR
          </button>
        </div>
      </div>

      {/* Synthetic Live Video Feed Canvas */}
      <div className="relative aspect-video bg-black w-full overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={360} 
          height={202} 
          className="w-full h-full object-cover"
        />

        {/* Real-time OSD Telemetry Stamps */}
        <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-300 drop-shadow-md bg-black/40 px-1 rounded">
          {currentTime || '2026-09-23 13:45:00 UTC'}
        </div>

        <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-300 drop-shadow-md bg-black/40 px-1 rounded">
          AZ: 218° | EL: -11° | FOV: 72°
        </div>

        <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[9px] font-mono text-emerald-400 bg-black/50 px-1.5 py-0.5 rounded border border-emerald-900/60">
          <span>BATT: {node.health.batteryLevel}%</span>
          <span>•</span>
          <span>SOLAR: {(node.health.batteryLevel * 0.05).toFixed(1)}W</span>
        </div>

        {node.aiResult.status === 'CRITICAL' && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-red-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded animate-bounce">
            <ShieldAlert className="w-3 h-3" />
            AI ALERT TRIGGERED
          </div>
        )}
      </div>

      {/* Camera Vision Specs Footer */}
      <div className="px-2.5 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[10px] text-slate-300 flex items-center justify-between">
        <span className="text-slate-400">Sensor: Sony IMX477 12MP + MLX90640 IR</span>
        <span className="text-cyan-400 font-bold">Edge AI: YOLO-v8n-Tiny</span>
      </div>
    </div>
  );
};
