import React, { useState } from 'react';
import { 
  Terminal, 
  Crown, 
  Search
} from 'lucide-react';
import { TelemetryLog, MasterElectionResult } from '../types';

interface BottomTerminalProps {
  logs: TelemetryLog[];
  elections: MasterElectionResult[];
}

export const BottomTerminal: React.FC<BottomTerminalProps> = ({
  logs,
  elections
}) => {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'ELECTIONS'>('EVENTS');
  const [filterText, setFilterText] = useState('');

  const filteredLogs = logs.filter(l => 
    l.title.toLowerCase().includes(filterText.toLowerCase()) ||
    l.message.toLowerCase().includes(filterText.toLowerCase())
  );

  const getLogBadge = (level: TelemetryLog['level']) => {
    switch (level) {
      case 'DANGER':
        return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-1.5 py-0.2 rounded text-[9px] font-medium">Critical</span>;
      case 'WARN':
        return <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded text-[9px] font-medium">Warning</span>;
      case 'SUCCESS':
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded text-[9px] font-medium">Success</span>;
      case 'INFO':
        return <span className="bg-sky-500/15 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded text-[9px] font-medium">Info</span>;
    }
  };

  return (
    <div className="h-44 bg-[#0c1322]/95 backdrop-blur-md border-t border-slate-800 flex flex-col z-10 select-none shadow-lg font-sans text-xs">
      {/* Tab Navigation */}
      <div className="h-9 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          {/* Tab 1: System Events */}
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'EVENTS'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/35 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Telemetry & Disaster Logs ({logs.length})</span>
          </button>

          {/* Tab 2: Master Election Audit */}
          <button
            onClick={() => setActiveTab('ELECTIONS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'ELECTIONS'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Master Handover Audit ({elections.length})</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-slate-900 border border-slate-700/60 rounded-md pl-7 pr-2 py-0.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 w-44 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="flex-1 overflow-y-auto p-2.5 font-mono text-[11px] space-y-1">
        {/* TAB 1: SYSTEM EVENTS */}
        {activeTab === 'EVENTS' && (
          <div>
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 italic p-2 font-sans">No event records found.</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2 py-0.5 hover:bg-slate-800/40 px-1.5 rounded transition-colors">
                  <span className="text-slate-400 shrink-0 font-medium">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {getLogBadge(log.level)}
                  <span className="text-sky-400 shrink-0 font-medium">[{log.category}]</span>
                  <span className="text-slate-300 font-semibold">{log.title}:</span>
                  <span className="text-slate-400 truncate">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: MASTER ELECTIONS */}
        {activeTab === 'ELECTIONS' && (
          <div>
            {elections.length === 0 ? (
              <div className="text-slate-500 italic p-2 font-sans">No master election cycles recorded yet.</div>
            ) : (
              elections.map((el, idx) => (
                <div key={`el-${idx}`} className="p-2.5 bg-slate-800/30 border border-slate-800/80 rounded-lg mb-1.5 font-sans">
                  <div className="flex items-center justify-between font-semibold mb-1 text-xs">
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" />
                      Elected Master: Node {el.newMasterId} (was Node {el.oldMasterId})
                    </span>
                    <span className="text-slate-400 text-[11px] font-normal">
                      {new Date(el.timestamp).toLocaleTimeString()} • Reason: {el.reason}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="bg-slate-800/60 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                      {el.triggerType}
                    </span>
                    <span>•</span>
                    <span>Candidates Evaluated: {el.candidateScores.length}</span>
                    <span>•</span>
                    <span>Top Score: {el.candidateScores[0]?.totalScore?.toFixed(1) || 0} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
