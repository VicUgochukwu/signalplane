// detect-pages Edge Function
// Probes a domain to discover which pages actually exist
// Uses HEAD requests, sitemap parsing, and industry-aware path checking

import { getCorsHeaders, handleCors } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

// ── Path definitions ─────────────────────────────────────────────────

interface PathDef {
  path: string;
  type: string;
  label: string;
}

const BASE_PATHS: PathDef[] = [
  { path: '/', type: 'homepage', label: 'Homepage' },
  { path: '/pricing', type: 'pricing', label: 'Pricing' },
  { path: '/plans', type: 'pricing', label: 'Plans' },
  { path: '/about', type: 'about', label: 'About' },
  { path: '/about-us', type: 'about', label: 'About Us' },
  { path: '/company', type: 'about', label: 'Company' },
  { path: '/blog', type: 'blog', label: 'Blog' },
  { path: '/resources', type: 'resources', label: 'Resources' },
  { path: '/contact', type: 'contact', label: 'Contact' },
  { path: '/support', type: 'support', label: 'Support' },
  { path: '/product', type: 'product', label: 'Product' },
  { path: '/products', type: 'product', label: 'Products' },
  { path: '/features', type: 'features', label: 'Features' },
  { path: '/solutions', type: 'solutions', label: 'Solutions' },
  { path: '/integrations', type: 'integrations', label: 'Integrations' },
  { path: '/customers', type: 'customers', label: 'Customers' },
  { path: '/case-studies', type: 'case-studies', label: 'Case Studies' },
  { path: '/enterprise', type: 'enterprise', label: 'Enterprise' },
  { path: '/careers', type: 'careers', label: 'Careers' },
  { path: '/docs', type: 'docs', label: 'Documentation' },
  { path: '/documentation', type: 'docs', label: 'Documentation' },
];

const INDUSTRY_PATHS: Record<string, PathDef[]> = {
  'Fintech': [
    { path: '/security', type: 'security', label: 'Security' },
    { path: '/compliance', type: 'compliance', label: 'Compliance' },
    { path: '/trust', type: 'trust', label: 'Trust Center' },
    { path: '/legal', type: 'legal', label: 'Legal' },
    { path: '/regulatory', type: 'regulatory', label: 'Regulatory' },
  ],
  'Developer Tools': [
    { path: '/api', type: 'api', label: 'API' },
    { path: '/sdk', type: 'sdk', label: 'SDK' },
    { path: '/changelog', type: 'changelog', label: 'Changelog' },
    { path: '/playground', type: 'playground', label: 'Playground' },
    { path: '/status', type: 'status', label: 'Status' },
  ],
  'E-commerce': [
    { path: '/marketplace', type: 'marketplace', label: 'Marketplace' },
    { path: '/sellers', type: 'sellers', label: 'Sellers' },
    { path: '/partners', type: 'partners', label: 'Partners' },
  ],
  'Healthcare': [
    { path: '/hipaa', type: 'hipaa', label: 'HIPAA' },
    { path: '/security', type: 'security', label: 'Security' },
    { path: '/compliance', type: 'compliance', label: 'Compliance' },
  ],
  'Security': [
    { path: '/trust', type: 'trust', label: 'Trust Center' },
    { path: '/compliance', type: 'compliance', label: 'Compliance' },
    { path: '/soc2', type: 'soc2', label: 'SOC 2' },
    { path: '/security', type: 'security', label: 'Security' },
  ],
  'SaaS / Software': [
    { path: '/changelog', type: 'changelog', label: 'Changelog' },
    { path: '/security', type: 'security', label: 'Security' },
    { path: '/status', type: 'status', label: 'Status' },
  ],
  'Analytics / Data': [
    { path: '/security', type: 'security', label: 'Security' },
    { path: '/compliance', type: 'compliance', label: 'Compliance' },
    { path: '/api', type: 'api', label: 'API' },
  ],
  'Sales / CRM': [
    { path: '/marketplace', type: 'marketplace', label: 'Marketplace' },
    { path: '/partners', type: 'partners', label: 'Partners' },
  ],
  'Marketing / Advertising': [
    { path: '/partners', type: 'partners', label: 'Partners' },
    { path: '/marketplace', type: 'marketplace', label: 'Marketplace' },
  ],
  'HR / Recruiting': [
    { path: '/partners', type: 'partners', label: 'Partners' },
    { path: '/compliance', type: 'compliance', label: 'Compliance' },
  ],
  'AI / Automation': [
    { path: '/api', type: 'api', label: 'API' },
    { path: '/docs', type: 'docs', label: 'Documentation' },
    { path: '/changelog', type: 'changelog', label: 'Changelog' },
    { path: '/security', type: 'security', label: 'Security' },
    { path: '/playground', type: 'playground', label: 'Playground' },
    { path: '/models', type: 'product', label: 'Models' },
    { path: '/use-cases', type: 'solutions', label: 'Use Cases' },
  ],
  'GEO / AEO': [
    { path: '/partners', type: 'partners', label: 'Partners' },
    { path: '/marketplace', type: 'marketplace', label: 'Marketplace' },
    { path: '/api', type: 'api', label: 'API' },
  ],
  'Intent Data': [
    { path: '/api', type: 'api', label: 'API' },
    { path: '/integrations', type: 'integrations', label: 'Integrations' },
    { path: '/partners', type: 'partners', label: 'Partners' },
    { path: '/security', type: 'security', label: 'Security' },
    { path: '/compliance', type: 'compliance', label: 'Compliance' },
  ],
  'Events / Webinars': [
    { path: '/partners', type: 'partners', label: 'Partners' },
    { path: '/marketplace', type: 'marketplace', label: 'Marketplace' },
    { path: '/integrations', type: 'integrations', label: 'Integrations' },
  ],
  'ABM Platforms': [
    { path: '/integrations', type: 'integrations', label: 'Integrations' },
    { path: '/partners', type: 'partners', label: 'Partners' },
    { path: '/api', type: 'api', label: 'API' },
    { path: '/security', type: 'security', label: 'Security' },
  ],
  'Content Tools': [
    { path: '/api', type: 'api', label: 'API' },
    { path: '/changelog', type: 'changelog', label: 'Changelog' },
    { path: '/integrations', type: 'integrations', label: 'Integrations' },
    { path: '/partners', type: 'partners', label: 'Partners' },
  ],
  'Data Enrichment': [
    { path: '/api', type: 'api', label: 'API' },
    { path: '/integrations', type: 'integrations', label: 'Integrations' },
    { path: '/security', type: 'security', label: 'Security' },
    { path: '/compliance', type: 'compliance', label: 'Compliance' },
    { path: '/partners', type: 'partners', label: 'Partners' },
  ],
  'Stack Consolidation': [
    { path: '/integrations', type: 'integrations', label: 'Integrations' },
    { path: '/marketplace', type: 'marketplace', label: 'Marketplace' },
    { path: '/partners', type: 'partners', label: 'Partners' },
    { path: '/security', type: 'security', label: 'Security' },
    { path: '/changelog', type: 'changelog', label: 'Changelog' },
  ],
};

// Type ordering for result ranking (lower = more important)
const TYPE_PRIORITY: Record<string, number> = {
  homepage: 0,
  pricing: 1,
  product: 2,
  features: 3,
  solutions: 4,
  about: 5,
  blog: 6,
  docs: 7,
  integrations: 8,
  customers: 9,
  'case-studies': 10,
  enterprise: 11,
  resources: 12,
  careers: 13,
  contact: 14,
  support: 15,
  security: 16,
  compliance: 17,
  trust: 18,
  api: 19,
  changelog: 20,
};

// ── Detected page interface ──────────────────────────────────────────

interface DetectedPage {
  url: string;
  path: string;
  type: string;
  label: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'head' | 'sitemap' | 'industry_default';
}

// ── Helpers ──────────────────────────────────────────────────────────

function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  // Strip protocol
  d = d.replace(/^https?:\/\//, '');
  // Strip www.
  d = d.replace(/^www\./, '');
  // Strip trailing slash and paths
  d = d.split('/')[0];
  return d;
}

/** Resolve the canonical base URL (with or without www.) */
async function resolveBaseUrl(domain: string): Promise<string> {
  const candidates = [`https://${domain}`, `https://www.${domain}`];

  for (const url of candidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const resp = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'SignalPlane/1.0 (page-detection)' },
      });
      if (resp.ok || resp.status === 301 || resp.status === 302) {
        return url;
      }
    } catch {
      // try next
    } finally {
      clearTimeout(timeout);
    }
  }

  // Default to bare domain
  return `https://${domain}`;
}

/** Run a batch of HEAD requests with concurrency limit */
async function probePages(
  baseUrl: string,
  paths: PathDef[],
  concurrency = 6,
): Promise<DetectedPage[]> {
  const results: DetectedPage[] = [];
  const queue = [...paths];

  async function worker() {
    while (queue.length > 0) {
      const pathDef = queue.shift()!;
      const url = pathDef.path === '/'
        ? baseUrl
        : `${baseUrl}${pathDef.path}`;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        let resp: Response;
        try {
          resp = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            signal: controller.signal,
            headers: { 'User-Agent': 'SignalPlane/1.0 (page-detection)' },
          });
        } catch {
          // HEAD might be blocked, try GET with early abort
          const getController = new AbortController();
          const getTimeout = setTimeout(() => getController.abort(), 3000);
          try {
            resp = await fetch(url, {
              method: 'GET',
              redirect: 'follow',
              signal: getController.signal,
              headers: { 'User-Agent': 'SignalPlane/1.0 (page-detection)' },
            });
          } finally {
            clearTimeout(getTimeout);
          }
        } finally {
          clearTimeout(timeout);
        }

        if (resp.ok) {
          // Check if it's a real page (not a soft 404 / redirect to homepage)
          const finalUrl = resp.url || url;
          const isRedirectToHome = pathDef.path !== '/' &&
            (finalUrl === baseUrl || finalUrl === `${baseUrl}/`);

          if (!isRedirectToHome) {
            results.push({
              url: finalUrl,
              path: pathDef.path,
              type: pathDef.type,
              label: pathDef.label,
              confidence: 'high',
              source: 'head',
            });
          }
        } else if (resp.status === 301 || resp.status === 302) {
          results.push({
            url,
            path: pathDef.path,
            type: pathDef.type,
            label: pathDef.label,
            confidence: 'medium',
            source: 'head',
          });
        }
      } catch {
        // Page doesn't exist or timed out — skip
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.allSettled(workers);

  return results;
}

/** Classify a URL path into a page type */
function classifyPath(urlPath: string): { type: string; label: string } | null {
  const p = urlPath.toLowerCase();

  if (p === '/' || p === '') return { type: 'homepage', label: 'Homepage' };
  if (p.includes('/pricing') || p.includes('/plans')) return { type: 'pricing', label: 'Pricing' };
  if (p.includes('/product') || p.includes('/features')) return { type: 'product', label: 'Product' };
  if (p.includes('/solution')) return { type: 'solutions', label: 'Solutions' };
  if (p.includes('/about') || p.includes('/company')) return { type: 'about', label: 'About' };
  if (p.includes('/blog') || p.includes('/insights')) return { type: 'blog', label: 'Blog' };
  if (p.includes('/resource')) return { type: 'resources', label: 'Resources' };
  if (p.includes('/doc') || p.includes('/documentation')) return { type: 'docs', label: 'Documentation' };
  if (p.includes('/integrat')) return { type: 'integrations', label: 'Integrations' };
  if (p.includes('/customer')) return { type: 'customers', label: 'Customers' };
  if (p.includes('/case-stud')) return { type: 'case-studies', label: 'Case Studies' };
  if (p.includes('/career') || p.includes('/jobs')) return { type: 'careers', label: 'Careers' };
  if (p.includes('/enterprise')) return { type: 'enterprise', label: 'Enterprise' };
  if (p.includes('/security')) return { type: 'security', label: 'Security' };
  if (p.includes('/compliance')) return { type: 'compliance', label: 'Compliance' };
  if (p.includes('/api')) return { type: 'api', label: 'API' };
  if (p.includes('/changelog')) return { type: 'changelog', label: 'Changelog' };
  if (p.includes('/contact')) return { type: 'contact', label: 'Contact' };
  if (p.includes('/support') || p.includes('/help')) return { type: 'support', label: 'Support' };
  if (p.includes('/partner')) return { type: 'partners', label: 'Partners' };
  if (p.includes('/trust')) return { type: 'trust', label: 'Trust Center' };
  if (p.includes('/marketplace')) return { type: 'marketplace', label: 'Marketplace' };

  return null;
}

/** Try to parse sitemap.xml and extract page URLs */
async function parseSitemap(baseUrl: string, domain: string): Promise<DetectedPage[]> {
  const results: DetectedPage[] = [];
  const sitemapUrls = [`${baseUrl}/sitemap.xml`];

  // Also check robots.txt for sitemap location
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const robotsResp = await fetch(`${baseUrl}/robots.txt`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SignalPlane/1.0 (page-detection)' },
    });
    clearTimeout(timeout);

    if (robotsResp.ok) {
      const text = await robotsResp.text();
      const sitemapMatches = text.matchAll(/Sitemap:\s*(.+)/gi);
      for (const match of sitemapMatches) {
        const url = match[1].trim();
        if (url && !sitemapUrls.includes(url)) {
          sitemapUrls.push(url);
        }
      }
    }
  } catch {
    // robots.txt not available
  }

  for (const sitemapUrl of sitemapUrls.slice(0, 3)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(sitemapUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SignalPlane/1.0 (page-detection)' },
      });
      clearTimeout(timeout);

      if (!resp.ok) continue;

      const xml = await resp.text();

      // Extract <loc> tags via regex (simple, reliable for sitemaps)
      const locMatches = xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi);

      for (const match of locMatches) {
        const pageUrl = match[1].trim();

        // Only include pages from the same domain
        if (!pageUrl.includes(domain)) continue;

        try {
          const parsed = new URL(pageUrl);
          const path = parsed.pathname;

          // Only depth ≤ 2 (e.g., /solutions/enterprise/ but not /blog/2024/01/some-post)
          const segments = path.split('/').filter(Boolean);
          if (segments.length > 2) continue;

          // Skip static assets, images, etc.
          if (/\.(jpg|jpeg|png|gif|svg|css|js|xml|json|pdf|ico)$/i.test(path)) continue;

          const classification = classifyPath(path);
          if (classification) {
            results.push({
              url: pageUrl,
              path,
              type: classification.type,
              label: classification.label,
              confidence: 'medium',
              source: 'sitemap',
            });
          }
        } catch {
          // Invalid URL
        }
      }

      // If we got results from the first sitemap, don't check others
      if (results.length > 0) break;
    } catch {
      // Sitemap not available
    }
  }

  return results;
}

// ── Main handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getCorsHeaders(req);
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: jsonHeaders },
      );
    }

    // Auth: require authenticated user
    const supabase = createSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: jsonHeaders },
      );
    }

    // Rate limit: 20 requests per minute per user
    const rateLimitResponse = enforceRateLimit(req, jsonHeaders, user.id, 20);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { domain: rawDomain, industry } = body;

    if (!rawDomain || typeof rawDomain !== 'string') {
      return new Response(
        JSON.stringify({ error: 'domain is required' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const startTime = Date.now();
    const domain = normalizeDomain(rawDomain);

    // Resolve canonical base URL
    const baseUrl = await resolveBaseUrl(domain);

    // Build path list: base + industry-specific (deduplicated by path)
    const allPaths = [...BASE_PATHS];
    if (industry && INDUSTRY_PATHS[industry]) {
      for (const ip of INDUSTRY_PATHS[industry]) {
        if (!allPaths.some((p) => p.path === ip.path)) {
          allPaths.push(ip);
        }
      }
    }

    // Run Tier 1 (HEAD probing) and Tier 2 (sitemap) in parallel
    const [headResults, sitemapResults] = await Promise.allSettled([
      probePages(baseUrl, allPaths, 6),
      parseSitemap(baseUrl, domain),
    ]);

    const headPages = headResults.status === 'fulfilled' ? headResults.value : [];
    const sitemapPages = sitemapResults.status === 'fulfilled' ? sitemapResults.value : [];

    // Merge and deduplicate — prefer HEAD results (higher confidence)
    const pageMap = new Map<string, DetectedPage>();

    // Homepage always included
    if (!headPages.some((p) => p.type === 'homepage')) {
      pageMap.set('homepage', {
        url: baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`,
        path: '/',
        type: 'homepage',
        label: 'Homepage',
        confidence: 'medium',
        source: 'head',
      });
    }

    // Add HEAD results first (higher confidence)
    for (const page of headPages) {
      const key = page.type;
      if (!pageMap.has(key)) {
        pageMap.set(key, page);
      }
    }

    // Add sitemap results if they're new types
    for (const page of sitemapPages) {
      const key = page.type;
      if (!pageMap.has(key)) {
        pageMap.set(key, page);
      }
    }

    // If we got very few results, add industry defaults as low confidence
    if (pageMap.size < 3 && industry && INDUSTRY_PATHS[industry]) {
      for (const ip of INDUSTRY_PATHS[industry]) {
        const key = ip.type;
        if (!pageMap.has(key)) {
          pageMap.set(key, {
            url: `${baseUrl}${ip.path}`,
            path: ip.path,
            type: ip.type,
            label: ip.label,
            confidence: 'low',
            source: 'industry_default',
          });
        }
      }
    }

    // Sort by type priority
    const pages = Array.from(pageMap.values())
      .sort((a, b) => {
        const pa = TYPE_PRIORITY[a.type] ?? 99;
        const pb = TYPE_PRIORITY[b.type] ?? 99;
        return pa - pb;
      })
      .slice(0, 15); // Cap at 15 pages

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        pages,
        detection_metadata: {
          domain,
          duration_ms: durationMs,
          sitemap_found: sitemapPages.length > 0,
          head_checks: allPaths.length,
          pages_found: pages.length,
          industry_applied: industry || null,
        },
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    console.error('detect-pages error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
