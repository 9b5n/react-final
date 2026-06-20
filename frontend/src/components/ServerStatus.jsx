import React from 'react';
import { ToggleLeft, ToggleRight, ShieldAlert, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

export default function ServerStatus({ servers, onToggleStatus, showToast }) {
  const getStatusColor = (status) => {
    return status === 'Active' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-rose-400 border-rose-500/20 bg-rose-500/10';
  };

  const getPercentageColor = (pct) => {
    if (pct > 85) return 'bg-rose-500';
    if (pct > 70) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide uppercase">Server Node Health Checker</h2>
          <p className="text-xs text-slate-400">Simulate outages, verify real-time RAM/CPU allocations, and manage server clusters.</p>
        </div>
        <button
          onClick={() => showToast('Simulating cluster diagnostic sweep...', 'success')}
          className="flex items-center gap-1.5 border border-dark-700 bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
        >
          <RefreshCw size={14} className="animate-spin" />
          <span>Diagnostic Sweep</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {servers.map(server => {
          const isActive = server.status === 'Active';
          return (
            <div 
              key={server.name} 
              className={`glass-card p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                isActive 
                  ? 'border-dark-700' 
                  : 'border-rose-500/30 opacity-60 bg-dark-900/40'
              }`}
            >
              {/* Animated corner accent for online servers */}
              {isActive && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
              )}

              {/* Server Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                    {server.name}
                    {isActive ? (
                      <ShieldCheck size={18} className="text-emerald-400" />
                    ) : (
                      <ShieldAlert size={18} className="text-rose-400" />
                    )}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">{server.address}</span>
                </div>

                {/* Status Toggle (Outage Simulator) */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(server.status)}`}>
                    {server.status}
                  </span>
                  <button
                    onClick={() => {
                      const nextStatus = isActive ? 'Inactive' : 'Active';
                      onToggleStatus(server.name, nextStatus);
                      showToast(`Node ${server.name} set to ${nextStatus}`, isActive ? 'error' : 'success');
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {isActive ? (
                      <ToggleRight size={28} className="text-primary" />
                    ) : (
                      <ToggleLeft size={28} className="text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Gauges section */}
              {isActive ? (
                <div className="space-y-4">
                  {/* CPU Usage */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Zap size={12} className="text-primary-light" /> CPU Allocation
                      </span>
                      <span className="text-slate-200 font-mono">{server.cpu}%</span>
                    </div>
                    <div className="w-full bg-dark-900 h-2.5 rounded-full overflow-hidden border border-dark-700">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getPercentageColor(server.cpu)}`}
                        style={{ width: `${server.cpu}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* RAM Allocation */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">RAM Allocated</span>
                      <span className="text-slate-200 font-mono">
                        {Math.round(server.maxRam * (server.ram / 100))} MB / {server.maxRam} MB ({server.ram}%)
                      </span>
                    </div>
                    <div className="w-full bg-dark-900 h-2.5 rounded-full overflow-hidden border border-dark-700">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getPercentageColor(server.ram)}`}
                        style={{ width: `${server.ram}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Server Stats footer */}
                  <div className="pt-4 border-t border-dark-700/50 flex justify-between text-[11px] text-slate-500 font-mono">
                    <div>UPTIME: <span className="text-slate-300">{server.uptime}</span></div>
                    <div>CLUSTER HOP: <span className="text-primary">Direct Path</span></div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 font-mono text-sm">
                  SERVER NODE IS OFFLINE
                  <p className="text-xs text-slate-600 mt-1">Activate to resume data telemetry operations</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
