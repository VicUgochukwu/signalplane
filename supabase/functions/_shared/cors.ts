const ALLOWED_ORIGINS = [
  'https://signalplane.dev',
  'https://www.signalplane.dev',
  'https://diligence.security',
  'https://www.diligence.security',
  'https://controlplane.dev',
  'https://www.controlplane.dev',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
];

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-n8n-secret',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

// Keep backward compat for imports that use corsHeaders directly
export const corsHeaders = getCorsHeaders();

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }
  return null;
}
