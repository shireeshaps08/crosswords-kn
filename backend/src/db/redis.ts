import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on('error', err => console.error('Redis error:', err.message));

// TTLs in seconds
export const TTL = {
  PUZZLE:      300,   // puzzle data — 5 min
  PUZZLE_LIST: 60,    // puzzle list — 1 min
  LEADERBOARD: 30,    // leaderboard — 30 s
  SESSION:     3600,  // session hot state — 1 hr
};

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch { return null; }
}

export async function cacheSet(key: string, data: unknown, ttl: number) {
  try { await redis.set(key, JSON.stringify(data), 'EX', ttl); } catch { /* no-op */ }
}

export async function cacheDel(key: string) {
  try { await redis.del(key); } catch { /* no-op */ }
}
