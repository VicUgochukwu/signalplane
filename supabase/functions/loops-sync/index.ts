import { createSupabaseClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { createOrUpdateContact, sendEvent } from '../_shared/loops.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    const body = await req.json().catch(() => ({}));
    const { action, ...params } = body;

    switch (action) {
      case 'sync_new_user':
        return await handleSyncNewUser(req, headers);
      case 'track_event':
        return await handleTrackEvent(req, params, headers);
      case 'backfill_contacts':
        return await handleBackfill(req, headers);
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers }
        );
    }
  } catch (error) {
    console.error('loops-sync error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers }
    );
  }
});

/**
 * Sync a new user to Loops as a contact and fire a signup event.
 * Called from frontend after sign-in or via database webhook.
 */
async function handleSyncNewUser(
  req: Request,
  headers: Record<string, string>
): Promise<Response> {
  const supabase = createSupabaseClient(req);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers,
    });
  }

  const email = user.email;
  if (!email) {
    return new Response(
      JSON.stringify({ error: 'User has no email' }),
      { status: 400, headers }
    );
  }

  // Extract name from user metadata
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    '';
  const firstName = displayName ? displayName.split(' ')[0] : email.split('@')[0];

  // Determine signup source
  const provider = user.app_metadata?.provider || 'email';
  const source =
    provider === 'google' ? 'google_oauth' : provider === 'github' ? 'github_oauth' : 'magic_link';

  // Fetch ICP data from company profile (if onboarding completed)
  const serviceClient = createServiceRoleClient();
  const { data: profile } = await serviceClient
    .from('user_company_profiles')
    .select('department, job_title, company_size')
    .eq('user_id', user.id)
    .maybeSingle();

  const contactSynced = await createOrUpdateContact({
    email,
    firstName,
    userId: user.id,
    signupDate: user.created_at,
    source,
    department: profile?.department || undefined,
    jobTitle: profile?.job_title || undefined,
    companySize: profile?.company_size || undefined,
  });

  const eventSent = await sendEvent(email, 'signup', { source });

  return new Response(
    JSON.stringify({ success: true, contactSynced, eventSent }),
    { headers }
  );
}

/**
 * Track a named event for the authenticated user.
 */
async function handleTrackEvent(
  req: Request,
  params: Record<string, any>,
  headers: Record<string, string>
): Promise<Response> {
  const { event_name, properties } = params;

  if (!event_name) {
    return new Response(
      JSON.stringify({ error: 'event_name is required' }),
      { status: 400, headers }
    );
  }

  const supabase = createSupabaseClient(req);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers,
    });
  }

  const email = user.email;
  if (!email) {
    return new Response(
      JSON.stringify({ error: 'User has no email' }),
      { status: 400, headers }
    );
  }

  const eventSent = await sendEvent(email, event_name, properties || {});

  return new Response(
    JSON.stringify({ success: true, eventSent }),
    { headers }
  );
}

/**
 * Backfill all existing users to Loops. Admin/n8n only.
 */
async function handleBackfill(
  req: Request,
  headers: Record<string, string>
): Promise<Response> {
  // Verify n8n secret
  const authSecret = req.headers.get('x-n8n-secret');
  if (authSecret !== Deno.env.get('N8N_WEBHOOK_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers,
    });
  }

  const serviceClient = createServiceRoleClient();

  // Fetch all users
  const { data: authUsers, error: usersError } = await serviceClient.auth.admin.listUsers();

  if (usersError) {
    throw new Error(`Failed to list users: ${usersError.message}`);
  }

  const users = authUsers?.users || [];
  let synced = 0;
  let failed = 0;

  for (const user of users) {
    if (!user.email) continue;

    // Fetch company profile if exists (including ICP fields)
    const { data: profile } = await serviceClient
      .from('user_company_profiles')
      .select('company_name, industry, onboarding_completed_at, department, job_title, company_size')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch competitor count
    const { count: competitorCount } = await serviceClient
      .from('tracked_companies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch packet count and latest packet date
    const { data: packetStats } = await serviceClient
      .from('intel_packets')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const { count: packetCount } = await serviceClient
      .from('intel_packets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      '';
    const firstName = displayName ? displayName.split(' ')[0] : user.email.split('@')[0];
    const provider = user.app_metadata?.provider || 'email';

    const success = await createOrUpdateContact({
      email: user.email,
      firstName,
      userId: user.id,
      signupDate: user.created_at,
      source: provider === 'google' ? 'google_oauth' : provider === 'github' ? 'github_oauth' : 'magic_link',
      companyName: profile?.company_name || undefined,
      industry: profile?.industry || undefined,
      onboardingCompleted: !!profile?.onboarding_completed_at,
      competitorCount: competitorCount || 0,
      packetCount: packetCount || 0,
      lastPacketDate: packetStats?.[0]?.created_at || undefined,
      department: profile?.department || undefined,
      jobTitle: profile?.job_title || undefined,
      companySize: profile?.company_size || undefined,
    });

    if (success) synced++;
    else failed++;

    // Rate limit: 100ms between calls
    await new Promise((r) => setTimeout(r, 100));
  }

  return new Response(
    JSON.stringify({ success: true, total: users.length, synced, failed }),
    { headers }
  );
}
