import React, { useState } from 'react';
import { Search, Database, Trash2, Calendar, HardDrive, Hash } from 'lucide-react';

export default function DataTracker({ cacheItems, onDeleteKey, searchQuery, showToast }) {
  const [filterNode, setFilterNode] = useState('All');

  // Format bytes
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filter and search keys
  const filteredItems = cacheItems.filter(item => {
    const matchesSearch = item.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.node.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNode = filterNode === 'All' || item.node === filterNode;
    return matchesSearch && matchesNode;
  });

  // Unique list of nodes for filter selection
  const nodesList = ['All', ...new Set(cacheItems.map(i => i.node))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide uppercase">Data Location Tracker</h2>
          <p className="text-xs text-slate-400">Locate keys across cluster shards, monitor allocations, and remove records.</p>
        </div>

        {/* Filter Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Node Filter:</span>
          <select
            value={filterNode}
            onChange={(e) => setFilterNode(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary"
          >
            {nodesList.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-glass border border-dark-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-700 bg-dark-800/40 text-[11px] text-slate-400 tracking-wider uppercase font-semibold">
                <th className="p-4 pl-6">Cache Key</th>
                <th className="p-4">Server Node</th>
                <th className="p-4">Size (Original / Comp)</th>
                <th className="p-4">Compression Ratio</th>
                <th className="p-4">Last Accessed</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50 text-sm">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item.key} className="hover:bg-dark-800/20 transition-colors">
                    {/* Key Name */}
                    <td className="p-4 pl-6 font-mono font-medium text-slate-200 max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <Database size={14} className="text-primary-light" />
                        <span>{item.key}</span>
                      </div>
                    </td>

                    {/* Server Node */}
                    <td className="p-4">
                      <span className="bg-dark-700 border border-dark-600 text-slate-300 text-xs px-2.5 py-1 rounded-lg font-mono">
                        {item.node}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="p-4 text-xs font-mono text-slate-300">
                      <div>{formatBytes(item.originalSize)}</div>
                      <div className="text-[10px] text-slate-500">{formatBytes(item.compressedSize)} compressed</div>
                    </td>

                    {/* Compression Ratio */}
                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-200">{item.ratio}x</span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          (-{Math.round((1 - item.compressedSize / item.originalSize) * 100)}%)
                        </span>
                      </div>
                    </td>

                    {/* Last Accessed */}
                    <td className="p-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{new Date(item.lastAccess).toLocaleTimeString()}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => {
                          onDeleteKey(item.id || item._id || item.key);
                          showToast(`Evicting key "${item.key}" from shard`, 'info');
                        }}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                        title="Evict key"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500 font-mono text-xs">
                    No keys found. Adjust filters or write a new cache key.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
