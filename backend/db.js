const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gridcache';

let isConnected = false;

// In-memory mock database store for seamless fallback
const mockStore = {
  ServerNode: [],
  CacheItem: [],
  OperationLog: [],
  RequestQueue: []
};

// Auto-seed mock data if empty
function seedMockData() {
  if (mockStore.ServerNode.length === 0) {
    const nodes = [
      { id: 'node-1', name: 'us-east-1a', status: 'Active', cpu: 45, ram: 62, maxRam: 16384, uptime: '12d 4h', address: '127.0.0.1:9001' },
      { id: 'node-2', name: 'us-east-1b', status: 'Active', cpu: 30, ram: 41, maxRam: 16384, uptime: '10d 1h', address: '127.0.0.1:9002' },
      { id: 'node-3', name: 'eu-west-1a', status: 'Active', cpu: 75, ram: 85, maxRam: 32768, uptime: '45d 8h', address: '127.0.0.1:9003' },
      { id: 'node-4', name: 'ap-northeast-1a', status: 'Inactive', cpu: 0, ram: 0, maxRam: 8192, uptime: '0d 0h', address: '127.0.0.1:9004' }
    ];
    mockStore.ServerNode = nodes;

    mockStore.CacheItem = [
      { id: 'item-1', key: 'user:session:99482', node: 'us-east-1a', originalSize: 4096, compressedSize: 1024, ratio: 4.0, lastAccess: new Date(Date.now() - 5000) },
      { id: 'item-2', key: 'catalog:products:v2', node: 'us-east-1b', originalSize: 102400, compressedSize: 30720, ratio: 3.33, lastAccess: new Date(Date.now() - 12000) },
      { id: 'item-3', key: 'auth:jwt:blacklist', node: 'eu-west-1a', originalSize: 8192, compressedSize: 8192, ratio: 1.0, lastAccess: new Date(Date.now() - 1000) }
    ];

    mockStore.OperationLog = [
      { id: 'log-1', op: 'WRITE', timestamp: new Date(Date.now() - 30000), key: 'user:session:99482', node: 'us-east-1a', status: 'Success' },
      { id: 'log-2', op: 'WRITE', timestamp: new Date(Date.now() - 25000), key: 'catalog:products:v2', node: 'us-east-1b', status: 'Success' },
      { id: 'log-3', op: 'WRITE', timestamp: new Date(Date.now() - 10000), key: 'auth:jwt:blacklist', node: 'eu-west-1a', status: 'Success' },
      { id: 'log-4', op: 'EVICT', timestamp: new Date(Date.now() - 2000), key: 'analytics:temp:daily', node: 'us-east-1a', status: 'Success' }
    ];

    mockStore.RequestQueue = [
      { id: 'q-1', timestamp: new Date(), key: 'user:profile:12', type: 'READ', status: 'Completed', latency: 8 },
      { id: 'q-2', timestamp: new Date(), key: 'inventory:stock:88', type: 'READ', status: 'Pending', latency: 0 }
    ];
  }
}

async function connectDB() {
  try {
    // Set connection timeout short so fallback triggers quickly if no local mongo is running
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    isConnected = true;
    console.log('MongoDB Connected successfully to GridCache database.');
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to in-memory GridCache storage.');
    console.warn(error.message);
    isConnected = false;
    seedMockData();
  }
}

module.exports = {
  connectDB,
  isConnected: () => isConnected,
  mockStore
};
