import React, { useState } from 'react';
import { 
  Terminal, 
  Radio, 
  Crown, 
  ShieldAlert, 
  Trash2, 
  Search,
  ExternalLink,
  Cpu,
  Binary
} from 'lucide-react';
import { TelemetryLog, LoRaPacket, MasterElectionResult } from '../types';
import { formatCompactHex } from '../network/LoRaPacket';

interface BottomTerminalProps {
  logs: TelemetryLog[];
  packets: LoRaPacket[];
  elections: MasterElectionResult[];
  onClearLogs?: () => void;
}

export const BottomTerminal: React.FC<BottomTerminalProps> = ({
  logs,
  packets,
  elections
}) => {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'PACKETS' | 'ELECTIONS'>('EVENTS');
  const [filterText, setFilterText] = useState('');

  const filteredLogs = logs.filter(l => 
    l.title.toLowerCase().includes(filterText.toLowerCase()) ||
    l.message.toLowerCase().includes(filterText.toLowerCase())
  );

  const getLogBadge = (level: TelemetryLog['level']) => {
    switch (level) {
      case 'DANGER':
        return <span className="bg-red-950 text-red-400 border border-red-800 px-1 rounded text-[9px] font-bold">CRITICAL</span>;
      case 'WARN':
        return <span className="bg-amber-950 text-amber-400 border border-amber-800 px-1 rounded text-[9px] font-bold">WARNING</span>;
      case 'SUCCESS':
        return <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-1 rounded text-[9px] font-bold">SUCCESS</span>;
      case 'INFO':
        return <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-1 rounded text-[9px] font-bold">INFO</span>;
    }
  };

  return (
    <div className="h-48 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800/80 flex flex-col z-10 select-none shadow-2xl font-mono text-xs">
      {/* Tab Navigation Bar */}
      <div className="h-9 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          {/* Tab 1: System Events */}
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              activeTab === 'EVENTS'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Event Log ({logs.length})</span>
          </button>

          {/* Tab 2: 443MHz LoRa Packets */}
          <button
            onClick={() => setActiveTab('PACKETS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              activeTab === 'PACKETS'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>LoRa 443MHz Packets ({packets.length})</span>
          </button>

          {/* Tab 3: Master Election Audit */}
          <button
            onClick={() => setActiveTab('ELECTIONS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              activeTab === 'ELECTIONS'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Master Handover & Elections ({elections.length})</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded pl-7 pr-2 py-0.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Tab Content Display Area */}
      <div className="flex-1 overflow-y-auto p-2.5 font-mono text-[11px] space-y-1.5">
        {/* TAB 1: SYSTEM EVENTS */}
        {activeTab === 'EVENTS' && (
          <div>
            {filteredLogs.length === 0 ? (
              <div className="text-slate-600 italic p-2">No event records found.</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2 py-0.5 hover:bg-slate-900/50 px-1 rounded">
                  <span className="text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {getLogBadge(log.level)}
                  <span className="text-slate-400 shrink-0 font-bold">[{log.category}]</span>
                  <span className="text-slate-200 font-semibold">{log.title}:</span>
                  <span className="text-slate-400">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: LORA COMPACT PACKETS */}
        {activeTab === 'PACKETS' && (
          <div className="space-y-1">
            {packets.length === 0 ? (
              <div className="text-slate-600 italic p-2">Awaiting LoRa packet transmissions...</div>
            ) : (
              packets.map(pkt => (
                <div key={pkt.packetId} className="bg-slate-950/60 border border-slate-800/80 p-1.5 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{pkt.packetId}</span>
                    <span className={`px-1 rounded text-[9px] font-bold ${
                      pkt.packetType === 'CRITICAL_ALERT' ? 'bg-red-950 text-red-400' :
                      pkt.packetType === 'MASTER_HANDOVER' ? 'bg-amber-950 text-amber-400' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {pkt.packetType}
                    </span>
                    <span className="text-slate-300">{pkt.payloadSummary}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                    <span className="text-cyan-600 font-mono">{formatCompactHex(pkt)}</span>
                    <span>Hop: {pkt.hopCount}</span>
                    <span>Batt: {pkt.battery}%</span>
                    <span>Hlth: {pkt.nodeHealth}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: MASTER ELECTIONS */}
        {activeTab === 'ELECTIONS' && (
          <div className="space-y-2">
            {elections.length === 0 ? (
              <div className="text-slate-600 italic p-2">No master handovers or elections triggered yet.</div>
            ) : (
              elections.map((elec, idx) => (
                <div key={`elec-${idx}`} className="bg-amber-950/20 border border-amber-500/40 p-2 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-300 font-bold">
                        {elec.triggerType === 'GRACEFUL_HANDOVER' ? 'GRACEFUL MASTER HANDOVER' : 'SUDDEN TIMEOUT ELECTION'}
                      </span>
                      <span className="text-slate-400">
                        N{elec.oldMasterId} → <strong className="text-amber-300">N{elec.newMasterId}</strong>
                      </span>
                    </div>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(elec.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[10px] mb-1.5">
                    <strong>Audit Rationale:</strong> {elec.reason}
                  </p>

                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">Top Candidate Fitness Scores:</div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {elec.candidateScores.slice(0, 4).map(c => (
                        <div key={`cand-${c.nodeId}`} className="flex justify-between px-1 bg-slate-900/60 rounded">
                          <span className={c.nodeId === elec.newMasterId ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                            Node {c.nodeId} (Score: {c.totalScore}%)
                          </span>
                          <span className="text-slate-500">{c.reason.split('|')[0]}</span>
                        </div>
                      ))}
                    </div>
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
