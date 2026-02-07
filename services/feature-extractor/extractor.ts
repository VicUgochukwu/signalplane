// Feature Extractor - Deterministic HTML extraction
// Designed to run in n8n Code nodes or as standalone service

import type {
  ExtractedFeatures,
  PageType,
  UniversalFeatures,
  PricingFeatures,
  ProofFeatures,
  IntegrationFeatures,
  PricingModel,
  GatingSignal,
  ComplianceBadge,
} from './types';

import {
  PRICING_PATTERNS,
  COMPLIANCE_BADGES,
  PROOF_PATTERNS,
  INTEGRATION_PATTERNS,
  CTA_PATTERNS,
} from './patterns';

// For n8n, we use basic string parsing. For full Node.js, use cheerio.
// This implementation works in both environments.

export function extractFeatures(html: string, pageType: PageType): ExtractedFeatures {
  const text = stripHtml(html);
  const lowercaseText = text.toLowerCase();
  const lowercaseHtml = html.toLowerCase();

  const features: ExtractedFeatures = {
    page_type: pageType,
    extraction_version: 'v1',
    extraction_confidence: 0.8,
    extracted_at: new Date().toISOString(),
    universal: extractUniversalFeatures(html, text),
  };

  // Extract page-type specific features
  switch (pageType) {
    case 'pricing':
      features.pricing = extractPricingFeatures(html, text, lowercaseText);
      break;
    case 'security':
    case 'customers':
    case 'case_studies':
    case 'homepage':
      features.proof = extractProofFeatures(html, text, lowercaseText, lowercaseHtml);
      break;
    case 'integrations':
      features.integrations = extractIntegrationFeatures(html, text, lowercaseText);
      break;
  }

  // Calculate confidence based on extraction quality
  features.extraction_confidence = calculateConfidence(features);

  return features;
}

function extractUniversalFeatures(html: string, text: string): UniversalFeatures {
  // Extract H1
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
  const h1_text = h1Match ? stripHtml(h1Match[1]).trim() : null;

  // Extract CTAs (buttons and links with CTA text)
  const ctas = extractCTAs(html);

  // Extract navigation labels
  const nav_labels = extractNavLabels(html);

  return {
    cta_count: ctas.labels.length,
    cta_labels: ctas.labels,
    cta_destinations: ctas.destinations,
    nav_labels,
    h1_text,
  };
}

function extractCTAs(html: string): { labels: string[]; destinations: string[] } {
  const labels: string[] = [];
  const destinations: string[] = [];

  // Find buttons and links
  const buttonRegex = /<(button|a)[^>]*>(.*?)<\/\1>/gis;
  let match;

  while ((match = buttonRegex.exec(html)) !== null) {
    const content = stripHtml(match[2]).trim();
    if (!content || content.length > 50) continue;

    // Check if it matches CTA patterns
    const isPrimaryCTA = CTA_PATTERNS.primary.some(p => p.test(content));
    const isSecondaryCTA = CTA_PATTERNS.secondary.some(p => p.test(content));

    if (isPrimaryCTA || isSecondaryCTA) {
      labels.push(content);

      // Extract href if it's an anchor
      const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
      if (hrefMatch) {
        destinations.push(hrefMatch[1]);
      }
    }
  }

  return { labels: [...new Set(labels)], destinations: [...new Set(destinations)] };
}

function extractNavLabels(html: string): string[] {
  const labels: string[] = [];

  // Find nav elements
  const navRegex = /<nav[^>]*>(.*?)<\/nav>/gis;
  let navMatch;

  while ((navMatch = navRegex.exec(html)) !== null) {
    const navContent = navMatch[1];
    // Extract link text within nav
    const linkRegex = /<a[^>]*>(.*?)<\/a>/gis;
    let linkMatch;

    while ((linkMatch = linkRegex.exec(navContent)) !== null) {
      const text = stripHtml(linkMatch[1]).trim();
      if (text && text.length < 30 && !text.includes('\n')) {
        labels.push(text);
      }
    }
  }

  return [...new Set(labels)].slice(0, 20); // Limit to 20 nav items
}

function extractPricingFeatures(html: string, text: string, lowercaseText: string): PricingFeatures {
  // Detect plans by looking for pricing cards/tiers
  const planNames = extractPlanNames(html);
  const plan_count = planNames.length || countPricingTiers(html);

  // Free tier detection
  const has_free_tier = PRICING_PATTERNS.free_tier.some(p => p.test(lowercaseText));

  // Enterprise tier detection
  const has_enterprise = PRICING_PATTERNS.enterprise.some(p => p.test(lowercaseText));

  // Trial days extraction
  let trial_days: number | null = null;
  for (const pattern of PRICING_PATTERNS.trial_days) {
    const match = lowercaseText.match(pattern);
    if (match) {
      trial_days = parseInt(match[1], 10);
      if (match[2]?.toLowerCase() === 'week') {
        trial_days *= 7;
      }
      break;
    }
  }

  // Pricing model detection
  const pricing_model = detectPricingModel(lowercaseText);

  // Gating signals
  const gating_signals = detectGatingSignals(lowercaseText);

  // Limits extraction
  const limits = extractLimits(lowercaseText);

  return {
    plan_count,
    plan_names: planNames,
    has_free_tier,
    has_enterprise,
    trial_days,
    pricing_model,
    gating_signals,
    limits,
  };
}

function extractPlanNames(html: string): string[] {
  const names: string[] = [];

  // Common plan name patterns
  const planPatterns = [
    /class="[^"]*plan[^"]*"[^>]*>.*?<[^>]*>([^<]+)/gi,
    /class="[^"]*tier[^"]*"[^>]*>.*?<[^>]*>([^<]+)/gi,
    /<h[23][^>]*>([^<]*(?:Free|Starter|Basic|Pro|Professional|Business|Enterprise|Team|Growth|Scale|Plus|Premium)[^<]*)<\/h[23]>/gi,
  ];

  for (const pattern of planPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const name = stripHtml(match[1]).trim();
      if (name && name.length < 30) {
        names.push(name);
      }
    }
  }

  return [...new Set(names)];
}

function countPricingTiers(html: string): number {
  // Count pricing cards by common class patterns
  const cardPatterns = [
    /class="[^"]*pricing[^"]*card/gi,
    /class="[^"]*plan[^"]*card/gi,
    /class="[^"]*tier/gi,
  ];

  let maxCount = 0;
  for (const pattern of cardPatterns) {
    const matches = html.match(pattern);
    if (matches && matches.length > maxCount) {
      maxCount = matches.length;
    }
  }

  // Also count price displays
  const priceMatches = html.match(/\$[\d,]+(\.\d{2})?/g);
  if (priceMatches && priceMatches.length > maxCount) {
    maxCount = Math.min(priceMatches.length, 5); // Cap at 5 tiers
  }

  return maxCount || 3; // Default to 3 if nothing found
}

function detectPricingModel(text: string): PricingModel {
  const seatScore = PRICING_PATTERNS.seat_based.filter(p => p.test(text)).length;
  const usageScore = PRICING_PATTERNS.usage_based.filter(p => p.test(text)).length;
  const flatScore = PRICING_PATTERNS.flat_rate.filter(p => p.test(text)).length;

  if (seatScore > 0 && usageScore > 0) return 'hybrid';
  if (seatScore > usageScore && seatScore > flatScore) return 'seat';
  if (usageScore > seatScore && usageScore > flatScore) return 'usage';
  if (flatScore > 0) return 'flat';
  return 'unknown';
}

function detectGatingSignals(text: string): GatingSignal[] {
  const signals: GatingSignal[] = [];

  for (const [signal, patterns] of Object.entries(PRICING_PATTERNS.gating)) {
    if (patterns.some(p => p.test(text))) {
      signals.push(signal as GatingSignal);
    }
  }

  return signals;
}

function extractLimits(text: string): Record<string, string> {
  const limits: Record<string, string> = {};

  for (const [limitType, patterns] of Object.entries(PRICING_PATTERNS.limits)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        limits[limitType] = match[1] + (match[2] || '');
        break;
      }
    }
  }

  return limits;
}

function extractProofFeatures(
  html: string,
  text: string,
  lowercaseText: string,
  lowercaseHtml: string
): ProofFeatures {
  // Logo count (images with company-like names or in logo sections)
  const logoCount = countLogos(html);
  const logo_companies = extractLogoCompanies(html);

  // Case studies
  const case_study_count = countCaseStudies(html, lowercaseText);
  const case_study_industries = extractIndustries(lowercaseText);

  // Testimonials
  const testimonial_count = countTestimonials(html, lowercaseText);
  const testimonial_titles = extractTestimonialTitles(html);

  // Compliance badges
  const compliance_badges = extractComplianceBadges(lowercaseText);

  // Security claims
  const security_claims = extractSecurityClaims(lowercaseText);

  return {
    logo_count: logoCount,
    logo_companies,
    case_study_count,
    case_study_industries,
    testimonial_count,
    testimonial_titles,
    compliance_badges,
    security_claims,
  };
}

function countLogos(html: string): number {
  // Look for logo sections
  const logoSectionRegex = /class="[^"]*logo[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi;
  const logoSections = html.match(logoSectionRegex) || [];

  let count = 0;
  for (const section of logoSections) {
    const imgCount = (section.match(/<img/gi) || []).length;
    count += imgCount;
  }

  // Also count images with "logo" or "customer" in src/alt
  const logoImages = html.match(/<img[^>]*(?:logo|customer|client|partner)[^>]*>/gi) || [];
  count = Math.max(count, logoImages.length);

  return count;
}

function extractLogoCompanies(html: string): string[] {
  const companies: string[] = [];

  // Extract from alt tags
  const imgRegex = /<img[^>]*alt=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const alt = match[1].toLowerCase();
    if (alt.includes('logo') || alt.includes('customer')) {
      // Extract company name from alt text
      const name = match[1]
        .replace(/logo/gi, '')
        .replace(/customer/gi, '')
        .trim();
      if (name && name.length < 30) {
        companies.push(name);
      }
    }
  }

  return [...new Set(companies)].slice(0, 20);
}

function countCaseStudies(html: string, text: string): number {
  let count = 0;

  // Count links to case studies
  const caseStudyLinks = html.match(/href="[^"]*case[^"]*stud[^"]*"/gi) || [];
  count += caseStudyLinks.length;

  // Count case study cards
  const caseStudyCards = html.match(/class="[^"]*case[^"]*stud[^"]*"/gi) || [];
  count = Math.max(count, caseStudyCards.length);

  return count;
}

function extractIndustries(text: string): string[] {
  const industries: string[] = [];

  for (const pattern of PROOF_PATTERNS.industries) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) {
        industries.push(match[0].toLowerCase());
      }
    }
  }

  return [...new Set(industries)];
}

function countTestimonials(html: string, text: string): number {
  // Look for testimonial/quote patterns
  const quoteBlocks = html.match(/<blockquote/gi) || [];
  let count = quoteBlocks.length;

  // Also look for testimonial classes
  const testimonialClasses = html.match(/class="[^"]*testimonial[^"]*"/gi) || [];
  count = Math.max(count, testimonialClasses.length);

  // Look for review/quote cards
  const reviewCards = html.match(/class="[^"]*(?:review|quote)[^"]*card/gi) || [];
  count = Math.max(count, reviewCards.length);

  return count;
}

function extractTestimonialTitles(html: string): string[] {
  const titles: string[] = [];

  // Common job title patterns near testimonials
  const titlePatterns = [
    /(?:CEO|CTO|VP|Director|Manager|Head|Lead|Founder|Co-founder)[^<]*/gi,
    /(?:at|@)\s+([A-Z][a-zA-Z]+)/g,
  ];

  for (const pattern of titlePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const title = stripHtml(match[0]).trim();
      if (title && title.length < 50) {
        titles.push(title);
      }
    }
  }

  return [...new Set(titles)].slice(0, 10);
}

function extractComplianceBadges(text: string): ComplianceBadge[] {
  const badges: ComplianceBadge[] = [];

  for (const { pattern, badge } of COMPLIANCE_BADGES) {
    if (pattern.test(text)) {
      // Avoid duplicates (e.g., SOC2 vs SOC2_TYPE_II)
      if (badge === 'SOC2' && badges.includes('SOC2_TYPE_II')) continue;
      badges.push(badge);
    }
  }

  return badges;
}

function extractSecurityClaims(text: string): string[] {
  const claims: string[] = [];

  for (const pattern of PROOF_PATTERNS.security_claims) {
    const match = text.match(pattern);
    if (match) {
      claims.push(match[0]);
    }
  }

  return [...new Set(claims)];
}

function extractIntegrationFeatures(
  html: string,
  text: string,
  lowercaseText: string
): IntegrationFeatures {
  const integration_names = extractIntegrationNames(html, lowercaseText);
  const integration_categories = categorizeIntegrations(integration_names);
  const marketplace_presence = detectMarketplacePresence(lowercaseText);

  return {
    integration_count: integration_names.length,
    integration_names,
    integration_categories,
    marketplace_presence,
  };
}

function extractIntegrationNames(html: string, text: string): string[] {
  const names: string[] = [];

  // Look for known integrations
  for (const [category, integrations] of Object.entries(INTEGRATION_PATTERNS.categories)) {
    for (const integration of integrations) {
      if (text.includes(integration.toLowerCase())) {
        names.push(integration);
      }
    }
  }

  return [...new Set(names)];
}

function categorizeIntegrations(names: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {};

  for (const name of names) {
    for (const [category, integrations] of Object.entries(INTEGRATION_PATTERNS.categories)) {
      if (integrations.some(i => i.toLowerCase() === name.toLowerCase())) {
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(name);
      }
    }
  }

  return categories;
}

function detectMarketplacePresence(text: string): string[] {
  const marketplaces: string[] = [];

  for (const { pattern, name } of INTEGRATION_PATTERNS.marketplaces) {
    if (pattern.test(text)) {
      marketplaces.push(name);
    }
  }

  return marketplaces;
}

function calculateConfidence(features: ExtractedFeatures): number {
  let confidence = 0.5; // Base confidence

  // Universal features present
  if (features.universal.h1_text) confidence += 0.1;
  if (features.universal.cta_count > 0) confidence += 0.1;
  if (features.universal.nav_labels.length > 0) confidence += 0.1;

  // Page-specific features
  if (features.pricing) {
    if (features.pricing.plan_count > 0) confidence += 0.1;
    if (features.pricing.pricing_model !== 'unknown') confidence += 0.1;
  }

  if (features.proof) {
    if (features.proof.logo_count > 0) confidence += 0.1;
    if (features.proof.compliance_badges.length > 0) confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

// Utility: Strip HTML tags
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Export for n8n
export { stripHtml };
