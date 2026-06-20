import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  HardDrive, 
  Activity, 
  ArrowUpDown, 
  Layers,
  Database,
  TrendingUp
} from 'lucide-react';

export default function DashboardHome({ stats, servers, cacheItems, logs }) {
  // Format bytes to readable string
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // 1. Calculate Server CPU/RAM Load Chart Data
  const serverLoadData = servers.map(s => ({
    name: s.name,
    CPU: s.status === 'Active' ? s.cpu : 0,
    RAM: s.status === 'Active' ? s.ram : 0
  }));

  // 2. Calculate Read vs Write ratio
  const pieData = [
    { name: 'Writes', value: stats?.writesCount || 0, color: '#3b82f6' },
    { name: 'Evictions', value: stats?.evictsCount || 0, color: '#f59e0b' },
    { name: 'Deletions', value: stats?.deletesCount || 0, color: '#ef4444' }
  ];

  // 3. Mock Cache Hit / Miss Data (simulated telemetry history)
  const hitMissData = [
    { time: '12:00', Hits: 78, Misses: 22 },
    { time: '12:05', Hits: 84, Misses: 16 },
    { time: '12:10', Hits: 89, Misses: 11 },
    { time: '12:15', Hits: 81, Misses: 19 },
    { time: '12:20', Hits: 92, Misses: 8 },
    { time: '12:25', Hits: 87, Misses: 13 }
  ];

  // 4. Memory Allocations Data (Used vs Available)
  const memoryTimelineData = [
    { time: '10 min ago', Used: Math.max(10, (stats?.usedMemory || 0) * 0.9) },
    { time: '8 min ago', Used: Math.max(10, (stats?.usedMemory || 0) * 0.95) },
    { time: '6 min ago', Used: Math.max(10, (stats?.usedMemory || 0) * 0.98) },
    { time: '4 min ago', Used: Math.max(10, (stats?.usedMemory || 0) * 1.02) },
    { time: '2 min ago', Used: Math.max(10, (stats?.usedMemory || 0) * 0.97) },
    { time: 'Now', Used: stats?.usedMemory || 0 }
  ].map(d => ({
    ...d,
    UsedMB: Math.round(d.Used / (1024 * 1024))
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: Memory Metrics */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between shadow-glass">
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-medium tracking-wide block uppercase">Memory Allocation</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-100">
                {formatBytes(stats?.usedMemory || 0, 1)}
              </span>
              <span className="text-xs text-slate-500">
                / {formatBytes(stats?.totalMemory || 0, 0)}
              </span>
            </div>
            {/* Tiny progress bar */}
            <div className="w-full bg-dark-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats?.memoryUsagePercentage || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-primary/10 p-3.5 rounded-xl border border-primary/20 text-primary">
            <HardDrive size={22} />
          </div>
        </div>

        {/* Card 2: Cluster Cache Keys */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between shadow-glass">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium tracking-wide block uppercase">Active Cache Keys</span>
            <div className="text-2xl font-bold tracking-tight text-slate-100">
              {cacheItems.length}
            </div>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <TrendingUp size={12} />
              <span>Healthy Distribution</span>
            </p>
          </div>
          <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Database size={22} />
          </div>
        </div>

        {/* Card 3: Operations Throughput */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between shadow-glass">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium tracking-wide block uppercase">Total Write Logs</span>
            <div className="text-2xl font-bold tracking-tight text-slate-100">
              {stats?.writesCount || 0}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Last sweep: {logs[0] ? new Date(logs[0].timestamp).toLocaleTimeString() : 'N/A'}
            </p>
          </div>
          <div className="bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20 text-blue-400">
            <ArrowUpDown size={22} />
          </div>
        </div>

        {/* Card 4: Server Health Nodes */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between shadow-glass">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium tracking-wide block uppercase">Active Clusters</span>
            <div className="text-2xl font-bold tracking-tight text-slate-100">
              {stats?.activeNodes || 0} <span className="text-xs text-slate-500">/ {stats?.totalNodes || 0} Online</span>
            </div>
            <p className="text-xs text-slate-400">
              {servers.filter(s => s.status === 'Inactive').length} servers offline
            </p>
          </div>
          <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20 text-amber-400">
            <Layers size={22} />
          </div>
        </div>
      </div>

      {/* Grid of Main Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart 1: Memory Allocation Timeline */}
        <div className="glass-card p-5 rounded-2xl shadow-glass flex flex-col h-96">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 tracking-wide uppercase">Memory Allocation Timeline (MB)</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memoryTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1322', borderColor: '#1f2937', color: '#fff' }} />
                <Area type="monotone" dataKey="UsedMB" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsed)" name="Used Memory (MB)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Node Load Comparison */}
        <div className="glass-card p-5 rounded-2xl shadow-glass flex flex-col h-96">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 tracking-wide uppercase">Server Node CPU & RAM Load (%)</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serverLoadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1322', borderColor: '#1f2937', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="CPU" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="RAM" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Live Cache Hits & Misses */}
        <div className="glass-card p-5 rounded-2xl shadow-glass flex flex-col h-80">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 tracking-wide uppercase">Cache Hit vs Miss Rate</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hitMissData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '11px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f1322', borderColor: '#1f2937', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="Hits" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Hits" />
                <Area type="monotone" dataKey="Misses" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Misses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Writes vs Evictions vs Deletions */}
        <div className="glass-card p-5 rounded-2xl shadow-glass flex flex-col h-80">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 tracking-wide uppercase">Cluster Operations Distribution</h3>
          <div className="flex-1 flex items-center justify-center">
            {stats?.writesCount || stats?.evictsCount || stats?.deletesCount ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f1322', borderColor: '#1f2937', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm font-mono">No operations logged yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
