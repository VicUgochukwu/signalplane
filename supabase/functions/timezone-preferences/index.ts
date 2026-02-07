import { createSupabaseClient, createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrganizationTimezoneSettings {
  id: string;
  name: string;
  timezone: string;
  packet_delivery_day: 'sunday' | 'monday';
  packet_delivery_hour: number;
  week_start_day: 'sunday' | 'monday';
}

interface SupportedTimezone {
  timezone_id: string;
  display_name: string;
  utc_offset: string;
  region: string;
}

interface UpdateTimezoneRequest {
  timezone?: string;
  packet_delivery_day?: 'sunday' | 'monday';
  packet_delivery_hour?: number;
  week_start_day?: 'sunday' | 'monday';
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    const body = await req.json().catch(() => ({}));
    const { action, ...params } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'action is required. Valid actions: get, update, list_supported, get_week_boundaries' }),
        { status: 400, headers }
      );
    }

    // --- Route actions ---
    let result: unknown;

    switch (action) {
      case 'get':
        result = await getTimezoneSettings(req, params.org_id);
        break;

      case 'update':
        result = await updateTimezoneSettings(req, params.org_id, params);
        break;

      case 'list_supported':
        result = await listSupportedTimezones();
        break;

      case 'get_week_boundaries':
        result = await getWeekBoundaries(params.timezone, params.reference_date, params.week_start_day);
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Valid actions: get, update, list_supported, get_week_boundaries` }),
          { status: 400, headers }
        );
    }

    return new Response(JSON.stringify({ data: result }), { headers });
  } catch (error) {
    console.error('timezone-preferences error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('Unauthorized') ? 401 :
                   message.includes('not found') ? 404 : 500;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers }
    );
  }
});

// ---------------------------------------------------------------------------
// Get Timezone Settings
// ---------------------------------------------------------------------------

async function getTimezoneSettings(
  req: Request,
  orgId?: string
): Promise<OrganizationTimezoneSettings> {
  const supabase = createSupabaseClient(req);

  // If no org_id provided, try to get the user's org
  let targetOrgId = orgId;

  if (!targetOrgId) {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: valid session required');
    }

    // Try to get user's organization from a user_organizations table or similar
    // For now, we'll use the default org if no specific org is provided
    const serviceClient = createServiceRoleClient();
    const { data: defaultOrg, error: defaultOrgError } = await serviceClient
      .from('organizations')
      .select('id')
      .eq('slug', 'default')
      .single();

    if (defaultOrgError || !defaultOrg) {
      throw new Error('No organization found. Please provide org_id parameter.');
    }
    targetOrgId = defaultOrg.id;
  }

  // Fetch org timezone settings
  const serviceClient = createServiceRoleClient();
  const { data: org, error } = await serviceClient
    .from('organizations')
    .select('id, name, timezone, packet_delivery_day, packet_delivery_hour, week_start_day')
    .eq('id', targetOrgId)
    .single();

  if (error || !org) {
    throw new Error(`Organization not found: ${targetOrgId}`);
  }

  return org as OrganizationTimezoneSettings;
}

// ---------------------------------------------------------------------------
// Update Timezone Settings
// ---------------------------------------------------------------------------

async function updateTimezoneSettings(
  req: Request,
  orgId: string | undefined,
  updates: UpdateTimezoneRequest
): Promise<OrganizationTimezoneSettings> {
  const supabase = createSupabaseClient(req);

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized: valid session required');
  }

  // Determine target org
  let targetOrgId = orgId;
  if (!targetOrgId) {
    const serviceClient = createServiceRoleClient();
    const { data: defaultOrg } = await serviceClient
      .from('organizations')
      .select('id')
      .eq('slug', 'default')
      .single();

    if (!defaultOrg) {
      throw new Error('No organization found. Please provide org_id parameter.');
    }
    targetOrgId = defaultOrg.id;
  }

  // Validate timezone if provided
  if (updates.timezone) {
    const serviceClient = createServiceRoleClient();
    const { data: validTz } = await serviceClient
      .schema('control_plane')
      .from('supported_timezones')
      .select('timezone_id')
      .eq('timezone_id', updates.timezone)
      .single();

    if (!validTz) {
      throw new Error(`Invalid timezone: ${updates.timezone}. Use action 'list_supported' to see valid options.`);
    }
  }

  // Validate packet_delivery_hour if provided
  if (updates.packet_delivery_hour !== undefined) {
    if (updates.packet_delivery_hour < 0 || updates.packet_delivery_hour > 23) {
      throw new Error('packet_delivery_hour must be between 0 and 23');
    }
  }

  // Validate packet_delivery_day if provided
  if (updates.packet_delivery_day && !['sunday', 'monday'].includes(updates.packet_delivery_day)) {
    throw new Error('packet_delivery_day must be "sunday" or "monday"');
  }

  // Validate week_start_day if provided
  if (updates.week_start_day && !['sunday', 'monday'].includes(updates.week_start_day)) {
    throw new Error('week_start_day must be "sunday" or "monday"');
  }

  // Build update object (only include provided fields)
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.timezone) updateData.timezone = updates.timezone;
  if (updates.packet_delivery_day) updateData.packet_delivery_day = updates.packet_delivery_day;
  if (updates.packet_delivery_hour !== undefined) updateData.packet_delivery_hour = updates.packet_delivery_hour;
  if (updates.week_start_day) updateData.week_start_day = updates.week_start_day;

  // Perform update
  const serviceClient = createServiceRoleClient();
  const { data: updatedOrg, error: updateError } = await serviceClient
    .from('organizations')
    .update(updateData)
    .eq('id', targetOrgId)
    .select('id, name, timezone, packet_delivery_day, packet_delivery_hour, week_start_day')
    .single();

  if (updateError) {
    throw new Error(`Failed to update organization: ${updateError.message}`);
  }

  return updatedOrg as OrganizationTimezoneSettings;
}

// ---------------------------------------------------------------------------
// List Supported Timezones
// ---------------------------------------------------------------------------

async function listSupportedTimezones(): Promise<{
  timezones: SupportedTimezone[];
  by_region: Record<string, SupportedTimezone[]>;
}> {
  const serviceClient = createServiceRoleClient();

  const { data: timezones, error } = await serviceClient
    .schema('control_plane')
    .from('supported_timezones')
    .select('*')
    .order('region')
    .order('display_name');

  if (error) {
    throw new Error(`Failed to fetch supported timezones: ${error.message}`);
  }

  // Group by region for easier frontend display
  const byRegion: Record<string, SupportedTimezone[]> = {};
  for (const tz of timezones as SupportedTimezone[]) {
    if (!byRegion[tz.region]) {
      byRegion[tz.region] = [];
    }
    byRegion[tz.region].push(tz);
  }

  return {
    timezones: timezones as SupportedTimezone[],
    by_region: byRegion,
  };
}

// ---------------------------------------------------------------------------
// Get Week Boundaries (utility for frontend)
// ---------------------------------------------------------------------------

async function getWeekBoundaries(
  timezone?: string,
  referenceDate?: string,
  weekStartDay?: string
): Promise<{
  timezone: string;
  week_start: string;
  week_end: string;
  week_start_local: string;
  week_end_local: string;
}> {
  const tz = timezone || 'America/New_York';
  const refDate = referenceDate || new Date().toISOString();
  const startDay = weekStartDay || 'sunday';

  const serviceClient = createServiceRoleClient();

  const { data, error } = await serviceClient.rpc('get_week_boundaries', {
    p_timezone: tz,
    p_reference_date: refDate,
    p_week_start_day: startDay,
  });

  if (error) {
    throw new Error(`Failed to calculate week boundaries: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    timezone: tz,
    week_start: result.week_start,
    week_end: result.week_end,
    week_start_local: result.week_start_local,
    week_end_local: result.week_end_local,
  };
}
