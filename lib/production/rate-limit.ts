export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

/** Development-only limiter. It is process-local and must not be used for distributed production enforcement. */
export class MemoryRateLimiter implements RateLimiter {
  private windows = new Map<string, { count: number; resetAt: number }>();

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const current = this.windows.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    bucket.count += 1;
    this.windows.set(key, bucket);
    return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
  }
}
