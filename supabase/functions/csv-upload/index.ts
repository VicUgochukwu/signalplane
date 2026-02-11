// CSV Upload Edge Function
// Accepts CSV file uploads, parses, validates, and inserts into objection_tracker.events
// Auth: Authenticated user JWT from browser

import { createSupabaseClient, createServiceRoleClient } from "../_shared/supabase.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { enforceRateLimit, enforceBodySize } from "../_shared/rate-limit.ts";

// =====================================================
// Field mapping (from n8n_code/objection_csv_parser.js)
// =====================================================

const TEXT_FIELDS = [
  "text", "content", "raw_text", "message", "body", "note", "notes",
  "comment", "feedback", "objection", "description",
];
const DATE_FIELDS = [
  "date", "created_at", "created", "timestamp", "time", "sent_date", "received_date",
];
const AUTHOR_FIELDS = [
  "author", "name", "from", "sender", "contact", "first_name", "full_name",
  "customer", "prospect",
];
const URL_FIELDS = ["url", "link", "source_url", "profile_url", "linkedin_url"];

// =====================================================
// CSV Parser
// =====================================================

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csvString: string): Record<string, string>[] {
  const lines = csvString.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
  );

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

// =====================================================
// Field Detection
// =====================================================

function findField(row: Record<string, string>, candidates: string[]): string | null {
  for (const field of candidates) {
    if (row[field] && row[field].trim()) return row[field].trim();
  }
  return null;
}

function parseDate(dateInput: string | null): string {
  if (!dateInput) return new Date().toISOString();
  if (dateInput.includes("T")) return dateInput;
  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function generateExternalId(sourceName: string, row: Record<string, string>): string {
  return (
    row.id ||
    row.external_id ||
    `${sourceName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  );
}

// =====================================================
// Row Mapper
// =====================================================

interface MappedRow {
  external_id: string;
  raw_text: string;
  objection_text: string;
  source_url: string | null;
  source_author: string | null;
  source_date: string;
  meta: Record<string, unknown>;
}

function mapRow(row: Record<string, string>, sourceName: string, sourceType: string): MappedRow | null {
  const rawText = findField(row, TEXT_FIELDS);
  if (!rawText || rawText.length < 10) return null;

  return {
    external_id: generateExternalId(sourceName, row),
    raw_text: rawText,
    objection_text: rawText, // Will be refined by Anthropic later
    source_url: findField(row, URL_FIELDS),
    source_author: findField(row, AUTHOR_FIELDS),
    source_date: parseDate(findField(row, DATE_FIELDS)),
    meta: {
      platform: sourceType,
      import_method: "csv_upload",
      imported_at: new Date().toISOString(),
      company: row.company || row.organization || row.account || null,
      title: row.title || row.job_title || row.position || null,
      deal_stage: row.deal_stage || row.stage || row.status || null,
      deal_value: row.deal_value || row.amount || row.value || null,
      industry: row.industry || null,
      connection_degree: row.connection_degree || row.degree || null,
      profile_url: row.profile_url || row.linkedin_url || null,
    },
  };
}

// =====================================================
// Detect columns for preview
// =====================================================

interface ColumnMapping {
  text: string | null;
  date: string | null;
  author: string | null;
  url: string | null;
  metadata: string[];
}

function detectColumns(headers: string[]): ColumnMapping {
  const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
  const mapping: ColumnMapping = { text: null, date: null, author: null, url: null, metadata: [] };

  for (const h of lowerHeaders) {
    if (!mapping.text && TEXT_FIELDS.includes(h)) mapping.text = h;
    else if (!mapping.date && DATE_FIELDS.includes(h)) mapping.date = h;
    else if (!mapping.author && AUTHOR_FIELDS.includes(h)) mapping.author = h;
    else if (!mapping.url && URL_FIELDS.includes(h)) mapping.url = h;
    else mapping.metadata.push(h);
  }
  return mapping;
}

// =====================================================
// Main Handler
// =====================================================

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  // Reject oversized uploads (5MB limit)
  const sizeBlock = enforceBodySize(req, headers);
  if (sizeBlock) return sizeBlock;

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
    }

    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), { status: 401, headers });
    }

    // Create client with user's JWT to verify identity
    const userClient = createSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
    }

    // Rate limit: 10 uploads per minute per user
    const rateLimited = enforceRateLimit(req, headers, user.id, 10);
    if (rateLimited) return rateLimited;

    // Service role client for inserts
    const serviceClient = createServiceRoleClient();

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sourceName = (formData.get("source_name") as string) || "CSV Import";
    const sourceType = (formData.get("source_type") as string) || "manual";
    const isPreview = new URL(req.url).searchParams.get("preview") === "true";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400, headers });
    }

    // Read and parse CSV
    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "CSV is empty or has no data rows" }),
        { status: 400, headers }
      );
    }

    // Detect column mapping
    const csvHeaders = Object.keys(rows[0]);
    const columnMapping = detectColumns(csvHeaders);

    // Map rows
    const mappedRows: MappedRow[] = [];
    const errors: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const mapped = mapRow(rows[i], sourceName, sourceType);
      if (mapped) {
        mappedRows.push(mapped);
      } else {
        errors.push({ row: i + 2, reason: "Missing or too short text content (min 10 chars)" });
      }
    }

    // Preview mode: return parsed data without inserting
    if (isPreview) {
      return new Response(
        JSON.stringify({
          preview: true,
          column_mapping: columnMapping,
          total_rows: rows.length,
          valid_rows: mappedRows.length,
          skipped_rows: errors.length,
          errors: errors.slice(0, 10),
          sample_data: mappedRows.slice(0, 5).map((r) => ({
            text: r.raw_text.substring(0, 200),
            author: r.source_author,
            date: r.source_date,
            url: r.source_url,
            company: r.meta.company,
          })),
        }),
        { status: 200, headers }
      );
    }

    // Full upload: ensure/create source entry
    // Look up or create a source in objection_tracker.sources
    const { data: existingSource } = await serviceClient
      .schema("objection_tracker" as any)
      .from("sources")
      .select("id")
      .eq("source_name", `CSV: ${sourceName}`)
      .eq("fetch_method", "manual")
      .single();

    let sourceId: string;
    if (existingSource) {
      sourceId = existingSource.id;
    } else {
      // Map source_type to valid enum
      const sourceTypeMap: Record<string, string> = {
        linkedin: "social_media",
        crm: "email",
        call_transcript: "sales_call",
        support: "support_channel",
        manual: "forum", // closest match for manual imports
      };
      const dbSourceType = sourceTypeMap[sourceType] || "forum";

      const { data: newSource, error: sourceError } = await serviceClient
        .schema("objection_tracker" as any)
        .from("sources")
        .insert({
          source_name: `CSV: ${sourceName}`,
          source_type: dbSourceType,
          fetch_method: "manual",
          source_quality: "medium",
          enabled: true,
        })
        .select("id")
        .single();

      if (sourceError || !newSource) {
        return new Response(
          JSON.stringify({ error: "Failed to create source entry", detail: sourceError?.message }),
          { status: 500, headers }
        );
      }
      sourceId = newSource.id;
    }

    // Batch insert events (in chunks of 100)
    const BATCH_SIZE = 100;
    let insertedCount = 0;
    const insertErrors: string[] = [];

    for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
      const batch = mappedRows.slice(i, i + BATCH_SIZE).map((row) => ({
        source_id: sourceId,
        external_id: row.external_id,
        raw_text: row.raw_text,
        objection_text: row.objection_text,
        source_url: row.source_url,
        source_author: row.source_author,
        source_date: row.source_date,
        meta: row.meta,
        processed: false,
        signal_emitted: false,
      }));

      const { error: insertError } = await serviceClient
        .schema("objection_tracker" as any)
        .from("events")
        .insert(batch);

      if (insertError) {
        insertErrors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`);
      } else {
        insertedCount += batch.length;
      }
    }

    // Log usage and check for abuse
    await serviceClient.rpc("log_csv_upload", {
      p_user_id: user.id,
      p_filename: file.name || "unknown.csv",
      p_total_rows: rows.length,
      p_valid_rows: insertedCount,
      p_skipped_rows: errors.length,
      p_source_type: sourceType,
    });

    return new Response(
      JSON.stringify({
        success: insertErrors.length === 0,
        total_rows: rows.length,
        valid_rows: mappedRows.length,
        inserted_rows: insertedCount,
        skipped_rows: errors.length,
        errors: [...errors.slice(0, 10), ...insertErrors.map((e) => ({ row: 0, reason: e }))],
        source_id: sourceId,
      }),
      { status: insertErrors.length === 0 ? 200 : 207, headers }
    );
  } catch (err) {
    console.error("CSV upload error:", err);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your CSV. Please check the file format and try again." }),
      { status: 500, headers }
    );
  }
});
