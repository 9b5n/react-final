# GridCache — Distributed Cache Cluster Monitoring Dashboard

GridCache is a full-stack distributed cache cluster monitoring dashboard styled with premium dark mode ergonomics similar to Grafana and Redis Insight. It enables real-time visual telemetry, cache key placement tracking, automated LRU evictions, compression analysis, and sync route path calculations.

## Technology Stack

- **Frontend**: React (Vite SPA), Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB (Mongoose) with a seamless, zero-configuration local fallback to in-memory state.

---

## Features

1. **Dashboard Home**: Analytics charts representing CPU/RAM load, cache hit/miss timelines, and operational breakdowns.
2. **Data Location Tracker**: Key locations map layout tracking size, shard node, and access intervals.
3. **Write History Log**: Auditable logs of all write mutations, manual deletes, and automated evictions. Exportable to CSV.
4. **FIFO Request Queue**: Processing pipeline displaying pending/completed read queries in real-time.
5. **Server Status Checker**: Outage simulator allowing nodes to be set offline/online to observe cluster failover.
6. **Compression Sorter**: Sorting interface representing space-saving percentages and ratios.
7. **Cluster Map Hub**: Network topological layout showing server node coordinates, active connections, and latency metrics.
8. **Fast Sync Route Optimizer**: Shortest path simulator (Dijkstra) computing latency and path hops between selected endpoints.
9. **Old Data Remover**: Simulated LRU evictions when cache capacity is reached.

---

## Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start Backend Server
```bash
npm start
```
The backend will run securely at `http://127.0.0.1:5001`. It will automatically fall back to mock-telemetry mode if MongoDB is not running locally.

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Start Frontend Dev Server
```bash
npm run dev
```
The client dashboard will run at `http://127.0.0.1:3000`.

---

## API Endpoints Reference

- `GET /api/servers`: Retrieve cluster servers.
- `GET /api/cache`: Retrieve active cache keys.
- `POST /api/cache`: Insert a cache key (triggers LRU evaluations).
- `DELETE /api/cache/:id`: Delete a cache key.
- `GET /api/logs`: Fetch write operation and eviction logs.
- `GET /api/queue`: Get current FIFO read queue.
- `POST /api/queue`: Enqueue a new read simulation.
- `GET /api/stats`: Retrieve memory details and cluster aggregates.
- `POST /api/sync-route`: Dijkstra path latency calculation.
- `POST /api/evict`: Force manual LRU sweep on a node.
