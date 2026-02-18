import { createSupabaseClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiRegistryEntry {
  id: string;
  api_name: string;
  api_slug: string;
  health_check_url: string;
  health_check_method: string;
  health_check_headers: Record<string, string>;
  health_check_body: Record<string, unknown> | null;
  expected_status_codes: number[];
  timeout_ms: number;
  category: string;
  enabled: boolean;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'down' | 'timeout' | 'error';
  responseTimeMs: number | null;
  httpStatusCode: number | null;
  errorMessage: string | null;
  responseBodyPreview: string | null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    const { action, ...params } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: 'action is required' }), {
        status: 400,
        headers,
      });
    }

    // --- Authenticate ---
    const auth = await authenticateRequest(req);

    // Actions that require admin JWT (browser-initiated)
    const adminOnlyActions = [
      'n8n_list_workflows',
      'n8n_get_workflow',
      'n8n_list_executions',
      'n8n_get_execution',
      'manual_health_check',
    ];

    // Actions that accept n8n secret OR admin JWT
    const n8nOrAdminActions = ['run_health_checks', 'cleanup_old_checks'];

    if (adminOnlyActions.includes(action) && auth.authType !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers,
      });
    }

    if (
      !adminOnlyActions.includes(action) &&
      !n8nOrAdminActions.includes(action)
    ) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400,
        headers,
      });
    }

    // --- Route actions ---
    let result: unknown;

    switch (action) {
      // n8n proxy actions
      case 'n8n_list_workflows':
      case 'n8n_get_workflow':
      case 'n8n_list_executions':
      case 'n8n_get_execution':
        result = await proxyN8n(action, params);
        break;

      // Health check actions
      case 'run_health_checks':
        result = await runHealthChecks();
        break;

      case 'manual_health_check':
        if (!params.api_slug) {
          return new Response(JSON.stringify({ error: 'api_slug required' }), {
            status: 400,
            headers,
          });
        }
        result = await runHealthChecks(params.api_slug);
        break;

      case 'cleanup_old_checks':
        result = await cleanupOldChecks();
        break;
    }

    return new Response(JSON.stringify({ data: result }), { headers });
  } catch (error) {
    console.error('admin-system-monitor error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers }
    );
  }
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

async function authenticateRequest(
  req: Request
): Promise<{ authType: 'admin' | 'n8n'; userId?: string }> {
  // Check n8n secret first (for scheduled jobs)
  const n8nSecret = req.headers.get('x-n8n-secret');
  if (n8nSecret && n8nSecret === Deno.env.get('N8N_WEBHOOK_SECRET')) {
    return { authType: 'n8n' };
  }

  // Check for service_role JWT (internal/CLI calls)
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'service_role') {
        return { authType: 'n8n' }; // Treat service_role as trusted like n8n
      }
    } catch {
      // Not a valid JWT, continue to user auth
    }
  }

  // Check admin JWT
  const supabase = createSupabaseClient(req);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: no valid session');
  }

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) {
    throw new Error('Unauthorized: admin access required');
  }

  return { authType: 'admin', userId: user.id };
}

// ---------------------------------------------------------------------------
// n8n Proxy
// ---------------------------------------------------------------------------

async function proxyN8n(
  action: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const n8nBaseUrl = Deno.env.get('N8N_BASE_URL');
  const n8nApiKey = Deno.env.get('N8N_API_KEY');

  if (!n8nBaseUrl || !n8nApiKey) {
    throw new Error('n8n configuration missing (N8N_BASE_URL or N8N_API_KEY)');
  }

  let url: string;

  switch (action) {
    case 'n8n_list_workflows':
      url = `${n8nBaseUrl}/api/v1/workflows`;
      break;
    case 'n8n_get_workflow':
      if (!params.workflowId) throw new Error('workflowId required');
      url = `${n8nBaseUrl}/api/v1/workflows/${params.workflowId}`;
      break;
    case 'n8n_list_executions': {
      const searchParams = new URLSearchParams();
      if (params.workflowId)
        searchParams.set('workflowId', String(params.workflowId));
      if (params.status) searchParams.set('status', String(params.status));
      if (params.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      url = `${n8nBaseUrl}/api/v1/executions${qs ? `?${qs}` : ''}`;
      break;
    }
    case 'n8n_get_execution':
      if (!params.executionId) throw new Error('executionId required');
      url = `${n8nBaseUrl}/api/v1/executions/${params.executionId}`;
      break;
    default:
      throw new Error(`Unknown n8n action: ${action}`);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-N8N-API-KEY': n8nApiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`n8n API ${response.status}: ${body.substring(0, 200)}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Health Check Runner
// ---------------------------------------------------------------------------

async function runHealthChecks(
  specificApiSlug?: string
): Promise<{ api_slug: string; status: string; response_time_ms: number | null }[]> {
  const supabase = createServiceRoleClient();

  // Fetch APIs to check
  let query = supabase
    .schema('admin')
    .from('api_registry')
    .select('*')
    .eq('enabled', true);

  if (specificApiSlug) {
    query = query.eq('api_slug', specificApiSlug);
  }

  const { data: apis, error } = await query;
  if (error) throw error;
  if (!apis || apis.length === 0) {
    return [{ api_slug: specificApiSlug || '*', status: 'no_apis_found', response_time_ms: null }];
  }

  const results = [];

  for (const api of apis as ApiRegistryEntry[]) {
    const result = await checkSingleApi(api);

    // Write result to DB
    const { error: insertError } = await supabase.schema('admin').from('system_health_checks').insert({
      api_registry_id: api.id,
      status: result.status,
      response_time_ms: result.responseTimeMs,
      http_status_code: result.httpStatusCode,
      error_message: result.errorMessage,
      response_body_preview: result.responseBodyPreview,
      check_source: specificApiSlug ? 'manual' : 'scheduled',
    });

    if (insertError) {
      console.error(`Failed to log health check for ${api.api_slug}:`, insertError);
    }

    results.push({
      api_slug: api.api_slug,
      status: result.status,
      response_time_ms: result.responseTimeMs,
    });
  }

  return results;
}

async function checkSingleApi(api: ApiRegistryEntry): Promise<HealthCheckResult> {
  const resolvedHeaders = resolveEnvHeaders(api.health_check_headers);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), api.timeout_ms);

  const startTime = Date.now();

  try {
    const fetchOptions: RequestInit = {
      method: api.health_check_method,
      headers: resolvedHeaders,
      signal: controller.signal,
    };

    if (api.health_check_body) {
      fetchOptions.body = JSON.stringify(api.health_check_body);
    }

    const response = await fetch(api.health_check_url, fetchOptions);
    const responseTimeMs = Date.now() - startTime;
    const bodyText = await response.text();

    const isExpectedStatus = api.expected_status_codes.includes(response.status);

    let status: HealthCheckResult['status'];
    if (isExpectedStatus && responseTimeMs < 2000) {
      status = 'healthy';
    } else if (isExpectedStatus && responseTimeMs >= 2000) {
      status = 'degraded';
    } else {
      status = 'down';
    }

    return {
      status,
      responseTimeMs,
      httpStatusCode: response.status,
      errorMessage: isExpectedStatus ? null : `Unexpected status: ${response.status}`,
      responseBodyPreview: bodyText.substring(0, 500),
    };
  } catch (err) {
    const responseTimeMs = Date.now() - startTime;
    const error = err as Error;
    return {
      status: error.name === 'AbortError' ? 'timeout' : 'error',
      responseTimeMs,
      httpStatusCode: null,
      errorMessage: error.message,
      responseBodyPreview: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function resolveEnvHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (typeof value === 'string' && value.startsWith('ENV:')) {
      const envVar = value.substring(4);
      resolved[key] = Deno.env.get(envVar) || '';
    } else if (typeof value === 'string' && value.includes('ENV:')) {
      // Support patterns like "Bearer ENV:RESEND_API_KEY"
      resolved[key] = value.replace(/ENV:(\w+)/g, (_, envVar) => Deno.env.get(envVar) || '');
    } else {
      resolved[key] = String(value);
    }
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanupOldChecks(): Promise<{ deleted: number }> {
  const supabase = createServiceRoleClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const { count, error } = await supabase
    .schema('admin')
    .from('system_health_checks')
    .delete({ count: 'exact' })
    .lt('checked_at', cutoff.toISOString());

  if (error) throw error;

  return { deleted: count || 0 };
}
