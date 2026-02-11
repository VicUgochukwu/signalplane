import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = 'https://dnqjzgfunvbofsuibcsk.supabase.co';

/**
 * Get a valid access token, refreshing if necessary.
 */
async function getValidToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Please log in to continue');
  }

  // Check if token expires within the next 60 seconds
  const expiresAt = session.expires_at ?? 0;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (expiresAt - nowSeconds < 60) {
    // Token is expiring soon — force refresh
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session?.access_token) {
      throw new Error('Session expired. Please log in again.');
    }
    return refreshed.session.access_token;
  }

  return session.access_token;
}

/**
 * Invoke a Supabase Edge Function directly.
 * Uses raw fetch with the user's JWT in the Authorization header.
 * Edge Functions are deployed with --no-verify-jwt so the gateway
 * passes the token through; the function validates auth internally.
 *
 * Retries once on 401 after refreshing the session token.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body?: Record<string, any>
): Promise<T> {
  const doFetch = async (token: string) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return response;
  };

  let token = await getValidToken();
  let response = await doFetch(token);

  // Retry once on 401 — token may have expired mid-flight
  if (response.status === 401) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session?.access_token) {
      throw new Error('Session expired. Please log in again.');
    }
    token = refreshed.session.access_token;
    response = await doFetch(token);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Function ${functionName} failed`);
  }

  return data as T;
}

/**
 * Fire-and-forget version — never throws, logs errors to console.
 */
export function invokeEdgeFunctionSilent(
  functionName: string,
  body?: Record<string, any>
): void {
  invokeEdgeFunction(functionName, body).catch((err) => {
    console.warn(`[${functionName}] fire-and-forget failed:`, err.message);
  });
}
