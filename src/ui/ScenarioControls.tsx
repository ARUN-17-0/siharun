import React from 'react';
import { 
  Flame, 
  Droplets, 
  Mountain, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRightLeft, 
  Skull, 
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
    <div className="bg-[#0c121e] border-2 border-slate-700 p-2.5 rounded-lg shadow-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
      {/* 3 Core Disaster Scenarios */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-slate-300 font-black px-2 uppercase tracking-wider bg-slate-900 border border-slate-700 py-1 rounded">
          DISASTER CONTROLS:
        </span>

        {/* Normal */}
        <button
          onClick={() => onSelectScenario('NORMAL')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-black transition-all border-2 ${
            currentScenario === 'NORMAL' && !isDemoRunning
              ? 'bg-emerald-600 text-white border-emerald-300 shadow-lg shadow-emerald-700/40'
              : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Normal Baseline
        </button>

        {/* 1. Forest Fire */}
        <button
          onClick={() => onSelectScenario('FIRE')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-black transition-all border-2 ${
            currentScenario === 'FIRE'
              ? 'bg-red-600 text-white border-red-300 shadow-lg shadow-red-700/50 ring-2 ring-red-400'
              : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-red-300'
          }`}
        >
          <Flame className="w-4 h-4 text-red-400" />
          1. Forest Fire
        </button>

        {/* 2. Flood */}
        <button
          onClick={() => onSelectScenario('FLOOD')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-black transition-all border-2 ${
            currentScenario === 'FLOOD'
              ? 'bg-blue-600 text-white border-cyan-300 shadow-lg shadow-blue-700/50 ring-2 ring-cyan-400'
              : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-cyan-300'
          }`}
        >
          <Droplets className="w-4 h-4 text-cyan-400" />
          2. Flash Flood
        </button>

        {/* 3. Landslide */}
        <button
          onClick={() => onSelectScenario('LANDSLIDE')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-black transition-all border-2 ${
            currentScenario === 'LANDSLIDE'
              ? 'bg-amber-600 text-white border-amber-300 shadow-lg shadow-amber-700/50 ring-2 ring-amber-400'
              : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-amber-300'
          }`}
        >
          <Mountain className="w-4 h-4 text-amber-400" />
          3. Landslide
        </button>
      </div>

      {/* Network Handover, Kill, Reset, Demo */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Trigger Handover */}
        <button
          onClick={onTriggerHandover}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all bg-amber-950 text-amber-200 border-2 border-amber-500 hover:bg-amber-900 hover:text-white active:scale-95 shadow-md"
          title="Simulate thermal warning and graceful master handover"
        >
          <ArrowRightLeft className="w-4 h-4 text-amber-400" />
          Master Handover
        </button>

        {/* Kill Master */}
        <button
          onClick={onKillMaster}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all bg-red-950 text-red-200 border-2 border-red-500 hover:bg-red-900 hover:text-white active:scale-95 shadow-md"
          title="Abruptly power off current master to test sudden failure recovery"
        >
          <Skull className="w-4 h-4 text-red-400" />
          Kill Master
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all bg-slate-900 text-slate-200 border-2 border-slate-700 hover:bg-slate-800 hover:text-white active:scale-95 shadow-md"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          Reset
        </button>

        {/* Complete Demo */}
        <button
          onClick={() => onSelectScenario('COMPLETE_DEMO')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded font-black transition-all border-2 ${
            isDemoRunning
              ? 'bg-purple-600 text-white border-purple-300 shadow-xl shadow-purple-600/50 ring-2 ring-purple-300 animate-pulse'
              : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white border-purple-400 hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-900/40'
          }`}
        >
          <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
          <span>{isDemoRunning ? 'DEMO IN PROGRESS...' : 'COMPLETE DEMO (2 MIN)'}</span>
        </button>
      </div>
    </div>
  );
};
