import React, { useState } from 'react';
import { Network, ArrowRight, Zap, Play } from 'lucide-react';

export default function SyncRoute({ servers, onCalculatePath, showToast }) {
  const [startNode, setStartNode] = useState('us-east-1a');
  const [endNode, setEndNode] = useState('ap-northeast-1a');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeNodes = servers.filter(s => s.status === 'Active').map(s => s.name);

  const handleSimulate = async () => {
    if (startNode === endNode) {
      showToast('Start and end nodes must be different', 'error');
      return;
    }

    const startServer = servers.find(s => s.name === startNode);
    const endServer = servers.find(s => s.name === endNode);

    if (startServer?.status !== 'Active' || endServer?.status !== 'Active') {
      showToast('Both selected nodes must be ACTIVE to compute sync routing paths', 'error');
      return;
    }

    setLoading(true);
    try {
      const pathData = await onCalculatePath(startNode, endNode);
      setResult(pathData);
      if (pathData.success) {
        showToast(`Routing path found! Latency: ${pathData.latency}ms`, 'success');
      } else {
        showToast('No active path found between selected clusters', 'error');
      }
    } catch (err) {
      showToast('Routing solver error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-dark-700 shadow-glass space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Fast Data Sync Route Optimizer</h3>
        <p className="text-xs text-slate-400">Compute Dijkstra shortest paths and latency profiles to synchronize cluster updates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Node */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Source Node</label>
          <select
            value={startNode}
            onChange={(e) => {
              setStartNode(e.target.value);
              setResult(null);
            }}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
          >
            {servers.map(s => (
              <option key={s.name} value={s.name}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>

        {/* Target Node */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Destination Node</label>
          <select
            value={endNode}
            onChange={(e) => {
              setEndNode(e.target.value);
              setResult(null);
            }}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
          >
            {servers.map(s => (
              <option key={s.name} value={s.name}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSimulate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:bg-dark-700 text-white font-semibold py-2.5 rounded-xl text-xs tracking-wider uppercase shadow-glow border border-primary/30 transition-all duration-200"
      >
        <Play size={14} />
        <span>{loading ? 'Calculating Route...' : 'Simulate Data Sync Route'}</span>
      </button>

      {/* Output results */}
      {result && result.success && (
        <div className="bg-dark-900/60 border border-dark-700 rounded-xl p-4 space-y-4 animate-fadeIn font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Connection Latency:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Zap size={12} /> {result.latency} ms
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Path Hops:</span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {result.path.map((hop, index) => (
                <React.Fragment key={hop}>
                  <span className="bg-dark-700 border border-dark-600 text-slate-200 px-2.5 py-1 rounded-lg">
                    {hop}
                  </span>
                  {index < result.path.length - 1 && (
                    <ArrowRight size={14} className="text-primary-light" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
