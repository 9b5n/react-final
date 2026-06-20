import React from 'react';
import { ListTodo, Play, CheckCircle, Clock } from 'lucide-react';

export default function ReadQueue({ queue, onTriggerRead, showToast }) {
  const pendingRequests = queue.filter(r => r.status === 'Pending');
  const completedRequests = queue.filter(r => r.status === 'Completed').slice(0, 10); // Keep last 10 completed

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide uppercase">FIFO Read Request Queue</h2>
          <p className="text-xs text-slate-400">View real-time read queue ingestion, throughput, and server processing states.</p>
        </div>

        {/* Trigger Simulation */}
        <button
          onClick={() => {
            const randomKeys = [
              'user:session:99482', 'catalog:products:v2', 'auth:jwt:blacklist',
              'inventory:stock:88', 'user:profile:12', 'analytics:visits:hourly'
            ];
            const chosenKey = randomKeys[Math.floor(Math.random() * randomKeys.length)];
            onTriggerRead(chosenKey);
            showToast(`Simulated client read request for "${chosenKey}"`, 'info');
          }}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-glow border border-primary/30 transition-all duration-200"
        >
          <Play size={14} />
          <span>Simulate Client Read</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Pending requests (FIFO queue visualization) */}
        <div className="glass-card p-6 rounded-2xl border border-dark-700 shadow-glass flex flex-col h-[400px]">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 tracking-wide uppercase flex items-center gap-2">
            <Clock size={16} className="text-amber-400" />
            <span>Pending Ingestion ({pendingRequests.length})</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((req, idx) => (
                <div 
                  key={req.id || req._id || idx} 
                  className="bg-dark-900 border border-dark-700/60 p-4 rounded-xl flex items-center justify-between animate-pulse"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-400 font-mono font-bold block">PENDING #{idx + 1}</span>
                    <span className="font-mono text-sm text-slate-200">{req.key}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(req.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs text-center space-y-2">
                <ListTodo size={32} className="text-slate-600 animate-bounce" />
                <span>FIFO Queue Empty</span>
                <span className="text-[10px] text-slate-600">Simulate client reads to feed queue stream</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Completed processed requests */}
        <div className="glass-card p-6 rounded-2xl border border-dark-700 shadow-glass flex flex-col h-[400px]">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 tracking-wide uppercase flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span>Processing History (Completed)</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {completedRequests.length > 0 ? (
              completedRequests.map((req, idx) => (
                <div 
                  key={req.id || req._id || idx} 
                  className="bg-dark-900/40 border border-dark-800 p-3 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-slate-300">{req.key}</span>
                    <div className="text-[10px] text-slate-500 font-mono">Type: {req.type}</div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-emerald-400 font-semibold">{req.latency} ms</span>
                    <div className="text-[9px] text-slate-500">{new Date(req.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                No processing history yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
