import React from 'react';
import { Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function OldDataRemover({ servers, logs, onManualEvict, showToast }) {
  const evictions = logs.filter(l => l.op === 'EVICT');

  return (
    <div className="glass-card p-6 rounded-2xl border border-dark-700 shadow-glass space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">LRU Eviction & Old Data Remover</h3>
        <p className="text-xs text-slate-400">Least Recently Used (LRU) keys are automatically dropped to prevent node memory saturation.</p>
      </div>

      {/* Out of Memory Warning Alert */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-400">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold">Memory Overflow Prevention System</div>
          <div>When a node exceeds 5 cached elements, the oldest accessed element is auto-evicted. You can also trigger manual sweeps below.</div>
        </div>
      </div>

      {/* Manual Node Sweep Control */}
      <div className="space-y-3">
        <span className="text-xs text-slate-400 font-semibold block uppercase">Trigger Manual Shard Eviction</span>
        <div className="grid grid-cols-2 gap-3">
          {servers.filter(s => s.status === 'Active').map(s => (
            <button
              key={s.name}
              onClick={() => {
                onManualEvict(s.name);
              }}
              className="flex items-center justify-between border border-dark-700 bg-dark-900/60 hover:bg-dark-800 text-slate-300 hover:text-white p-3 rounded-xl text-xs font-semibold font-mono transition-colors"
            >
              <span>{s.name}</span>
              <Trash2 size={12} className="text-slate-500 hover:text-rose-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Eviction History */}
      <div className="space-y-3">
        <span className="text-xs text-slate-400 font-semibold block uppercase">Eviction History Stream</span>
        <div className="max-h-48 overflow-y-auto space-y-2 border border-dark-700/50 rounded-xl p-3 bg-dark-900/40 font-mono text-[11px]">
          {evictions.length > 0 ? (
            evictions.map((ev, index) => (
              <div key={index} className="flex justify-between items-center text-slate-400 py-1 border-b border-dark-800/40 last:border-0">
                <span className="truncate text-rose-400">EVICTED: {ev.key}</span>
                <span className="text-slate-500">{ev.node}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-600">No automatic evictions logged.</div>
          )}
        </div>
      </div>
    </div>
  );
}
