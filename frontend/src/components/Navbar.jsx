import React, { useState } from 'react';
import { Search, Sun, Moon, Plus, Wifi, WifiOff } from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  darkMode, 
  setDarkMode, 
  socketConnected, 
  onAddKeyClick 
}) {
  return (
    <header className="h-16 border-b border-dark-700 bg-dark-800/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Search Bar */}
      <div className="relative w-80">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search cache keys, nodes, logs..."
          className="w-full bg-dark-900 border border-dark-700 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      {/* Action Tray */}
      <div className="flex items-center gap-4">
        {/* Connection Telemetry Status */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-mono border ${
          socketConnected 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
        }`}>
          {socketConnected ? (
            <>
              <Wifi size={12} />
              <span>LIVE</span>
            </>
          ) : (
            <>
              <WifiOff size={12} />
              <span>OFFLINE</span>
            </>
          )}
        </div>

        {/* Quick Add Cache Key Button */}
        <button
          onClick={onAddKeyClick}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-glow border border-primary/30 transition-all duration-200"
        >
          <Plus size={14} />
          <span>Write Key</span>
        </button>

        {/* Dark Mode Switcher */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl border border-dark-700 hover:bg-dark-700 text-slate-400 hover:text-white transition-all duration-200"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
