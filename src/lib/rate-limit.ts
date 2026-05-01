/**
 * src/lib/rate-limit.ts
 * Simple sliding window rate limiter.
 * In a multi-instance production environment, swap the 'LRUCache' with Redis.
 */

interface RateLimitOptions {
  interval: number; // in milliseconds
  limit: number;    // max requests per interval
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // timestamp when the window resets
}

// Map to store request counts: key -> { count: number, reset: number }
const storage = new Map<string, { count: number; reset: number }>();

/**
 * Checks if a request should be rate limited.
 * @param key Unique identifier (e.g., IP address or User ID)
 * @param options Rate limit configuration
 */
export async function rateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const windowData = storage.get(key);

  if (!windowData || now > windowData.reset) {
    // Start a new window
    const newData = { count: 1, reset: now + options.interval };
    storage.set(key, newData);
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: newData.reset,
    };
  }

  // Check if limit exceeded
  if (windowData.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: windowData.reset,
    };
  }

  // Increment count
  windowData.count += 1;
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - windowData.count,
    reset: windowData.reset,
  };
}

/**
 * Cleanup expired entries periodically to prevent memory leaks.
 */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of storage.entries()) {
      if (now > data.reset) {
        storage.delete(key);
      }
    }
  }, 60000); // Cleanup every minute
}
