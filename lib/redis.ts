import Redis from "ioredis";

type RedisLike = Pick<Redis, "get" | "set" | "del">;

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

export function getRedis(): RedisLike | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true
    });
  }

  return globalForRedis.redis;
}

export async function getJsonCache<T>(key: string) {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function setJsonCache(key: string, value: unknown, ttlSeconds: number) {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Redis is an acceleration layer; database correctness must not depend on it.
  }
}

export async function deleteCache(key: string) {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  try {
    await redis.del(key);
  } catch {
    // Cache invalidation failure should not block moderation actions.
  }
}
