// Ingest External Signal Edge Function
// Called by n8n workflows to insert signals from external platforms
// (Twitter/X, YouTube, GitHub, App Store, Product Hunt)
// Authenticated via shared secret (x-n8n-secret header)

import { createServiceRoleClient } from "../_shared/supabase.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

const N8N_SECRET = Deno.env.get("N8N_WEBHOOK_SECRET");
if (!N8N_SECRET) {
  console.error("CRITICAL: N8N_WEBHOOK_SECRET environment variable is not set");
}

// Generate a deterministic UUID from a string (for dedup of external IDs)
async function stringToUUID(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  // Format as UUID v4-like (set version bits)
  hashArray[6] = (hashArray[6] & 0x0f) | 0x40; // version 4
  hashArray[8] = (hashArray[8] & 0x3f) | 0x80; // variant 1
  const hex = Array.from(hashArray.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

const VALID_SIGNAL_TYPES = [
  "messaging", "narrative", "icp", "horizon", "objection", "pricing", "proof",
  "distribution", "hiring", "launch_decay", "experiment",
  "social", "review", "video", "code", "launch", "community",
  "funding", "talent", "patent", "crm_intel",
  "winloss_win_pattern", "winloss_loss_pattern", "winloss_switch_pattern", "winloss_trend_shift",
  "research_pain_trend", "research_desire_trend", "research_language_shift", "research_criteria_shift",
  "positioning_alignment", "positioning_differentiation", "positioning_narrative_fit", "positioning_drift",
  "packaging_tier_change", "packaging_metric_shift", "packaging_gate_change", "packaging_landscape_shift",
];

const VALID_PLATFORMS = [
  "twitter", "youtube", "github", "app_store", "product_hunt",
  "linkedin", "reddit", "g2", "stack_overflow",
  "crunchbase", "glassdoor", "google_patents", "hubspot", "salesforce",
  "job_board",
];

interface ExternalSignalPayload {
  signal_type: string;
  source_platform: string;
  company_id?: string;
  company_name?: string;   // Used to resolve company_id if not provided
  severity: number;        // 1-5
  confidence: number;      // 0-1
  title: string;
  summary: string;
  evidence_urls: string[];
  source_schema?: string;
  source_table?: string;
  source_id?: string;      // External ID (tweet ID, video ID, etc.)
  meta?: Record<string, unknown>;
  // Triage fields (optional — LLM-enriched in n8n)
  decision_type?: string;
  recommended_asset?: string;
  owner_team?: string;
  time_sensitivity?: string;
  summary_short?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    // Only accept POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
    }

    // Authenticate via shared secret (n8n webhook)
    const secret = req.headers.get("x-n8n-secret");
    if (secret !== N8N_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    // Parse body — supports single signal or array batch
    const raw = await req.json();
    const signals: ExternalSignalPayload[] = Array.isArray(raw) ? raw : [raw];

    if (signals.length === 0) {
      return new Response(JSON.stringify({ error: "Empty payload" }), { status: 400, headers });
    }

    if (signals.length > 50) {
      return new Response(JSON.stringify({ error: "Max 50 signals per batch" }), { status: 400, headers });
    }

    const serviceClient = createServiceRoleClient();
    const results: { index: number; id?: string; error?: string }[] = [];

    for (let i = 0; i < signals.length; i++) {
      const sig = signals[i];

      // Validate required fields
      if (!sig.signal_type || !VALID_SIGNAL_TYPES.includes(sig.signal_type)) {
        results.push({ index: i, error: `Invalid signal_type: ${sig.signal_type}` });
        continue;
      }
      if (!sig.source_platform || !VALID_PLATFORMS.includes(sig.source_platform)) {
        results.push({ index: i, error: `Invalid source_platform: ${sig.source_platform}` });
        continue;
      }
      if (!sig.title || !sig.summary) {
        results.push({ index: i, error: "title and summary are required" });
        continue;
      }
      if (typeof sig.severity !== "number" || sig.severity < 1 || sig.severity > 5) {
        results.push({ index: i, error: "severity must be 1-5" });
        continue;
      }
      if (typeof sig.confidence !== "number" || sig.confidence < 0 || sig.confidence > 1) {
        results.push({ index: i, error: "confidence must be 0-1" });
        continue;
      }

      // Resolve company_id from company_name if needed
      let companyId = sig.company_id || null;
      if (!companyId && sig.company_name) {
        const { data: company } = await serviceClient
          .schema("core")
          .from("companies")
          .select("id")
          .ilike("name", sig.company_name)
          .maybeSingle();
        companyId = company?.id || null;
      }

      // Build source_id for dedup — must be a valid UUID
      // If sig.source_id looks like a UUID, use it directly. Otherwise hash it.
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let sourceId: string;
      if (sig.source_id && uuidRegex.test(sig.source_id)) {
        sourceId = sig.source_id;
      } else if (sig.source_id) {
        // Deterministic UUID from external ID string (e.g., tweet ID, video ID)
        sourceId = await stringToUUID(`${sig.source_platform}:${sig.source_id}`);
      } else {
        sourceId = crypto.randomUUID();
      }

      const sourceSchema = sig.source_schema || "external";
      const sourceTable = sig.source_table || sig.source_platform;

      // Upsert signal (dedup on signal_type + source_schema + source_table + source_id)
      const { data, error } = await serviceClient
        .schema("control_plane")
        .from("signals")
        .upsert(
          {
            signal_type: sig.signal_type,
            source_platform: sig.source_platform,
            company_id: companyId,
            severity: sig.severity,
            confidence: sig.confidence,
            title: sig.title.slice(0, 500),
            summary: sig.summary.slice(0, 5000),
            evidence_urls: sig.evidence_urls || [],
            source_schema: sourceSchema,
            source_table: sourceTable,
            source_id: sourceId,
            meta: {
              ...sig.meta,
              company_name: sig.company_name,
              ingested_at: new Date().toISOString(),
            },
            ...(sig.decision_type && { decision_type: sig.decision_type }),
            ...(sig.recommended_asset && { recommended_asset: sig.recommended_asset }),
            ...(sig.owner_team && { owner_team: sig.owner_team }),
            ...(sig.time_sensitivity && { time_sensitivity: sig.time_sensitivity }),
            ...(sig.summary_short && { summary_short: sig.summary_short }),
          },
          { onConflict: "signal_type,source_schema,source_table,source_id" }
        )
        .select("id")
        .single();

      if (error) {
        console.error(`Signal ${i} insert error:`, error);
        results.push({ index: i, error: error.message });
      } else {
        results.push({ index: i, id: data.id });
      }
    }

    const inserted = results.filter((r) => r.id).length;
    const failed = results.filter((r) => r.error).length;

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        failed,
        results,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("ingest-external-signal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers }
    );
  }
});
