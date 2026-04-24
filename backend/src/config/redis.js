const Redis = require('ioredis');
const config = require('./environment');

class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected && this.client) {
      console.log('Redis already connected');
      return this.client;
    }

    try {
      console.log('Connecting to Redis...');
      
      const redisOptions = {
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
        retryDelayOnFailover: config.redis.retryDelayOnFailover,
        lazyConnect: config.redis.lazyConnect,
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          return err.message.includes(targetError);
        }
      };

      // Add password if provided
      if (config.redis.password) {
        redisOptions.password = config.redis.password;
      }

      this.client = new Redis(config.redis.url, redisOptions);

      // Event handlers
      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('Redis reconnecting...');
      });

      // Test connection
      await this.client.ping();
      
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('Redis connection closed');
    }
  }

  getClient() {
    return this.client;
  }

  isConnectionActive() {
    return this.isConnected && this.client && this.client.status === 'ready';
  }

  async healthCheck() {
    try {
      if (!this.client) {
        return { status: 'disconnected', error: 'No Redis client' };
      }

      const pong = await this.client.ping();
      const info = await this.client.info('server');
      
      return {
        status: this.client.status,
        ping: pong,
        info: this.parseRedisInfo(info)
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
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
    
    return {
      version: result.redis_version,
      uptime: result.uptime_in_seconds,
      connectedClients: result.connected_clients,
      usedMemory: result.used_memory_human
    };
  }

  // Cache operations
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Redis invalidate pattern error:', error);
      return 0;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }
}

module.exports = new RedisConnection();
