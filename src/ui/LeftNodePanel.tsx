import React from 'react';
import { 
  Battery, 
  BatteryCharging, 
  Cpu, 
  Crown, 
  Flame, 
  Droplets, 
  Mountain, 
  Wind, 
  AlertCircle,
  CheckCircle2,
  Signal
} from 'lucide-react';
import { NodeState } from '../types';

interface LeftNodePanelProps {
  nodes: NodeState[];
  selectedNodeId: number | null;
  currentMasterId: number;
  onSelectNode: (id: number) => void;
}

export const LeftNodePanel: React.FC<LeftNodePanelProps> = ({
  nodes,
  selectedNodeId,
  currentMasterId,
  onSelectNode
}) => {
  const getStatusBadge = (node: NodeState) => {
    if (!node.isAlive) {
      return (
        <span className="bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
          FAILED
        </span>
      );
    }
    switch (node.aiResult.status) {
      case 'CRITICAL':
        return (
          <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold animate-pulse">
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
            WARNING
          </span>
        );
      case 'WATCH':
        return (
          <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
            WATCH
          </span>
        );
      case 'NORMAL':
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
            NORMAL
          </span>
        );
    }
  };

  const getPrimaryHazardIcon = (node: NodeState) => {
    switch (node.aiResult.primaryHazard) {
      case 'FIRE':
        return <Flame className="w-3.5 h-3.5 text-red-400" />;
      case 'FLOOD':
        return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
      case 'LANDSLIDE':
        return <Mountain className="w-3.5 h-3.5 text-amber-400" />;
      case 'POLLUTION':
        return <Wind className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <aside className="w-80 h-full bg-[#0c121e]/90 backdrop-blur-md border-r border-slate-800/80 flex flex-col z-10 select-none shadow-xl">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Node Fleet Telemetry
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
          {nodes.filter(n => n.isAlive).length} / {nodes.length} ONLINE
        </span>
      </div>

      {/* Node Cards Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {nodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          const isMaster = node.id === currentMasterId;

          return (
            <div
              key={`node-card-${node.id}`}
              onClick={() => onSelectNode(node.id)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-400/40 shadow-md shadow-cyan-900/20'
                  : isMaster
                  ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400/60'
                  : !node.isAlive
                  ? 'bg-slate-900/40 border-slate-800 opacity-50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              {/* Row 1: ID, Master Badge, Status Pill */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-xs text-slate-200">
                    N{node.id}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                    {node.name.replace(/N\d+/, '').trim()}
                  </span>
                  {isMaster && (
                    <span className="flex items-center gap-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold uppercase">
                      <Crown className="w-2.5 h-2.5 text-amber-400" />
                      MASTER
                    </span>
                  )}
                </div>
                {getStatusBadge(node)}
              </div>

              {/* Row 2: Health Meter & Battery Meter */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono my-1.5">
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Health</span>
                    <span className={node.health.overallScore < 40 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                      {node.health.overallScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        node.health.overallScore > 70 
                          ? 'bg-emerald-500' 
                          : node.health.overallScore > 40 
                          ? 'bg-amber-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${node.health.overallScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Battery</span>
                    <span className={node.health.batteryLevel < 25 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                      {node.health.batteryLevel}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        node.health.batteryLevel > 50 
                          ? 'bg-cyan-500' 
                          : node.health.batteryLevel > 25 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${node.health.batteryLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Edge AI Threat Probabilities */}
              <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1">
                  {getPrimaryHazardIcon(node)}
                  <span className="text-slate-400">
                    {node.aiResult.primaryHazard === 'NONE' ? 'Nominal' : node.aiResult.primaryHazard}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <span>
                    Sev: <strong className={node.aiResult.severity > 60 ? 'text-red-400' : 'text-slate-200'}>
                      {node.aiResult.severity}%
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Next: <strong className="text-cyan-400">{node.nextHop === 0 ? 'GW' : node.nextHop ? `N${node.nextHop}` : '—'}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
