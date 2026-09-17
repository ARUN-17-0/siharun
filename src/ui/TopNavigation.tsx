import React from 'react';
import { 
  Radio, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  TowerControl, 
  Layers,
  Crown
} from 'lucide-react';
import { NetworkState } from '../types';

interface TopNavigationProps {
  network: NetworkState;
  onCameraPreset: (preset: 'ISOMETRIC' | 'TOP_DOWN' | 'GATEWAY_POV') => void;
  activeCamera: 'ISOMETRIC' | 'TOP_DOWN' | 'GATEWAY_POV';
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  network,
  onCameraPreset,
  activeCamera
}) => {
  const getScenarioBadge = () => {
    switch (network.scenario) {
      case 'NORMAL':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-semibold">BASELINE NOMINAL</span>;
      case 'FIRE':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-xs font-semibold animate-pulse">FOREST FIRE ACTIVE</span>;
      case 'FLOOD':
        return <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded text-xs font-semibold animate-pulse">FLASH FLOOD ACTIVE</span>;
      case 'LANDSLIDE':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-xs font-semibold animate-pulse">LANDSLIDE RISK</span>;
      case 'POLLUTION':
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-xs font-semibold animate-pulse">AIR INVERSION</span>;
      case 'COMPLETE_DEMO':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-xs font-semibold animate-pulse">COMPLETE DEMO ACTIVE</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs">{network.scenario}</span>;
    }
  };

  return (
    <header className="h-16 bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-20 shadow-md">
      {/* Title & SIH Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
          <Radio className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-cyan-950 text-cyan-300 border border-cyan-700/50 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
              SIH 2026
            </span>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">
              Resilient AI Environmental Monitoring Network
            </h1>
            {getScenarioBadge()}
          </div>
          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <span>ESP32-S3 Edge AI</span>
            <span>•</span>
            <span>443MHz LoRa Dynamic Mesh</span>
            <span>•</span>
            <span>Self-Healing Master Election</span>
          </p>
        </div>
      </div>

      {/* Network Telemetry Badges */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {/* Active Nodes */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-md">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Mesh Nodes</div>
            <div className="text-slate-200 font-bold">{network.totalActiveNodes} / 10 Active</div>
          </div>
        </div>

        {/* Current Master */}
        <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-500/40 px-3 py-1.5 rounded-md shadow-sm">
          <Crown className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-amber-500/80 uppercase font-semibold">Regional Master</div>
            <div className="text-amber-300 font-bold flex items-center gap-1">
              Node {network.currentMasterId}
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </div>
          </div>
        </div>

        {/* Gateway Status */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-md">
          <TowerControl className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Village Gateway</div>
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              {network.gatewayOnline ? 'ONLINE' : 'OFFLINE'}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>

        {/* Camera Preset Buttons */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-md text-[11px]">
          <button
            onClick={() => onCameraPreset('ISOMETRIC')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeCamera === 'ISOMETRIC' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Isometric
          </button>
          <button
            onClick={() => onCameraPreset('TOP_DOWN')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeCamera === 'TOP_DOWN' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Top-Down
          </button>
          <button
            onClick={() => onCameraPreset('GATEWAY_POV')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeCamera === 'GATEWAY_POV' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gateway POV
          </button>
        </div>
      </div>
    </header>
  );
};
