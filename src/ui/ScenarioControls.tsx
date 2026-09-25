import { 
  Flame, 
  Droplets, 
  Mountain, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRightLeft, 
  Skull, 
  Zap,
  Crown
} from 'lucide-react';
import { ScenarioType, NodeState } from '../types';

interface ScenarioControlsProps {
  currentScenario: ScenarioType;
  onSelectScenario: (scenario: ScenarioType) => void;
  onTriggerHandover: () => void;
  onKillMaster: () => void;
  onReset: () => void;
  isDemoRunning: boolean;
  nodes?: NodeState[];
  currentMasterId?: number;
  onSelectMaster?: (nodeId: number) => void;
}

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  currentScenario,
  onSelectScenario,
  onTriggerHandover,
  onKillMaster,
  onReset,
  isDemoRunning,
  nodes,
  currentMasterId,
  onSelectMaster
}) => {
  return (
    <div className="bg-[#0c1322]/90 border border-slate-800/80 p-2 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
      {/* 3 Core Disaster Scenarios */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-slate-400 font-medium px-2 py-1 uppercase tracking-wider">
          Scenarios:
        </span>

        {/* Normal */}
        <button
          onClick={() => onSelectScenario('NORMAL')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all border ${
            currentScenario === 'NORMAL' && !isDemoRunning
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
              : 'bg-slate-800/40 text-slate-300 border-slate-700/40 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Normal Baseline</span>
        </button>

        {/* 1. Forest Fire */}
        <button
          onClick={() => onSelectScenario('FIRE')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all border ${
            currentScenario === 'FIRE'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
              : 'bg-slate-800/40 text-slate-300 border-slate-700/40 hover:bg-slate-800 hover:text-rose-300'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>1. Forest Fire</span>
        </button>

        {/* 2. Flood */}
        <button
          onClick={() => onSelectScenario('FLOOD')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all border ${
            currentScenario === 'FLOOD'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
              : 'bg-slate-800/40 text-slate-300 border-slate-700/40 hover:bg-slate-800 hover:text-sky-300'
          }`}
        >
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          <span>2. Flash Flood</span>
        </button>

        {/* 3. Landslide */}
        <button
          onClick={() => onSelectScenario('LANDSLIDE')}
          disabled={isDemoRunning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all border ${
            currentScenario === 'LANDSLIDE'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'bg-slate-800/40 text-slate-300 border-slate-700/40 hover:bg-slate-800 hover:text-amber-300'
          }`}
        >
          <Mountain className="w-3.5 h-3.5 text-amber-400" />
          <span>3. Landslide</span>
        </button>
      </div>

      {/* Network Handover, Kill, Reset, Demo */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Master Node Selection Dropdown */}
        {nodes && currentMasterId !== undefined && onSelectMaster && (
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider whitespace-nowrap">
              Master:
            </span>
            <select
              value={currentMasterId}
              onChange={(e) => onSelectMaster(Number(e.target.value))}
              disabled={isDemoRunning}
              title="Choose active Master Node for mesh coordination"
              className="bg-[#0b1120] border border-amber-500/40 text-amber-200 text-xs font-mono font-medium rounded px-2 py-0.5 outline-none cursor-pointer hover:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            >
              {nodes.map(n => (
                <option 
                  key={`master-opt-${n.id}`} 
                  value={n.id} 
                  disabled={!n.isAlive} 
                  className="bg-[#0b1120] text-slate-100 py-1"
                >
                  Node {n.id} {n.isAlive ? '' : '(Offline)'} — {n.name.replace(/N\d+/, '').replace(/\(Master\)/, '').trim()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Trigger Handover */}
        <button
          onClick={onTriggerHandover}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 shadow-sm"
          title="Simulate thermal warning and graceful master handover"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Master Handover</span>
        </button>

        {/* Kill Master */}
        <button
          onClick={onKillMaster}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 active:scale-95 shadow-sm"
          title="Abruptly power off current master to test sudden failure recovery"
        >
          <Skull className="w-3.5 h-3.5 text-rose-400" />
          <span>Kill Master</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all bg-slate-800/40 text-slate-300 border border-slate-700/40 hover:bg-slate-800 hover:text-white active:scale-95 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset</span>
        </button>

        {/* Complete Demo */}
        <button
          onClick={() => onSelectScenario('COMPLETE_DEMO')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all border ${
            isDemoRunning
              ? 'bg-purple-600/90 text-white border-purple-400 shadow-md ring-1 ring-purple-400/50 animate-pulse'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/40 hover:from-purple-500 hover:to-indigo-500 shadow-sm'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>{isDemoRunning ? 'Demo Active...' : 'Complete Demo (2 Min)'}</span>
        </button>
      </div>
    </div>
  );
};
