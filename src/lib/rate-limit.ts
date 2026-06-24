import { LRUCache } from "lru-cache";

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

// Separate caches for different rate limit tiers
const rateLimitCaches = new Map<string, LRUCache<string, RateLimitState>>();

function getCache(config: RateLimitConfig): LRUCache<string, RateLimitState> {
  const key = `${config.windowMs}-${config.maxRequests}`;
  if (!rateLimitCaches.has(key)) {
    rateLimitCaches.set(
      key,
      new LRUCache<string, RateLimitState>({
        max: 10000, // Track up to 10k unique IPs/users
        ttl: config.windowMs,
      })
    );
  }
  return rateLimitCaches.get(key)!;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfterMs: number;
}

/**
 * Check if a request should be rate-limited.
 * @param identifier - IP address or user ID
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const cache = getCache(config);
  const now = Date.now();
  const resetTime = now + config.windowMs;

  const existing = cache.get(identifier);

  if (!existing) {
    // First request in window
    cache.set(identifier, { count: 1, resetTime });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime,
      retryAfterMs: 0,
    };
  }

  if (existing.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: existing.resetTime,
      retryAfterMs: existing.resetTime - now,
    };
  }

  // Increment count
  cache.set(identifier, {
    count: existing.count + 1,
    resetTime: existing.resetTime,
  });

  return {
    success: true,
    remaining: config.maxRequests - existing.count - 1,
    resetTime: existing.resetTime,
    retryAfterMs: 0,
  };
}

// ── Predefined rate limit configs ────────────────────────────

/** AI quiz generation: 10 requests per 10 minutes per user */
export const QUIZ_GENERATION_RATE_LIMIT: RateLimitConfig = {
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
};

/** PDF upload: 20 per hour per user */
export const PDF_UPLOAD_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
};

/** Auth endpoints: 10 per 15 minutes per IP */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
};
