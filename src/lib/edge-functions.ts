import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = 'https://dnqjzgfunvbofsuibcsk.supabase.co';

/**
 * Invoke a Supabase Edge Function directly (bypassing the Lovable relay).
 * Use this for functions deployed via the messaging-tracker repo.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body?: Record<string, any>
): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error('Please log in to continue');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

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
