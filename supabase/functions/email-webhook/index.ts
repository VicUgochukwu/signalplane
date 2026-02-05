import { createServiceRoleClient } from '../_shared/supabase.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' };

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers,
      });
    }

    // Verify webhook signature (Resend uses Svix)
    // For v1: lightweight verification via webhook secret header
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    // Basic verification: ensure Svix headers are present (Resend always sends them)
    if (webhookSecret && (!svixId || !svixTimestamp || !svixSignature)) {
      console.warn('Missing Svix webhook headers');
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 401, headers,
      });
    }

    const event = await req.json();

    // Validate event structure
    if (!event.type || !event.data) {
      return new Response(JSON.stringify({ error: 'Invalid event structure' }), {
        status: 400, headers,
      });
    }

    const eventType = event.type as string;
    const emailId = event.data.email_id as string;

    if (!emailId) {
      console.warn('No email_id in event data:', eventType);
      return new Response(JSON.stringify({ ok: true, message: 'No email_id, skipping' }), {
        status: 200, headers,
      });
    }

    // Supported events
    const supportedEvents = [
      'email.delivered',
      'email.opened',
      'email.clicked',
      'email.bounced',
      'email.complained',
    ];

    if (!supportedEvents.includes(eventType)) {
      console.log('Unsupported event type, acknowledging:', eventType);
      return new Response(JSON.stringify({ ok: true, message: `Event ${eventType} acknowledged` }), {
        status: 200, headers,
      });
    }

    // Process event via RPC
    const supabase = createServiceRoleClient();

    const { error } = await supabase.rpc('admin_handle_email_webhook', {
      p_resend_message_id: emailId,
      p_event_type: eventType,
      p_event_data: event.data,
    });

    if (error) {
      console.error('Webhook RPC error:', error);
      // Still return 200 so Resend doesn't retry indefinitely
      return new Response(JSON.stringify({ ok: true, warning: 'RPC error but acknowledged' }), {
        status: 200, headers,
      });
    }

    console.log(`Processed ${eventType} for message ${emailId}`);

    return new Response(JSON.stringify({ ok: true, event: eventType }), {
      status: 200, headers,
    });
  } catch (error) {
    console.error('Email webhook error:', error);
    // Return 200 to prevent Resend retries on parsing errors
    return new Response(JSON.stringify({ ok: true, error: (error as Error).message }), {
      status: 200, headers,
    });
  }
});
