import React from 'react';
import { 
  Battery, 
  Cpu, 
  Crown, 
  Flame, 
  Droplets, 
  Mountain, 
  CheckCircle2,
  Radio
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
        <span className="bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
          Offline
        </span>
      );
    }
    switch (node.aiResult.status) {
      case 'CRITICAL':
        return (
          <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px] font-medium animate-pulse">
            Critical
          </span>
        );
      case 'WARNING':
        return (
          <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-medium">
            Warning
          </span>
        );
      case 'WATCH':
        return (
          <span className="bg-sky-500/15 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded text-[10px] font-medium">
            Watch
          </span>
        );
      case 'NORMAL':
        return (
          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-medium">
            Normal
          </span>
        );
    }
  };

  const getHazardIcon = (node: NodeState) => {
    switch (node.aiResult.primaryHazard) {
      case 'FIRE':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'FLOOD':
        return <Droplets className="w-3.5 h-3.5 text-sky-400" />;
      case 'LANDSLIDE':
        return <Mountain className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <aside className="w-80 h-full bg-[#0c1322]/95 backdrop-blur-md border-r border-slate-800 flex flex-col z-10 select-none shadow-lg font-sans">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Sensor Fleet Status
          </h2>
        </div>
        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          {nodes.filter(n => n.isAlive).length} / {nodes.length} Online
        </span>
      </div>

      {/* Node Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {nodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          const isMaster = node.id === currentMasterId;

          return (
            <div
              key={`node-card-${node.id}`}
              onClick={() => onSelectNode(node.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-500/10 border-sky-500/50 shadow-sm ring-1 ring-sky-500/30'
                  : isMaster
                  ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                  : !node.isAlive
                  ? 'bg-slate-900/40 border-slate-800/40 opacity-50'
                  : 'bg-slate-800/30 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700/60'
              }`}
            >
              {/* Row 1: ID, Master Badge, Status Pill */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-xs text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60">
                    N{node.id}
                  </span>
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[110px]">
                    {node.name.replace(/N\d+/, '').trim()}
                  </span>
                  {isMaster && (
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded text-[9px] font-medium uppercase">
                      <Crown className="w-2.5 h-2.5 text-amber-400" />
                      MASTER
                    </span>
                  )}
                </div>
                {getStatusBadge(node)}
              </div>

              {/* Row 2: Health & Battery Gauges */}
              <div className="grid grid-cols-2 gap-2 text-[10px] my-1.5">
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5 font-medium">
                    <span>Health</span>
                    <span className={`font-mono ${node.health.overallScore < 40 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {node.health.overallScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        node.health.overallScore > 70 
                          ? 'bg-emerald-400' 
                          : node.health.overallScore > 40 
                          ? 'bg-amber-400' 
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${node.health.overallScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5 font-medium">
                    <span>Battery</span>
                    <span className={`font-mono ${node.health.batteryLevel < 25 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {node.health.batteryLevel}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        node.health.batteryLevel > 50 
                          ? 'bg-sky-400' 
                          : node.health.batteryLevel > 25 
                          ? 'bg-amber-400' 
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${node.health.batteryLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Threat & Next Hop Relay */}
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1">
                  {getHazardIcon(node)}
                  <span className="text-slate-300 font-medium">
                    {node.aiResult.primaryHazard === 'NONE' ? 'Nominal' : node.aiResult.primaryHazard}
                  </span>
                  <span className="text-slate-500 font-mono">({node.aiResult.severity}%)</span>
                </div>

                <div className="text-slate-400 font-medium">
                  Next: <span className="text-sky-400 font-mono">{node.nextHop === 0 ? 'GATEWAY' : node.nextHop ? `N${node.nextHop}` : '—'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
