import Redis from 'ioredis';
import config from './index';

// Create Redis client
const redis = new Redis(config.redis.url, {
  password: config.redis.password,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

// Redis event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redis.on('ready', () => {
  console.log('✅ Redis is ready');
});

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  async ttl(key: string): Promise<number> {
    return await redis.ttl(key);
  },

  async keys(pattern: string): Promise<string[]> {
    return await redis.keys(pattern);
  },

  async flush(): Promise<void> {
    await redis.flushdb();
  },
};

export default redis;
