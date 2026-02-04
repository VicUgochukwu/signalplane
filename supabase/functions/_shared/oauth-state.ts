/**
 * OAuth state signing and verification utilities.
 * Uses HMAC-SHA256 to prevent state tampering/forgery attacks.
 */

const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Creates a cryptographically signed OAuth state parameter.
 * Format: base64(data).base64(hmac_signature)
 */
export async function createSignedState(userId: string): Promise<string> {
  const stateSecret = Deno.env.get('OAUTH_STATE_SECRET');
  if (!stateSecret) {
    throw new Error('OAUTH_STATE_SECRET is not configured');
  }

  const stateData = JSON.stringify({
    user_id: userId,
    timestamp: Date.now(),
    nonce: crypto.randomUUID(),
  });

  const state = btoa(stateData);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(stateSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(state)
  );

  const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${state}.${encodedSig}`;
}

/**
 * Verifies and parses a signed OAuth state parameter.
 * Throws if signature is invalid, state is expired, or format is wrong.
 */
export async function verifySignedState(signedState: string): Promise<{
  user_id: string;
  timestamp: number;
  nonce: string;
}> {
  const stateSecret = Deno.env.get('OAUTH_STATE_SECRET');
  if (!stateSecret) {
    throw new Error('OAUTH_STATE_SECRET is not configured');
  }

  const parts = signedState.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid state format');
  }

  const [state, encodedSig] = parts;
  if (!state || !encodedSig) {
    throw new Error('Invalid state format');
  }

  // Verify HMAC signature
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(stateSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = Uint8Array.from(atob(encodedSig), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    new TextEncoder().encode(state)
  );

  if (!valid) {
    throw new Error('Invalid state signature');
  }

  // Parse and validate state data
  const stateData = JSON.parse(atob(state));

  // Check timestamp expiration
  if (Date.now() - stateData.timestamp > STATE_MAX_AGE_MS) {
    throw new Error('State expired');
  }

  if (!stateData.user_id || !stateData.nonce) {
    throw new Error('Invalid state data');
  }

  return stateData;
}
