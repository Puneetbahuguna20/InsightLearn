const redisConnection = require('../../config/redis');
const config = require('../../config/environment');

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour
  }

  async initialize() {
    try {
      this.client = await redisConnection.connect();
      this.isConnected = true;
      console.log('Redis cache initialized');
    } catch (error) {
      console.error('Failed to initialize Redis cache:', error);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }
      
      const parsed = JSON.parse(value);
      
      // Check if expired (double-check TTL)
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        await this.del(key);
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, data, ttl = null) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      const ttlSeconds = ttl || this.defaultTTL;
      const expiresAt = Date.now() + (ttlSeconds * 1000);
      
      const cacheEntry = {
        data,
        createdAt: Date.now(),
        expiresAt,
        ttl: ttlSeconds
      };
      
      const serialized = JSON.stringify(cacheEntry);
      
      if (ttlSeconds > 0) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        console.log(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      console.error(`Redis invalidate pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  async getTTL(key) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  async extendTTL(key, additionalSeconds) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      const currentTTL = await this.getTTL(key);
      if (currentTTL > 0) {
        const newTTL = currentTTL + additionalSeconds;
        await this.client.expire(key, newTTL);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Redis extend TTL error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key, amount = 1) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      console.error(`Redis increment error for key ${key}:`, error);
      return null;
    }
  }

  async addToSet(key, member) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      await this.client.sadd(key, member);
      return true;
    } catch (error) {
      console.error(`Redis SADD error for key ${key}:`, error);
      return false;
    }
  }

  async removeFromSet(key, member) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      await this.client.srem(key, member);
      return true;
    } catch (error) {
      console.error(`Redis SREM error for key ${key}:`, error);
      return false;
    }
  }

  async getSetMembers(key) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      return await this.client.smembers(key);
    } catch (error) {
      console.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  async pushToList(key, value, maxLength = null) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      await this.client.lpush(key, JSON.stringify(value));
      
      // Trim list if max length specified
      if (maxLength && maxLength > 0) {
        await this.client.ltrim(key, 0, maxLength - 1);
      }
      
      return true;
    } catch (error) {
      console.error(`Redis LPUSH error for key ${key}:`, error);
      return false;
    }
  }

  async getListRange(key, start = 0, end = -1) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      const values = await this.client.lrange(key, start, end);
      return values.map(value => JSON.parse(value));
    } catch (error) {
      console.error(`Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  async getCacheInfo() {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace)
      };
    } catch (error) {
      console.error('Redis info error:', error);
      return {};
    }
  }

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }
      
      const pong = await this.client.ping();
      const info = await this.getCacheInfo();
      
      return {
        status: 'healthy',
        ping: pong,
        memory: info.memory,
        keyspace: info.keyspace
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async flushAll() {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      await this.client.flushall();
      console.log('Redis cache flushed');
      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  // Cache warming and preloading
  async warmCache(data) {
    const operations = [];
    
    for (const [key, value] of Object.entries(data)) {
      operations.push(this.set(key, value.data, value.ttl));
    }
    
    try {
      await Promise.all(operations);
      console.log(`Warmed cache with ${operations.length} entries`);
      return true;
    } catch (error) {
      console.error('Cache warming error:', error);
      return false;
    }
  }

  // Batch operations
  async mget(keys) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      const values = await this.client.mget(keys);
      return values.map(value => {
        if (value === null) return null;
        
        try {
          const parsed = JSON.parse(value);
          
          // Check if expired
          if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
            return null;
          }
          
          return parsed.data;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Redis MGET error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  async mset(keyValuePairs, defaultTTL = null) {
    if (!this.isConnected) {
      await this.initialize();
    }
    
    try {
      const pipeline = this.client.pipeline();
      
      for (const [key, data] of Object.entries(keyValuePairs)) {
        const ttl = defaultTTL || this.defaultTTL;
        const expiresAt = Date.now() + (ttl * 1000);
        
        const cacheEntry = {
          data,
          createdAt: Date.now(),
          expiresAt,
          ttl
        };
        
        const serialized = JSON.stringify(cacheEntry);
        
        if (ttl > 0) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Redis MSET error:', error);
      return false;
    }
  }
}

module.exports = new RedisCache();
