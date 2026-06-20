const mongoose = require('mongoose');
const { isConnected, mockStore } = require('./db');

// --- Schemas ---

const ServerNodeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  cpu: { type: Number, default: 0 },
  ram: { type: Number, default: 0 },
  maxRam: { type: Number, default: 16384 }, // in MB
  uptime: { type: String, default: '0d 0h' },
  address: { type: String, required: true }
});

const CacheItemSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  node: { type: String, required: true },
  originalSize: { type: Number, required: true }, // in Bytes
  compressedSize: { type: Number, required: true }, // in Bytes
  ratio: { type: Number, required: true }, // original / compressed
  lastAccess: { type: Date, default: Date.now }
});

const OperationLogSchema = new mongoose.Schema({
  op: { type: String, enum: ['WRITE', 'EVICT', 'DELETE'], required: true },
  timestamp: { type: Date, default: Date.now },
  key: { type: String, required: true },
  node: { type: String, required: true },
  status: { type: String, default: 'Success' }
});

const RequestQueueSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  key: { type: String, required: true },
  type: { type: String, default: 'READ' },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  latency: { type: Number, default: 0 } // in ms
});

const MongooseServerNode = mongoose.model('ServerNode', ServerNodeSchema);
const MongooseCacheItem = mongoose.model('CacheItem', CacheItemSchema);
const MongooseOperationLog = mongoose.model('OperationLog', OperationLogSchema);
const MongooseRequestQueue = mongoose.model('RequestQueue', RequestQueueSchema);

// --- Unified Database Interface ---

const ServerNode = {
  find: async (query = {}) => {
    if (isConnected()) return await MongooseServerNode.find(query);
    return mockStore.ServerNode;
  },
  findOneAndUpdate: async (filter, update) => {
    if (isConnected()) return await MongooseServerNode.findOneAndUpdate(filter, update, { new: true, upsert: true });
    const idx = mockStore.ServerNode.findIndex(n => n.name === filter.name);
    if (idx !== -1) {
      mockStore.ServerNode[idx] = { ...mockStore.ServerNode[idx], ...update };
      return mockStore.ServerNode[idx];
    } else {
      const newNode = { id: 'node-' + Date.now(), ...filter, ...update };
      mockStore.ServerNode.push(newNode);
      return newNode;
    }
  }
};

const CacheItem = {
  find: async (query = {}) => {
    if (isConnected()) return await MongooseCacheItem.find(query);
    let items = [...mockStore.CacheItem];
    if (query.key) {
      items = items.filter(i => i.key === query.key);
    }
    return items;
  },
  create: async (data) => {
    if (isConnected()) return await MongooseCacheItem.create(data);
    const newItem = { id: 'item-' + Date.now(), lastAccess: new Date(), ...data };
    // Maintain uniqueness in mockup
    mockStore.CacheItem = mockStore.CacheItem.filter(i => i.key !== data.key);
    mockStore.CacheItem.push(newItem);
    return newItem;
  },
  deleteOne: async (query) => {
    if (isConnected()) return await MongooseCacheItem.deleteOne(query);
    const initialLen = mockStore.CacheItem.length;
    mockStore.CacheItem = mockStore.CacheItem.filter(i => {
      if (query._id) return i.id !== query._id && i._id !== query._id;
      if (query.key) return i.key !== query.key;
      return true;
    });
    return { deletedCount: initialLen - mockStore.CacheItem.length };
  },
  findByIdAndDelete: async (id) => {
    if (isConnected()) return await MongooseCacheItem.findByIdAndDelete(id);
    const initialLen = mockStore.CacheItem.length;
    mockStore.CacheItem = mockStore.CacheItem.filter(i => i.id !== id && i._id !== id);
    return { deletedCount: initialLen - mockStore.CacheItem.length };
  },
  updateOne: async (filter, update) => {
    if (isConnected()) return await MongooseCacheItem.updateOne(filter, update);
    const item = mockStore.CacheItem.find(i => i.key === filter.key);
    if (item) {
      Object.assign(item, update);
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }
};

const OperationLog = {
  find: async (query = {}) => {
    if (isConnected()) return await MongooseOperationLog.find(query).sort({ timestamp: -1 });
    return [...mockStore.OperationLog].sort((a, b) => b.timestamp - a.timestamp);
  },
  create: async (data) => {
    if (isConnected()) return await MongooseOperationLog.create(data);
    const newLog = { id: 'log-' + Date.now(), timestamp: new Date(), ...data };
    mockStore.OperationLog.push(newLog);
    // Limit log size to prevent memory leaks in mock mode
    if (mockStore.OperationLog.length > 200) {
      mockStore.OperationLog.shift();
    }
    return newLog;
  }
};

const RequestQueue = {
  find: async (query = {}) => {
    if (isConnected()) return await MongooseRequestQueue.find(query).sort({ timestamp: -1 });
    return [...mockStore.RequestQueue].sort((a, b) => b.timestamp - a.timestamp);
  },
  create: async (data) => {
    if (isConnected()) return await MongooseRequestQueue.create(data);
    const newReq = { id: 'req-' + Date.now(), timestamp: new Date(), ...data };
    mockStore.RequestQueue.push(newReq);
    return newReq;
  },
  updateOne: async (filter, update) => {
    if (isConnected()) return await MongooseRequestQueue.updateOne(filter, update);
    const req = mockStore.RequestQueue.find(r => r.id === filter._id || r._id === filter._id);
    if (req) {
      Object.assign(req, update);
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }
};

module.exports = {
  ServerNode,
  CacheItem,
  OperationLog,
  RequestQueue,
  MongooseServerNode,
  MongooseCacheItem,
  MongooseOperationLog,
  MongooseRequestQueue
};
