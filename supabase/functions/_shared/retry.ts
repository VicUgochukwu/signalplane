/**
 * Shared retry utility with exponential backoff for external API calls.
 *
 * Usage:
 *   const response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
 *     method: 'POST',
 *     headers: { ... },
 *     body: JSON.stringify({ ... }),
 *   }, { maxRetries: 3, baseDelayMs: 1000 });
 */

interface RetryOptions {
  /** Maximum number of retries (default: 3) */
  maxRetries?: number;
  /** Base delay in ms — doubles on each retry (default: 1000) */
  baseDelayMs?: number;
  /** Maximum delay cap in ms (default: 30000) */
  maxDelayMs?: number;
  /** HTTP status codes that should be retried (default: [429, 500, 502, 503, 504]) */
  retryableStatuses?: number[];
  /** Timeout per request in ms (default: 60000) */
  timeoutMs?: number;
  /** Label for logging (e.g. 'Anthropic', 'Resend') */
  label?: string;
}

const DEFAULT_RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: RetryOptions = {},
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
    timeoutMs = 60000,
    label = 'HTTP',
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If response is OK or not retryable, return it
      if (response.ok || !retryableStatuses.includes(response.status)) {
        return response;
      }

      // Retryable error
      const errBody = await response.text().catch(() => '');
      lastError = new Error(`${label} API returned ${response.status}: ${errBody.slice(0, 200)}`);

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        // Add jitter: ±25%
        const jitter = delay * (0.75 + Math.random() * 0.5);
        console.warn(
          `[retry] ${label} attempt ${attempt + 1}/${maxRetries + 1} failed (${response.status}), retrying in ${Math.round(jitter)}ms...`,
        );
        await sleep(jitter);
      }
    } catch (err) {
      lastError = err as Error;

      // Don't retry if it's not a network/timeout error
      if ((err as Error).name === 'AbortError') {
        lastError = new Error(`${label} request timed out after ${timeoutMs}ms`);
      }

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        const jitter = delay * (0.75 + Math.random() * 0.5);
        console.warn(
          `[retry] ${label} attempt ${attempt + 1}/${maxRetries + 1} error: ${(err as Error).message}, retrying in ${Math.round(jitter)}ms...`,
        );
        await sleep(jitter);
      }
    }
  }

  throw lastError || new Error(`${label} request failed after ${maxRetries + 1} attempts`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
