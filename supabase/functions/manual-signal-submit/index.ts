// Manual Signal Submit Edge Function
// Accepts text-based signal submissions from authenticated users
// Inserts into objection_tracker.events for processing pipeline

import { createSupabaseClient, createServiceRoleClient } from "../_shared/supabase.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

const VALID_SIGNAL_TYPES = [
  'messaging', 'narrative', 'icp', 'horizon', 'objection', 'pricing', 'other',
];

const VALID_SOURCE_TYPES = [
  'sales_call', 'support_ticket', 'crm_note', 'win_loss', 'manual',
];

const SOURCE_TYPE_MAP: Record<string, string> = {
  sales_call: 'sales_call',
  support_ticket: 'support_channel',
  crm_note: 'email',
  win_loss: 'sales_call',
  manual: 'manual',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getCorsHeaders(req);

  try {
    // Only accept POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const supabase = createSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      text,
      signal_type = 'other',
      source_type = 'manual',
      company,
      author,
      severity,
      context,
    } = body;

    // Validate required fields
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Text must be at least 10 characters' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_SIGNAL_TYPES.includes(signal_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid signal_type. Must be one of: ${VALID_SIGNAL_TYPES.join(', ')}` }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_SOURCE_TYPES.includes(source_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid source_type. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}` }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    if (severity !== undefined && (typeof severity !== 'number' || severity < 1 || severity > 5)) {
      return new Response(
        JSON.stringify({ error: 'Severity must be a number between 1 and 5' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for inserts (bypass RLS)
    const serviceClient = createServiceRoleClient();

    // Upsert source for manual submissions
    const mappedSourceType = SOURCE_TYPE_MAP[source_type] || 'manual';
    const sourceName = `Manual Submission (${source_type.replace('_', ' ')})`;

    const { data: sourceData, error: sourceError } = await serviceClient
      .from('sources')
      .select('id')
      .eq('source_name', sourceName)
      .eq('source_type', mappedSourceType)
      .maybeSingle();

    let sourceId: string;

    if (sourceData) {
      sourceId = sourceData.id;
    } else {
      const { data: newSource, error: insertSourceError } = await serviceClient
        .from('sources')
        .insert({
          source_name: sourceName,
          source_type: mappedSourceType,
          import_method: 'manual',
          reliability: 'high',
        })
        .select('id')
        .single();

      if (insertSourceError) {
        console.error('Failed to create source:', insertSourceError);
        return new Response(
          JSON.stringify({ error: 'Failed to create signal source' }),
          { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }
      sourceId = newSource.id;
    }

    // Insert the event
    const trimmedText = text.trim();
    const eventData: Record<string, any> = {
      source_id: sourceId,
      raw_text: trimmedText,
      objection_text: trimmedText,
      source_author: author || user.email || 'Unknown',
      source_date: new Date().toISOString(),
      processed: false,
      signal_emitted: false,
      meta: {
        internal: true,
        submitted_by: user.id,
        submitted_email: user.email,
        submission_method: 'manual_form',
        signal_type,
        source_type,
        ...(company && { company }),
        ...(context && { context }),
      },
    };

    if (severity) {
      eventData.severity = severity;
    }

    if (company) {
      eventData.meta.company = company;
    }

    const { data: eventResult, error: eventError } = await serviceClient
      .from('events')
      .insert(eventData)
      .select('id')
      .single();

    if (eventError) {
      console.error('Failed to insert event:', eventError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit signal' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        event_id: eventResult.id,
        message: 'Signal submitted successfully. It will be processed and included in your next weekly packet.',
      }),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('manual-signal-submit error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
});
