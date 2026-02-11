/**
 * Simple in-memory rate limiter for edge functions.
 * Uses a sliding-window counter per key (user ID or IP).
 *
 * Since Supabase Edge Functions are ephemeral, this only protects within
 * a single instance's lifetime. For persistent rate limiting, use Redis
 * or a Supabase RLS policy. This is a pragmatic first line of defense.
 */

const windowMs = 60_000; // 1-minute window
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if a request is rate-limited.
 * @param key   Unique key (e.g., userId or IP)
 * @param limit Max requests per window (default 30)
 * @returns     { allowed: boolean; remaining: number; retryAfterMs?: number }
 */
export function checkRateLimit(
  key: string,
  limit = 30
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  // Reset bucket if window expired
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  bucket.count++;

  if (bucket.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: bucket.resetAt - now,
    };
  }

  return { allowed: true, remaining: limit - bucket.count };
}

/**
 * Extract a rate-limit key from a request.
 * Prefers user ID from auth, falls back to IP.
 */
export function rateLimitKey(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `ip:${ip}`;
}

/**
 * Returns a 429 Response if rate-limited.
 * Returns null if allowed.
 */
export function enforceRateLimit(
  req: Request,
  headers: Record<string, string>,
  userId?: string,
  limit = 30
): Response | null {
  const key = rateLimitKey(req, userId);
  const result = checkRateLimit(key, limit);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please try again later.',
        retryAfterMs: result.retryAfterMs,
      }),
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': String(Math.ceil((result.retryAfterMs || 60000) / 1000)),
        },
      }
    );
  }

  return null;
}

/** Max upload size: 5 MB */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Reject requests with bodies larger than maxBytes.
 */
export function enforceBodySize(
  req: Request,
  headers: Record<string, string>,
  maxBytes = MAX_UPLOAD_BYTES
): Response | null {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return new Response(
      JSON.stringify({
        error: `Request body too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)}MB.`,
      }),
      { status: 413, headers }
    );
  }
  return null;
}
