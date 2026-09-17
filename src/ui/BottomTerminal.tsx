import React, { useState } from 'react';
import { 
  Terminal, 
  Crown, 
  Search,
  Binary
} from 'lucide-react';
import { TelemetryLog, LoRaPacket, MasterElectionResult } from '../types';
import { formatCompactHex } from '../network/LoRaPacket';

interface BottomTerminalProps {
  logs: TelemetryLog[];
  packets: LoRaPacket[];
  elections: MasterElectionResult[];
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
        return <span className="bg-red-950 text-red-300 border border-red-500 px-1 rounded text-[9px] font-black">CRITICAL</span>;
      case 'WARN':
        return <span className="bg-amber-950 text-amber-300 border border-amber-500 px-1 rounded text-[9px] font-black">WARNING</span>;
      case 'SUCCESS':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-500 px-1 rounded text-[9px] font-black">SUCCESS</span>;
      case 'INFO':
        return <span className="bg-cyan-950 text-cyan-300 border border-cyan-500 px-1 rounded text-[9px] font-black">INFO</span>;
    }
  };

  return (
    <div className="h-48 bg-[#050811] border-t-2 border-slate-700 flex flex-col z-10 select-none shadow-2xl font-mono text-xs">
      {/* Tab Navigation */}
      <div className="h-9 px-3 border-b-2 border-slate-700 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-2">
          {/* Tab 1: System Events */}
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-black transition-colors ${
              activeTab === 'EVENTS'
                ? 'bg-cyan-900 text-white border border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Telemetry & Disaster Logs ({logs.length})</span>
          </button>

          {/* Tab 2: 443MHz LoRa Packets */}
          <button
            onClick={() => setActiveTab('PACKETS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-black transition-colors ${
              activeTab === 'PACKETS'
                ? 'bg-cyan-900 text-white border border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>443MHz Multi-Hop Packets ({packets.length})</span>
          </button>

          {/* Tab 3: Master Election Audit */}
          <button
            onClick={() => setActiveTab('ELECTIONS')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-black transition-colors ${
              activeTab === 'ELECTIONS'
                ? 'bg-amber-900 text-white border border-amber-400'
                : 'text-slate-400 hover:text-white'
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
              className="bg-slate-950 border border-slate-700 rounded pl-7 pr-2 py-0.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-44"
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
              <div className="text-slate-500 italic p-2">No event records found.</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2 py-0.5 hover:bg-slate-900/80 px-1.5 rounded">
                  <span className="text-slate-400 shrink-0 font-bold">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {getLogBadge(log.level)}
                  <span className="text-cyan-400 shrink-0 font-black">[{log.category}]</span>
                  <span className="text-white font-bold">{log.title}:</span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: LORA MULTI-HOP PACKETS */}
        {activeTab === 'PACKETS' && (
          <div className="space-y-1">
            {packets.length === 0 ? (
              <div className="text-slate-500 italic p-2">Awaiting LoRa packet transmissions...</div>
            ) : (
              packets.map(pkt => (
                <div key={pkt.packetId} className="bg-slate-950 border border-slate-800 p-1.5 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-black">{pkt.packetId}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                      pkt.packetType === 'CRITICAL_ALERT' ? 'bg-red-950 text-red-300 border border-red-500' :
                      pkt.packetType === 'EARLY_WARNING' ? 'bg-yellow-950 text-yellow-300 border border-yellow-500' :
                      pkt.packetType === 'MASTER_HANDOVER' ? 'bg-amber-950 text-amber-300 border border-amber-500' :
                      'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}>
                      {pkt.packetType}
                    </span>
                    <span className="text-slate-100 font-bold">{pkt.payloadSummary}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                    <span className="text-cyan-400 font-mono font-semibold">{formatCompactHex(pkt)}</span>
                    <span className="text-white">Hop: {pkt.hopCount}</span>
                    <span className="text-white">Batt: {pkt.battery}%</span>
                    <span className="text-white">Hlth: {pkt.nodeHealth}%</span>
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
              <div className="text-slate-500 italic p-2">No master handovers or elections recorded yet.</div>
            ) : (
              elections.map((elec, idx) => (
                <div key={`elec-${idx}`} className="bg-amber-950/30 border-2 border-amber-500 p-2.5 rounded">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300 font-black">
                        {elec.triggerType === 'GRACEFUL_HANDOVER' ? 'GRACEFUL MASTER HANDOVER' : 'WATCHDOG TIMEOUT ELECTION'}
                      </span>
                      <span className="text-slate-200 font-bold">
                        Old Master: N{elec.oldMasterId} → <strong className="text-amber-300">New Master: N{elec.newMasterId}</strong>
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px] font-bold">
                      {new Date(elec.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-slate-200 text-[11px] mb-2 font-medium">
                    <strong className="text-amber-400">Trigger Rationale:</strong> {elec.reason}
                  </p>

                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-black uppercase mb-1">Candidate Scoring Rationale (Health + Battery + Connectivity + Proximity):</div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {elec.candidateScores.slice(0, 4).map(c => (
                        <div key={`cand-${c.nodeId}`} className="flex justify-between px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                          <span className={c.nodeId === elec.newMasterId ? 'text-amber-400 font-black' : 'text-slate-200 font-bold'}>
                            Node {c.nodeId} (Score: {c.totalScore}%)
                          </span>
                          <span className="text-slate-400">{c.reason.split('|')[0]}</span>
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
