import React from 'react';
import { 
  Radio, 
  Cpu, 
  TowerControl, 
  Crown,
  ShieldCheck,
  AlertTriangle,
  Users
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
        return <span className="bg-emerald-950 text-emerald-300 border-2 border-emerald-500 px-2.5 py-0.5 rounded text-xs font-black tracking-wide">BASELINE NOMINAL</span>;
      case 'FIRE':
        return <span className="bg-red-950 text-red-300 border-2 border-red-500 px-2.5 py-0.5 rounded text-xs font-black tracking-wide animate-pulse">FOREST FIRE ACTIVE</span>;
      case 'FLOOD':
        return <span className="bg-blue-950 text-cyan-300 border-2 border-cyan-400 px-2.5 py-0.5 rounded text-xs font-black tracking-wide animate-pulse">FLASH FLOOD ACTIVE</span>;
      case 'LANDSLIDE':
        return <span className="bg-amber-950 text-amber-300 border-2 border-amber-500 px-2.5 py-0.5 rounded text-xs font-black tracking-wide animate-pulse">LANDSLIDE ACTIVE</span>;
      case 'COMPLETE_DEMO':
        return <span className="bg-purple-950 text-purple-200 border-2 border-purple-400 px-2.5 py-0.5 rounded text-xs font-black tracking-wide animate-pulse">COMPLETE DEMO ACTIVE</span>;
      default:
        return <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-xs font-bold">{network.scenario}</span>;
    }
  };

  const getEvacuationBadge = () => {
    switch (network.evacuationState) {
      case 'STANDBY':
        return (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-xs font-mono text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Village: <strong className="text-emerald-400">Secure</strong></span>
          </div>
        );
      case 'WARNING_ISSUED':
        return (
          <div className="flex items-center gap-1.5 bg-amber-950/80 border-2 border-amber-500 px-2.5 py-1 rounded text-xs font-mono text-amber-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Siren Active: <strong className="text-amber-200">Warning Dispatched</strong></span>
          </div>
        );
      case 'EVACUATING':
        return (
          <div className="flex items-center gap-1.5 bg-red-950/90 border-2 border-red-500 px-2.5 py-1 rounded text-xs font-mono text-red-200 animate-pulse">
            <Users className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            <span>Evacuating: <strong className="text-yellow-300">{(network.evacuationProgress * 100).toFixed(0)}%</strong></span>
          </div>
        );
      case 'EVACUATED_SAFE':
        return (
          <div className="flex items-center gap-1.5 bg-emerald-950/90 border-2 border-emerald-400 px-2.5 py-1 rounded text-xs font-mono text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Village Status: <strong className="text-emerald-200">Evacuated to High Ground</strong></span>
          </div>
        );
    }
  };

  return (
    <header className="h-16 bg-[#070b14] border-b-2 border-slate-700/80 px-4 flex items-center justify-between z-20 shadow-xl">
      {/* Title & SIH Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-700 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-900/40">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-cyan-950 text-cyan-300 border border-cyan-500 text-[10px] font-mono font-black px-1.5 py-0.2 rounded uppercase">
              SIH 2026
            </span>
            <h1 className="text-sm font-black text-white tracking-wide font-mono">
              Resilient Environmental Monitoring Network
            </h1>
            {getScenarioBadge()}
          </div>
          <p className="text-[11px] text-slate-300 font-mono flex items-center gap-2 mt-0.5">
            <span className="text-cyan-400 font-bold">10 ESP32-S3 Nodes</span>
            <span>|</span>
            <span className="text-emerald-400 font-bold">443MHz LoRa Mesh</span>
            <span>|</span>
            <span className="text-slate-300">{network.phaseNarration}</span>
          </p>
        </div>
      </div>

      {/* Network Telemetry Badges */}
      <div className="flex items-center gap-3 text-xs font-mono">
        {/* Village Evacuation Monitor */}
        {getEvacuationBadge()}

        {/* Active Nodes */}
        <div className="flex items-center gap-2 bg-slate-900 border-2 border-slate-700 px-3 py-1.5 rounded-md">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase">Mesh Nodes</div>
            <div className="text-white font-black">{network.totalActiveNodes} / 10 Online</div>
          </div>
        </div>

        {/* Master Node */}
        <div className="flex items-center gap-2 bg-amber-950/50 border-2 border-amber-500 px-3 py-1.5 rounded-md">
          <Crown className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[9px] text-amber-400 font-extrabold uppercase">Master Node</div>
            <div className="text-amber-200 font-black flex items-center gap-1">
              Node {network.currentMasterId}
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
          </div>
        </div>

        {/* Gateway Status */}
        <div className="flex items-center gap-2 bg-slate-900 border-2 border-slate-700 px-3 py-1.5 rounded-md">
          <TowerControl className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase">Village Gateway</div>
            <div className="text-emerald-400 font-black flex items-center gap-1">
              {network.gatewayOnline ? 'CONNECTED' : 'OFFLINE'}
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>

        {/* Camera Preset Buttons */}
        <div className="flex items-center bg-slate-900 border-2 border-slate-700 p-0.5 rounded-md text-[11px]">
          <button
            onClick={() => onCameraPreset('ISOMETRIC')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeCamera === 'ISOMETRIC' ? 'bg-cyan-600 text-white font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            Isometric
          </button>
          <button
            onClick={() => onCameraPreset('TOP_DOWN')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeCamera === 'TOP_DOWN' ? 'bg-cyan-600 text-white font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            Top-Down
          </button>
          <button
            onClick={() => onCameraPreset('GATEWAY_POV')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeCamera === 'GATEWAY_POV' ? 'bg-cyan-600 text-white font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            Gateway POV
          </button>
        </div>
      </div>
    </header>
  );
};
