import React from 'react';
import { 
  Flame, 
  Droplets, 
  Mountain, 
  Wind, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRightLeft, 
  Skull, 
  Play, 
  Zap 
} from 'lucide-react';
import { ScenarioType } from '../types';

interface ScenarioControlsProps {
  currentScenario: ScenarioType;
  onSelectScenario: (scenario: ScenarioType) => void;
  onTriggerHandover: () => void;
  onKillMaster: () => void;
  onReset: () => void;
  isDemoRunning: boolean;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  currentScenario,
  onSelectScenario,
  onTriggerHandover,
  onKillMaster,
  onReset,
  isDemoRunning
}) => {
  return (
    <div className="bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
      {/* Left: Disaster Scenarios */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-slate-400 font-semibold px-2 uppercase tracking-wider">
          Scenarios:
        </span>

        {/* Normal */}
        <button
          onClick={() => onSelectScenario('NORMAL')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
            currentScenario === 'NORMAL' && !isDemoRunning
              ? 'bg-emerald-600/90 text-white border-emerald-400 shadow-md shadow-emerald-600/20'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Normal
        </button>

        {/* Forest Fire */}
        <button
          onClick={() => onSelectScenario('FIRE')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
            currentScenario === 'FIRE'
              ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/30 ring-1 ring-red-400/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-red-300'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-red-400" />
          Fire
        </button>

        {/* Flood */}
        <button
          onClick={() => onSelectScenario('FLOOD')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
            currentScenario === 'FLOOD'
              ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-cyan-300'
          }`}
        >
          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          Flood
        </button>

        {/* Landslide */}
        <button
          onClick={() => onSelectScenario('LANDSLIDE')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
            currentScenario === 'LANDSLIDE'
              ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30 ring-1 ring-amber-400/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-amber-300'
          }`}
        >
          <Mountain className="w-3.5 h-3.5 text-amber-400" />
          Landslide
        </button>

        {/* Pollution */}
        <button
          onClick={() => onSelectScenario('POLLUTION')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all border ${
            currentScenario === 'POLLUTION'
              ? 'bg-yellow-600 text-white border-yellow-400 shadow-md shadow-yellow-600/30 ring-1 ring-yellow-400/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-yellow-300'
          }`}
        >
          <Wind className="w-3.5 h-3.5 text-yellow-400" />
          Pollution
        </button>
      </div>

      {/* Middle & Right: Handover, Kill, Reset, Complete Demo */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Trigger Handover */}
        <button
          onClick={onTriggerHandover}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all bg-amber-950/60 text-amber-300 border border-amber-500/50 hover:bg-amber-900/60 active:scale-95"
          title="Simulate thermal warning and graceful master handover"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
          Master Handover
        </button>

        {/* Kill Master */}
        <button
          onClick={onKillMaster}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all bg-red-950/60 text-red-300 border border-red-500/50 hover:bg-red-900/60 active:scale-95"
          title="Abruptly power off current master to test sudden failure recovery"
        >
          <Skull className="w-3.5 h-3.5 text-red-400" />
          Kill Master
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          Reset
        </button>

        {/* COMPLETE DEMO BUTTON */}
        <button
          onClick={() => onSelectScenario('COMPLETE_DEMO')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold transition-all border ${
            isDemoRunning
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 ring-2 ring-purple-400/50 animate-pulse'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/30'
          }`}
        >
          <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
          <span>{isDemoRunning ? 'DEMO RUNNING...' : 'COMPLETE DEMO (2 MIN)'}</span>
        </button>
      </div>
    </div>
  );
};
