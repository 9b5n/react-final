import React, { useState } from 'react';
import { Download, FileText, Calendar, Database, Search } from 'lucide-react';

export default function WriteLog({ logs, searchQuery, showToast }) {
  const [filterOp, setFilterOp] = useState('ALL');

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.node.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOp = filterOp === 'ALL' || log.op === filterOp;
    return matchesSearch && matchesOp;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No logs to export', 'error');
      return;
    }

    const headers = ['Log ID', 'Timestamp', 'Operation', 'Cache Key', 'Server Node', 'Status'];
    const rows = filteredLogs.map(log => [
      log.id || log._id || '',
      new Date(log.timestamp).toISOString(),
      log.op,
      log.key,
      log.node,
      log.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gridcache_operations_log_${Date.now()}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
    showToast('Logs successfully exported as CSV', 'success');
  };

  const getOpBadge = (op) => {
    switch (op) {
      case 'WRITE':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'EVICT':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'DELETE':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide uppercase">Write History Log</h2>
          <p className="text-xs text-slate-400">Audit cache write mutations, evictions, and manual deletion operations.</p>
        </div>

        {/* CSV Export & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterOp}
            onChange={(e) => setFilterOp(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary"
          >
            <option value="ALL">ALL OPERATIONS</option>
            <option value="WRITE">WRITES</option>
            <option value="EVICT">EVICTIONS (LRU)</option>
            <option value="DELETE">DELETIONS</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 border border-dark-700 bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-glass border border-dark-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-700 bg-dark-800/40 text-[11px] text-slate-400 tracking-wider uppercase font-semibold">
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Operation</th>
                <th className="p-4">Cache Key</th>
                <th className="p-4">Server Node</th>
                <th className="p-4 pr-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50 text-sm">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-dark-800/20 transition-colors">
                    {/* Timestamp */}
                    <td className="p-4 pl-6 text-xs text-slate-400 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Operation */}
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${getOpBadge(log.op)}`}>
                        {log.op}
                      </span>
                    </td>

                    {/* Key */}
                    <td className="p-4 font-mono font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <Database size={13} className="text-slate-500" />
                        <span>{log.key}</span>
                      </div>
                    </td>

                    {/* Node */}
                    <td className="p-4 text-xs font-mono text-slate-300">
                      {log.node}
                    </td>

                    {/* Status */}
                    <td className="p-4 pr-6 text-xs font-semibold text-emerald-400">
                      {log.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500 font-mono text-xs">
                    No matching logs found in history stream.
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
