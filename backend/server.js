const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { connectDB } = require('./db');
const { ServerNode, CacheItem, OperationLog, RequestQueue } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// Content security and frame options
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
  }
});

// Port configuration (bind to localhost/127.0.0.1 for local testing security)
const PORT = process.env.PORT || 5001;
const HOST = '127.0.0.1';

// Connection network topology for Cluster Map & Sync routes
const topology = {
  'us-east-1a': [
    { target: 'us-east-1b', latency: 5 },
    { target: 'eu-west-1a', latency: 70 }
  ],
  'us-east-1b': [
    { target: 'us-east-1a', latency: 5 },
    { target: 'eu-west-1a', latency: 75 },
    { target: 'ap-northeast-1a', latency: 155 }
  ],
  'eu-west-1a': [
    { target: 'us-east-1a', latency: 70 },
    { target: 'us-east-1b', latency: 75 },
    { target: 'ap-northeast-1a', latency: 110 }
  ],
  'ap-northeast-1a': [
    { target: 'us-east-1b', latency: 155 },
    { target: 'eu-west-1a', latency: 110 }
  ]
};

// Dijkstra Shortest Path Solver for Sync routes
function findShortestSyncRoute(start, end) {
  const distances = {};
  const prev = {};
  const queue = [];
  const nodes = Object.keys(topology);

  nodes.forEach(node => {
    distances[node] = Infinity;
    prev[node] = null;
    queue.push(node);
  });

  distances[start] = 0;

  while (queue.length > 0) {
    queue.sort((a, b) => distances[a] - distances[b]);
    const u = queue.shift();

    if (u === end) break;
    if (distances[u] === Infinity) break;

    const neighbors = topology[u] || [];
    for (const neighbor of neighbors) {
      const alt = distances[u] + neighbor.latency;
      if (alt < distances[neighbor.target]) {
        distances[neighbor.target] = alt;
        prev[neighbor.target] = u;
      }
    }
  }

  const path = [];
  let curr = end;
  while (curr !== null) {
    path.unshift(curr);
    curr = prev[curr];
  }

  return {
    path,
    latency: distances[end] === Infinity ? 0 : distances[end],
    success: distances[end] !== Infinity
  };
}

// Simulated active servers fluctuation (telemetry)
setInterval(async () => {
  try {
    const servers = await ServerNode.find();
    for (const server of servers) {
      if (server.status === 'Active') {
        // CPU drifts by +/- 5%
        let cpuChange = (Math.random() - 0.5) * 10;
        let newCpu = Math.min(98, Math.max(5, Math.round(server.cpu + cpuChange)));
        
        // RAM drifts by +/- 2%
        let ramChange = (Math.random() - 0.5) * 4;
        let newRam = Math.min(95, Math.max(10, Math.round(server.ram + ramChange)));

        await ServerNode.findOneAndUpdate(
          { name: server.name },
          { cpu: newCpu, ram: newRam }
        );
      }
    }
    const updatedServers = await ServerNode.find();
    io.emit('servers_telemetry', updatedServers);
  } catch (err) {
    console.error('Error simulating telemetry:', err.message);
  }
}, 3000);

// FIFO Read Queue Processor
setInterval(async () => {
  try {
    const queue = await RequestQueue.find();
    const pending = queue.filter(r => r.status === 'Pending');
    if (pending.length > 0) {
      // Sort oldest pending first
      pending.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const nextRequest = pending[0];
      
      const simulatedLatency = Math.floor(Math.random() * 20) + 2; // 2ms to 22ms
      await RequestQueue.updateOne(
        { _id: nextRequest._id || nextRequest.id },
        { status: 'Completed', latency: simulatedLatency }
      );

      // Random hit/miss simulation
      const keys = await CacheItem.find();
      const hit = Math.random() > 0.25; // 75% hit rate
      
      const updatedQueue = await RequestQueue.find();
      io.emit('queue_update', updatedQueue);
      io.emit('read_processed', {
        key: nextRequest.key,
        hit,
        latency: simulatedLatency,
        timestamp: new Date()
      });
    }
  } catch (err) {
    console.error('Queue processor error:', err.message);
  }
}, 4000);

// Helper for LRU Eviction checks
async function enforceLRUEviction(targetNode) {
  // Let's check capacity. We limit each server node to e.g., max 5 cache items in our simulator
  const items = await CacheItem.find();
  const nodeItems = items.filter(i => i.node === targetNode);
  
  if (nodeItems.length > 5) {
    // Sort oldest access first
    nodeItems.sort((a, b) => new Date(a.lastAccess) - new Date(b.lastAccess));
    const oldestItem = nodeItems[0];

    await CacheItem.deleteOne({ key: oldestItem.key });
    
    // Log the eviction
    await OperationLog.create({
      op: 'EVICT',
      key: oldestItem.key,
      node: targetNode,
      status: 'Success'
    });

    io.emit('cache_eviction', {
      key: oldestItem.key,
      node: targetNode,
      timestamp: new Date()
    });
  }
}

// --- REST Endpoints ---

// GET /servers
app.get('/api/servers', async (req, res) => {
  try {
    const servers = await ServerNode.find();
    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve servers' });
  }
});

// GET /cache
app.get('/api/cache', async (req, res) => {
  try {
    const cache = await CacheItem.find();
    res.json(cache);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve cache keys' });
  }
});

// POST /cache
app.post('/api/cache', async (req, res) => {
  try {
    const { key, node, originalSize, compressedSize } = req.body;
    if (!key || !node || !originalSize || !compressedSize) {
      return res.status(400).json({ error: 'Missing key parameter components.' });
    }

    const ratio = parseFloat((originalSize / compressedSize).toFixed(2));
    
    // Save to Database
    const newItem = await CacheItem.create({
      key,
      node,
      originalSize,
      compressedSize,
      ratio,
      lastAccess: new Date()
    });

    // Write Log
    await OperationLog.create({
      op: 'WRITE',
      key,
      node,
      status: 'Success'
    });

    // Enforce LRU eviction if memory limit is breached
    await enforceLRUEviction(node);

    // Emit updates
    const updatedCache = await CacheItem.find();
    const updatedLogs = await OperationLog.find();
    
    io.emit('cache_update', updatedCache);
    io.emit('logs_update', updatedLogs);

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to insert cache key' });
  }
});

// DELETE /cache/:id
app.delete('/api/cache/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await CacheItem.find();
    const targetItem = item.find(i => i.id === id || i._id === id || i.key === id);

    if (!targetItem) {
      return res.status(404).json({ error: 'Cache item not found' });
    }

    await CacheItem.deleteOne({ key: targetItem.key });

    // Write Log
    await OperationLog.create({
      op: 'DELETE',
      key: targetItem.key,
      node: targetItem.node,
      status: 'Success'
    });

    const updatedCache = await CacheItem.find();
    const updatedLogs = await OperationLog.find();

    io.emit('cache_update', updatedCache);
    io.emit('logs_update', updatedLogs);

    res.json({ message: 'Deleted cache item', key: targetItem.key });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete cache item' });
  }
});

// GET /logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await OperationLog.find();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// GET /queue
app.get('/api/queue', async (req, res) => {
  try {
    const queue = await RequestQueue.find();
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve request queue' });
  }
});

// POST /queue (Simulate manual read request entry)
app.post('/api/queue', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'Key is required' });

    const newRequest = await RequestQueue.create({
      key,
      type: 'READ',
      status: 'Pending',
      latency: 0
    });

    const updatedQueue = await RequestQueue.find();
    io.emit('queue_update', updatedQueue);

    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to enqueue request' });
  }
});

// GET /stats
app.get('/api/stats', async (req, res) => {
  try {
    const servers = await ServerNode.find();
    const cache = await CacheItem.find();
    const logs = await OperationLog.find();

    // Memory stats
    let totalUsedMemory = 0; // in bytes
    cache.forEach(item => {
      totalUsedMemory += item.compressedSize;
    });

    let totalMaxMemory = 0; // in MB
    servers.forEach(server => {
      if (server.status === 'Active') {
        totalMaxMemory += server.maxRam;
      }
    });

    const totalMaxBytes = totalMaxMemory * 1024 * 1024;
    const freeMemoryBytes = Math.max(0, totalMaxBytes - totalUsedMemory);

    // Read vs Write counts
    const writes = logs.filter(l => l.op === 'WRITE').length;
    const evicts = logs.filter(l => l.op === 'EVICT').length;
    const deletes = logs.filter(l => l.op === 'DELETE').length;

    res.json({
      totalMemory: totalMaxBytes,
      usedMemory: totalUsedMemory,
      freeMemory: freeMemoryBytes,
      memoryUsagePercentage: parseFloat(((totalUsedMemory / (totalMaxBytes || 1)) * 100).toFixed(2)),
      writesCount: writes,
      evictsCount: evicts,
      deletesCount: deletes,
      activeNodes: servers.filter(s => s.status === 'Active').length,
      totalNodes: servers.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// POST /sync-route (Calculates latency routes between two nodes)
app.post('/api/sync-route', (req, res) => {
  const { start, end } = req.body;
  if (!start || !end) {
    return res.status(400).json({ error: 'Missing start or end node' });
  }
  const route = findShortestSyncRoute(start, end);
  res.json(route);
});

// POST /evict (Force manual LRU eviction sweep on a node)
app.post('/api/evict', async (req, res) => {
  try {
    const { node } = req.body;
    if (!node) return res.status(400).json({ error: 'Node is required' });

    const items = await CacheItem.find();
    const nodeItems = items.filter(i => i.node === node);

    if (nodeItems.length === 0) {
      return res.json({ message: 'No items on node to evict' });
    }

    // Sort by oldest access time
    nodeItems.sort((a, b) => new Date(a.lastAccess) - new Date(b.lastAccess));
    const oldestItem = nodeItems[0];

    await CacheItem.deleteOne({ key: oldestItem.key });

    // Write Eviction Log
    await OperationLog.create({
      op: 'EVICT',
      key: oldestItem.key,
      node,
      status: 'Success'
    });

    const updatedCache = await CacheItem.find();
    const updatedLogs = await OperationLog.find();

    io.emit('cache_update', updatedCache);
    io.emit('logs_update', updatedLogs);

    res.json({ evictedKey: oldestItem.key, message: 'Evicted oldest key' });
  } catch (err) {
    res.status(500).json({ error: 'Failed manually evicting node data' });
  }
});

// Server Initialization
io.on('connection', (socket) => {
  console.log(`Websocket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Websocket client disconnected: ${socket.id}`);
  });
});

async function start() {
  await connectDB();
  server.listen(PORT, HOST, () => {
    console.log(`GridCache Backend running securely at http://${HOST}:${PORT}`);
  });
}

start();
