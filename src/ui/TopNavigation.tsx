import React from 'react';
import { 
  Radio, 
  Cpu, 
  TowerControl, 
  Crown,
  ShieldCheck,
  AlertTriangle,
  Users,
  Compass
} from 'lucide-react';
import { NetworkState } from '../types';

interface TopNavigationProps {
  network: NetworkState;
  onCameraPreset: (preset: 'ISOMETRIC' | 'TOP_DOWN' | 'GATEWAY_POV' | 'STATION_POV') => void;
  activeCamera: 'ISOMETRIC' | 'TOP_DOWN' | 'GATEWAY_POV' | 'STATION_POV';
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  network,
  onCameraPreset,
  activeCamera
}) => {

  const getScenarioBadge = () => {
    switch (network.scenario) {
      case 'NORMAL':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide">Baseline Nominal</span>;
      case 'FIRE':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide animate-pulse">Forest Fire Active</span>;
      case 'FLOOD':
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide animate-pulse">Flash Flood Active</span>;
      case 'LANDSLIDE':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide animate-pulse">Landslide Active</span>;
      case 'COMPLETE_DEMO':
        return <span className="bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide animate-pulse">Complete Demo Active</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-xs font-medium">{network.scenario}</span>;
    }
  };

  const getEvacuationBadge = () => {
    switch (network.evacuationState) {
      case 'STANDBY':
        return (
          <div className="flex items-center gap-1.5 bg-slate-800/40 border border-slate-700/40 px-2.5 py-1 rounded-md text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Village: <strong className="text-emerald-400 font-medium">Secure</strong></span>
          </div>
        );
      case 'WARNING_ISSUED':
        return (
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 px-2.5 py-1 rounded-md text-xs text-amber-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Early Warning: <strong className="text-amber-200 font-medium">Alert Dispatched</strong></span>
          </div>
        );
      case 'EVACUATING':
        return (
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/40 px-2.5 py-1 rounded-md text-xs text-rose-300 animate-pulse">
            <Users className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            <span>Evacuating: <strong className="text-amber-300 font-medium font-mono">{(network.evacuationProgress * 100).toFixed(0)}%</strong></span>
          </div>
        );
      case 'EVACUATED_SAFE':
        return (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md text-xs text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Village Status: <strong className="text-emerald-200 font-medium">Evacuated to High Ground</strong></span>
          </div>
        );
    }
  };

  return (
    <header className="h-16 bg-[#0c1322]/95 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-20 shadow-lg">
      {/* Title & SIH Badge */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Radio className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/25 text-[10px] font-mono font-medium px-1.5 py-0.2 rounded">
              SIH 2026
            </span>
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
              Resilient Environmental Monitoring Network
            </h1>
            {getScenarioBadge()}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span className="text-sky-400 font-medium">10 ESP32-S3 Nodes</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">443MHz LoRa Mesh</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{network.phaseNarration}</span>
          </p>
        </div>
      </div>

      {/* Network Telemetry Badges */}
      <div className="flex items-center gap-3 text-xs">
        {/* Village Evacuation Monitor */}
        {getEvacuationBadge()}


        {/* Active Nodes */}
        <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/40 px-3 py-1.5 rounded-md">
          <Cpu className="w-4 h-4 text-sky-400" />
          <div>
            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Mesh Nodes</div>
            <div className="text-slate-200 font-semibold font-mono">{network.totalActiveNodes} / 10 Online</div>
          </div>
        </div>

        {/* Master Node */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-md">
          <Crown className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[9px] text-amber-400 font-medium uppercase tracking-wider">Master Node</div>
            <div className="text-amber-200 font-semibold flex items-center gap-1">
              Node {network.currentMasterId}
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </div>
          </div>
        </div>

        {/* Gateway Status */}
        <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/40 px-3 py-1.5 rounded-md">
          <TowerControl className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Village Gateway</div>
            <div className="text-emerald-400 font-semibold flex items-center gap-1">
              {network.gatewayOnline ? 'CONNECTED' : 'OFFLINE'}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>

        {/* Camera Preset Buttons (3D Twin, Station POV, GIS Topo Map) */}
        <div className="flex items-center bg-slate-800/50 border border-slate-700/50 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => {
              if (activeCamera === 'ISOMETRIC') {
                onCameraPreset('RESET' as any);
                setTimeout(() => onCameraPreset('ISOMETRIC'), 50);
              } else {
                onCameraPreset('ISOMETRIC');
              }
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeCamera === 'ISOMETRIC' ? 'bg-sky-600 text-white font-semibold shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
            title="Free Orbit 3D Digital Twin (Click to reset view)"
          >
            3D Twin
          </button>
          <button
            onClick={() => onCameraPreset('STATION_POV')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeCamera === 'STATION_POV' ? 'bg-sky-600 text-white font-semibold shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Station POV
          </button>
          <button
            onClick={() => onCameraPreset('TOP_DOWN')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeCamera === 'TOP_DOWN' ? 'bg-sky-600 text-white font-semibold shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            GIS Topo
          </button>
        </div>
      </div>
    </header>
  );
};
