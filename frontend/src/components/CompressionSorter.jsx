import React, { useState } from 'react';
import { ArrowUpDown, Percent, Minimize2, Check } from 'lucide-react';

export default function CompressionSorter({ cacheItems }) {
  const [sortOrder, setSortOrder] = useState('desc'); // desc = highest efficiency first

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const sortedItems = [...cacheItems].sort((a, b) => {
    const savingsA = 1 - (a.compressedSize / a.originalSize);
    const savingsB = 1 - (b.compressedSize / b.originalSize);
    return sortOrder === 'desc' ? savingsB - savingsA : savingsA - savingsB;
  });

  return (
    <div className="glass-card p-6 rounded-2xl border border-dark-700 shadow-glass space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Compression Efficiency Sorter</h3>
          <p className="text-xs text-slate-400">Sort cluster elements by memory space savings.</p>
        </div>

        {/* Sort Order Selector */}
        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 border border-dark-700 bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white px-3 py-1 rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowUpDown size={12} />
          <span>{sortOrder === 'desc' ? 'Highest Savings' : 'Lowest Savings'}</span>
        </button>
      </div>

      <div className="space-y-4">
        {sortedItems.length > 0 ? (
          sortedItems.map(item => {
            const savingsPercent = Math.round((1 - item.compressedSize / item.originalSize) * 100);
            return (
              <div key={item.key} className="bg-dark-900/60 p-4 rounded-xl border border-dark-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-mono text-sm text-slate-200 truncate">{item.key}</div>
                  <div className="flex gap-4 text-xs text-slate-500 font-mono">
                    <span>Node: <strong className="text-slate-400">{item.node}</strong></span>
                    <span>Ratio: <strong className="text-slate-400">{item.ratio}x</strong></span>
                  </div>
                </div>

                {/* Savings progress bar visual */}
                <div className="flex items-center gap-6">
                  <div className="text-right font-mono text-xs hidden md:block">
                    <div className="text-slate-300">{formatBytes(item.compressedSize)}</div>
                    <div className="text-slate-500 line-through">{formatBytes(item.originalSize)}</div>
                  </div>

                  <div className="w-28 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono">
                      <span>SAVINGS</span>
                      <span className="text-emerald-400">{savingsPercent}%</span>
                    </div>
                    <div className="w-full bg-dark-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${savingsPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            No keys to analyze. Add data to begin analysis.
          </div>
        )}
      </div>
    </div>
  );
}
