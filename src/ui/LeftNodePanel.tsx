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
        <span className="bg-slate-800 text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono font-black">
          OFFLINE
        </span>
      );
    }
    switch (node.aiResult.status) {
      case 'CRITICAL':
        return (
          <span className="bg-red-950 text-red-300 border-2 border-red-500 px-1.5 py-0.5 rounded text-[10px] font-mono font-black animate-pulse">
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="bg-amber-950 text-amber-300 border-2 border-amber-500 px-1.5 py-0.5 rounded text-[10px] font-mono font-black">
            WARNING
          </span>
        );
      case 'WATCH':
        return (
          <span className="bg-cyan-950 text-cyan-300 border-2 border-cyan-500 px-1.5 py-0.5 rounded text-[10px] font-mono font-black">
            WATCH
          </span>
        );
      case 'NORMAL':
        return (
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-500 px-1.5 py-0.5 rounded text-[10px] font-mono font-black">
            NORMAL
          </span>
        );
    }
  };

  const getHazardIcon = (node: NodeState) => {
    switch (node.aiResult.primaryHazard) {
      case 'FIRE':
        return <Flame className="w-4 h-4 text-red-400" />;
      case 'FLOOD':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'LANDSLIDE':
        return <Mountain className="w-4 h-4 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <aside className="w-80 h-full bg-[#080d18] border-r-2 border-slate-700 flex flex-col z-10 select-none shadow-2xl">
      {/* Header */}
      <div className="p-3 border-b-2 border-slate-700 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-black text-white uppercase tracking-wider font-mono">
            Sensor Fleet Status
          </h2>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 border border-emerald-700 px-2 py-0.5 rounded">
          {nodes.filter(n => n.isAlive).length} / {nodes.length} ONLINE
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
              className={`p-2.5 rounded-lg border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#10192e] border-cyan-400 ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-950/50'
                  : isMaster
                  ? 'bg-amber-950/30 border-amber-500 hover:border-amber-400'
                  : !node.isAlive
                  ? 'bg-slate-900/50 border-slate-800 opacity-60'
                  : 'bg-slate-900 border-slate-750 hover:border-slate-500'
              }`}
            >
              {/* Row 1: ID, Master Badge, Status Pill */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    N{node.id}
                  </span>
                  <span className="text-[11px] font-bold text-slate-200 truncate max-w-[110px]">
                    {node.name.replace(/N\d+/, '').trim()}
                  </span>
                  {isMaster && (
                    <span className="flex items-center gap-1 bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase shadow-sm">
                      <Crown className="w-3 h-3" />
                      MASTER
                    </span>
                  )}
                </div>
                {getStatusBadge(node)}
              </div>

              {/* Row 2: Health & Battery Gauges */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono my-1.5">
                <div>
                  <div className="flex justify-between text-slate-300 mb-0.5 font-bold">
                    <span>Health</span>
                    <span className={node.health.overallScore < 40 ? 'text-red-400' : 'text-white'}>
                      {node.health.overallScore}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        node.health.overallScore > 70 
                          ? 'bg-emerald-400' 
                          : node.health.overallScore > 40 
                          ? 'bg-amber-400' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${node.health.overallScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-0.5 font-bold">
                    <span>Battery</span>
                    <span className={node.health.batteryLevel < 25 ? 'text-red-400' : 'text-white'}>
                      {node.health.batteryLevel}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        node.health.batteryLevel > 50 
                          ? 'bg-cyan-400' 
                          : node.health.batteryLevel > 25 
                          ? 'bg-yellow-400' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${node.health.batteryLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Threat & Next Hop Relay */}
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1">
                  {getHazardIcon(node)}
                  <span className="text-slate-300 font-semibold">
                    {node.aiResult.primaryHazard === 'NONE' ? 'Nominal' : node.aiResult.primaryHazard}
                  </span>
                  <span className="text-slate-400">({node.aiResult.severity}%)</span>
                </div>

                <div className="text-slate-300 font-bold">
                  Next: <span className="text-cyan-400">{node.nextHop === 0 ? 'GATEWAY' : node.nextHop ? `N${node.nextHop}` : '—'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
