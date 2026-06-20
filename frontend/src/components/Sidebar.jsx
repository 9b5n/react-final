import React from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Database, 
  ListTodo, 
  History, 
  Network,
  Cpu
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, stats }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'servers', name: 'Server Nodes', icon: Server },
    { id: 'tracker', name: 'Cache Tracker', icon: Database },
    { id: 'queue', name: 'Request Queue', icon: ListTodo },
    { id: 'logs', name: 'Eviction & Logs', icon: History },
    { id: 'topology', name: 'Cluster Map', icon: Network }
  ];

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-dark-700 flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg text-primary border border-primary/20 shadow-glow">
          <Cpu size={24} className="animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wider text-slate-100">GRIDCACHE</h1>
          <p className="text-[10px] text-primary font-mono tracking-widest">DISTRIBUTED CLUSTER</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-white shadow-glow border border-primary/30' 
                  : 'text-slate-400 hover:text-white hover:bg-dark-700/50'
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
              {item.id === 'queue' && stats?.pendingQueueCount > 0 && (
                <span className="ml-auto bg-accent-yellow text-dark-900 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {stats.pendingQueueCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-dark-700 text-center">
        <div className="flex justify-around text-[11px] text-slate-500 font-mono">
          <div>
            <div className="text-emerald-500 font-bold">{stats?.activeNodes || 0}/{stats?.totalNodes || 0}</div>
            <div>NODES</div>
          </div>
          <div className="border-r border-dark-700 h-6"></div>
          <div>
            <div className="text-primary font-bold">{stats?.memoryUsagePercentage || 0}%</div>
            <div>RAM USED</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
