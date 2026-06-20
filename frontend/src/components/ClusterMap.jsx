import React from 'react';

// Hardcoded coordinates for node mapping (so they render nicely on SVG viewport)
const nodePositions = {
  'us-east-1a': { x: 100, y: 100, label: 'us-east-1a (Virginia)' },
  'us-east-1b': { x: 350, y: 100, label: 'us-east-1b (Virginia-B)' },
  'eu-west-1a': { x: 225, y: 280, label: 'eu-west-1a (Ireland)' },
  'ap-northeast-1a': { x: 500, y: 200, label: 'ap-northeast-1a (Tokyo)' }
};

const links = [
  { source: 'us-east-1a', target: 'us-east-1b', latency: '5ms' },
  { source: 'us-east-1a', target: 'eu-west-1a', latency: '70ms' },
  { source: 'us-east-1b', target: 'eu-west-1a', latency: '75ms' },
  { source: 'us-east-1b', target: 'ap-northeast-1a', latency: '155ms' },
  { source: 'eu-west-1a', target: 'ap-northeast-1a', latency: '110ms' }
];

export default function ClusterMap({ servers, activePath = [] }) {
  const isNodeActive = (nodeName) => {
    const s = servers.find(sv => sv.name === nodeName);
    return s ? s.status === 'Active' : false;
  };

  const isLinkInActivePath = (source, target) => {
    if (activePath.length < 2) return false;
    for (let i = 0; i < activePath.length - 1; i++) {
      if (
        (activePath[i] === source && activePath[i + 1] === target) ||
        (activePath[i] === target && activePath[i + 1] === source)
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-dark-700 shadow-glass flex flex-col items-center">
      <div className="w-full text-left mb-6">
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Interactive Cluster Map Hub</h3>
        <p className="text-xs text-slate-400">Real-time link topology, node heartbeats, and packet route tracking.</p>
      </div>

      <div className="w-full max-w-xl aspect-[3/2] bg-dark-900/40 rounded-xl border border-dark-700/50 p-4 relative">
        <svg viewBox="0 0 600 350" className="w-full h-full">
          {/* 1. Connection Links */}
          {links.map((link, idx) => {
            const p1 = nodePositions[link.source];
            const p2 = nodePositions[link.target];
            if (!p1 || !p2) return null;

            const isLinkActive = isNodeActive(link.source) && isNodeActive(link.target);
            const inPath = isLinkInActivePath(link.source, link.target);

            return (
              <g key={idx}>
                {/* Link line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={inPath ? '#00f2fe' : isLinkActive ? '#3b82f6' : '#1f2937'}
                  strokeWidth={inPath ? 3 : 1.5}
                  className={isLinkActive ? 'flow-active' : ''}
                  style={{
                    strokeDasharray: isLinkActive ? '8, 4' : 'none',
                    animation: isLinkActive ? 'flowLine 1.5s linear infinite' : 'none'
                  }}
                />
                
                {/* Latency text tag on link center */}
                <rect
                  x={(p1.x + p2.x) / 2 - 20}
                  y={(p1.y + p2.y) / 2 - 9}
                  width="40"
                  height="18"
                  rx="4"
                  fill="#070a13"
                  stroke="#1a2035"
                  strokeWidth="1"
                />
                <text
                  x={(p1.x + p2.x) / 2}
                  y={(p1.y + p2.y) / 2 + 4}
                  fill={isLinkActive ? '#60a5fa' : '#6b7280'}
                  fontSize="9px"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {link.latency}
                </text>
              </g>
            );
          })}

          {/* 2. Server Nodes */}
          {Object.entries(nodePositions).map(([nodeName, pos]) => {
            const active = isNodeActive(nodeName);
            const inPath = activePath.includes(nodeName);

            return (
              <g key={nodeName} className="cursor-pointer group">
                {/* Outer Glow ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="24"
                  fill="none"
                  stroke={inPath ? '#00f2fe' : active ? '#10b981' : '#ef4444'}
                  strokeWidth="2"
                  strokeOpacity="0.4"
                  className={active ? 'animate-pulse' : ''}
                />
                {/* Core node */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="14"
                  fill={active ? '#10b981' : '#ef4444'}
                  stroke="#070a13"
                  strokeWidth="3"
                />

                {/* Node labels */}
                <text
                  x={pos.x}
                  y={pos.y - 30}
                  fill="#fff"
                  fontSize="11px"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="bg-dark-900 p-1"
                >
                  {nodeName}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 42}
                  fill={active ? '#10b981' : '#ef4444'}
                  fontSize="9px"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {active ? 'ACTIVE' : 'OFFLINE'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
