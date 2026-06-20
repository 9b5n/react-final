import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardHome from './components/DashboardHome';
import ServerStatus from './components/ServerStatus';
import DataTracker from './components/DataTracker';
import ReadQueue from './components/ReadQueue';
import WriteLog from './components/WriteLog';
import CompressionSorter from './components/CompressionSorter';
import OldDataRemover from './components/OldDataRemover';
import ClusterMap from './components/ClusterMap';
import SyncRoute from './components/SyncRoute';
import { X, CheckCircle, AlertCircle, Info, Database } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5001/api';
const SOCKET_URL = 'http://127.0.0.1:5001';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [servers, setServers] = useState([]);
  const [cacheItems, setCacheItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Extra features
  const [toasts, setToasts] = useState([]);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [activePath, setActivePath] = useState([]); // for Dijkstra routing highlights

  // Write Modal Form State
  const [formKey, setFormKey] = useState('');
  const [formNode, setFormNode] = useState('us-east-1a');
  const [formRawSize, setFormRawSize] = useState('4096');
  const [formCompSize, setFormCompSize] = useState('1024');

  // Trigger brief Toast notification
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Connect to APIs and WebSockets
  useEffect(() => {
    // 1. Initial REST fetch
    const fetchInitialData = async () => {
      try {
        const [resServers, resCache, resLogs, resQueue, resStats] = await Promise.all([
          fetch(`${API_BASE}/servers`).then(r => r.json()),
          fetch(`${API_BASE}/cache`).then(r => r.json()),
          fetch(`${API_BASE}/logs`).then(r => r.json()),
          fetch(`${API_BASE}/queue`).then(r => r.json()),
          fetch(`${API_BASE}/stats`).then(r => r.json())
        ]);
        setServers(resServers);
        setCacheItems(resCache);
        setLogs(resLogs);
        setQueue(resQueue);
        setStats(resStats);
      } catch (err) {
        showToast('Failed communicating with backend APIs', 'error');
      }
    };

    fetchInitialData();

    // 2. Establish Socket Connection
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      setSocketConnected(true);
      showToast('Socket connection established, monitoring live telemetry', 'success');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      showToast('Telemetry socket disconnected', 'error');
    });

    socket.on('servers_telemetry', (updatedServers) => {
      setServers(updatedServers);
      // Fetch stats again to keep used/free memory accurate
      fetch(`${API_BASE}/stats`).then(r => r.json()).then(s => setStats(s)).catch(() => {});
    });

    socket.on('cache_update', (updatedCache) => {
      setCacheItems(updatedCache);
      fetch(`${API_BASE}/stats`).then(r => r.json()).then(s => setStats(s)).catch(() => {});
    });

    socket.on('logs_update', (updatedLogs) => {
      setLogs(updatedLogs);
    });

    socket.on('queue_update', (updatedQueue) => {
      setQueue(updatedQueue);
    });

    socket.on('read_processed', (data) => {
      showToast(`Key "${data.key}" READ processed (${data.latency}ms) - ${data.hit ? 'HIT 🟢' : 'MISS 🔴'}`, 'info');
      // Fetch stats to update throughput counts
      fetch(`${API_BASE}/stats`).then(r => r.json()).then(s => setStats(s)).catch(() => {});
    });

    socket.on('cache_eviction', (data) => {
      showToast(`LRU sweep evicted key "${data.key}" from shard ${data.node}`, 'warning');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync theme changes with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // REST Callback Actions
  const handleWriteKey = async (e) => {
    e.preventDefault();
    if (!formKey) return showToast('Please enter a key name', 'error');

    try {
      const res = await fetch(`${API_BASE}/cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: formKey,
          node: formNode,
          originalSize: parseInt(formRawSize) || 1024,
          compressedSize: parseInt(formCompSize) || 256
        })
      });

      if (res.ok) {
        showToast(`Successfully stored key "${formKey}"`, 'success');
        setShowWriteModal(false);
        setFormKey('');
      } else {
        const err = await res.json();
        showToast(err.error || 'Write transaction rejected', 'error');
      }
    } catch (err) {
      showToast('Network error during write transaction', 'error');
    }
  };

  const handleDeleteKey = async (idOrKey) => {
    try {
      const res = await fetch(`${API_BASE}/cache/${idOrKey}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Cache entry evicted manually', 'success');
      } else {
        showToast('Delete operation rejected', 'error');
      }
    } catch (err) {
      showToast('Network error during deletion', 'error');
    }
  };

  const handleToggleServerStatus = async (serverName, status) => {
    // Optimistic UI state toggle
    setServers(prev => prev.map(s => s.name === serverName ? { ...s, status } : s));
  };

  const handleTriggerReadRequest = async (key) => {
    try {
      await fetch(`${API_BASE}/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
    } catch (err) {
      showToast('Failed to queue read request', 'error');
    }
  };

  const handleCalculateSyncRoute = async (start, end) => {
    try {
      const res = await fetch(`${API_BASE}/sync-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end })
      });
      const data = await res.json();
      if (data.success) {
        setActivePath(data.path);
      } else {
        setActivePath([]);
      }
      return data;
    } catch (err) {
      setActivePath([]);
      throw err;
    }
  };

  const handleManualNodeEviction = async (nodeName) => {
    try {
      const res = await fetch(`${API_BASE}/evict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node: nodeName })
      });
      const data = await res.json();
      if (data.evictedKey) {
        showToast(`Evicted "${data.evictedKey}" on node ${nodeName}`, 'success');
      } else {
        showToast(data.message || 'No items to evict', 'info');
      }
    } catch (err) {
      showToast('Eviction call failed', 'error');
    }
  };

  // View Router mapping
  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardHome 
            stats={stats} 
            servers={servers} 
            cacheItems={cacheItems} 
            logs={logs} 
          />
        );
      case 'servers':
        return (
          <ServerStatus 
            servers={servers} 
            onToggleStatus={handleToggleServerStatus} 
            showToast={showToast} 
          />
        );
      case 'tracker':
        return (
          <div className="space-y-8">
            <DataTracker 
              cacheItems={cacheItems} 
              onDeleteKey={handleDeleteKey} 
              searchQuery={searchQuery}
              showToast={showToast}
            />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <CompressionSorter cacheItems={cacheItems} />
              <OldDataRemover 
                servers={servers} 
                logs={logs} 
                onManualEvict={handleManualNodeEviction} 
                showToast={showToast} 
              />
            </div>
          </div>
        );
      case 'queue':
        return (
          <ReadQueue 
            queue={queue} 
            onTriggerRead={handleTriggerReadRequest} 
            showToast={showToast} 
          />
        );
      case 'logs':
        return (
          <WriteLog 
            logs={logs} 
            searchQuery={searchQuery} 
            showToast={showToast} 
          />
        );
      case 'topology':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ClusterMap servers={servers} activePath={activePath} />
            </div>
            <div>
              <SyncRoute 
                servers={servers} 
                onCalculatePath={handleCalculateSyncRoute} 
                showToast={showToast} 
              />
            </div>
          </div>
        );
      default:
        return <div className="text-center py-12">View Not Found</div>;
    }
  };

  return (
    <div className="flex bg-dark-900 text-slate-100 min-h-screen">
      {/* Sidebar Section */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        stats={stats} 
      />

      {/* Main Workspace Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          socketConnected={socketConnected}
          onAddKeyClick={() => setShowWriteModal(true)}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderViewContent()}
        </main>
      </div>

      {/* Floating Toast Notification Containers */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`glass-card p-4 rounded-xl flex items-start gap-3 shadow-glass border animate-slideIn ${
              t.type === 'success' ? 'border-emerald-500/30 text-emerald-400' :
              t.type === 'error' ? 'border-rose-500/30 text-rose-400' :
              t.type === 'warning' ? 'border-amber-500/30 text-amber-400' :
              'border-blue-500/30 text-blue-400'
            }`}
          >
            {t.type === 'success' && <CheckCircle size={18} className="shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info size={18} className="shrink-0 mt-0.5" />}
            
            <div className="flex-1 text-xs font-medium text-slate-200">
              {t.message}
            </div>
            
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Cache Key (Write Transaction) Modal Overlay */}
      {showWriteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-dark-700 p-6 space-y-6 shadow-glass animate-scaleIn">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <Database size={18} className="text-primary" />
                <span>Write Cache Key</span>
              </h3>
              <button 
                onClick={() => setShowWriteModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWriteKey} className="space-y-4 text-xs font-semibold">
              {/* Key Input */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., config:user:profile"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl py-2 px-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Shard Node Selection */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Target Node Shard</label>
                <select
                  value={formNode}
                  onChange={(e) => setFormNode(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-primary"
                >
                  {servers.filter(s => s.status === 'Active').map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Sizes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Original Size (Bytes)</label>
                  <input
                    type="number"
                    min="1"
                    value={formRawSize}
                    onChange={(e) => setFormRawSize(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Compressed Size (Bytes)</label>
                  <input
                    type="number"
                    min="1"
                    value={formCompSize}
                    onChange={(e) => setFormCompSize(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-xl uppercase tracking-wider shadow-glow border border-primary/30 transition-all duration-200"
              >
                Execute Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
