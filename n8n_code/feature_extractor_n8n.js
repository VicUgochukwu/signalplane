// Feature Extractor for n8n Code Node
// Self-contained version with all patterns and logic
// Copy this entire file into an n8n Code node

// ============================================
// PATTERNS
// ============================================

const PRICING_PATTERNS = {
  free_tier: [
    /free\s*(plan|tier|forever|starter)/i,
    /\$0/,
    /no\s*credit\s*card/i,
    /start\s*for\s*free/i,
  ],
  enterprise: [
    /enterprise/i,
    /custom\s*pricing/i,
    /contact\s*(us|sales)/i,
    /talk\s*to\s*sales/i,
  ],
  trial_days: [
    /(\d+)[\s-]*(day|week).*?(trial|free)/i,
    /try.*?(\d+)\s*(day|week)/i,
  ],
  seat_based: [
    /per\s*(user|seat|member)/i,
    /\$[\d.]+\s*\/\s*(user|seat)/i,
  ],
  usage_based: [
    /usage[\s-]based/i,
    /metered/i,
    /pay[\s-]as[\s-]you[\s-]go/i,
  ],
  gating: {
    sso: [/sso/i, /single\s*sign[\s-]on/i, /saml/i],
    audit_logs: [/audit\s*log/i],
    sla: [/sla/i, /uptime\s*guarantee/i],
    dedicated: [/dedicated/i, /private\s*cloud/i],
  },
};

const COMPLIANCE_BADGES = [
  { pattern: /soc\s*2\s*type\s*(ii|2)/i, badge: 'SOC2_TYPE_II' },
  { pattern: /soc\s*2/i, badge: 'SOC2' },
  { pattern: /hipaa/i, badge: 'HIPAA' },
  { pattern: /gdpr/i, badge: 'GDPR' },
  { pattern: /iso\s*27001/i, badge: 'ISO27001' },
  { pattern: /pci[\s-]dss/i, badge: 'PCI_DSS' },
];

const CTA_PATTERNS = {
  primary: [
    /get\s*started/i,
    /start\s*free/i,
    /try\s*(it\s*)?free/i,
    /sign\s*up/i,
    /book\s*(a\s*)?demo/i,
  ],
};

// ============================================
// UTILITIES
// ============================================

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================
// EXTRACTOR
// ============================================

function extractFeatures(html, pageType) {
  const text = stripHtml(html);
  const lowercaseText = text.toLowerCase();

  const features = {
    page_type: pageType,
    extraction_version: 'v1',
    extraction_confidence: 0.8,
    extracted_at: new Date().toISOString(),
    universal: extractUniversalFeatures(html, text),
  };

  if (pageType === 'pricing') {
    features.pricing = extractPricingFeatures(html, text, lowercaseText);
  } else if (['security', 'customers', 'homepage'].includes(pageType)) {
    features.proof = extractProofFeatures(html, text, lowercaseText);
  }

  return features;
}

function extractUniversalFeatures(html, text) {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
  const h1_text = h1Match ? stripHtml(h1Match[1]).trim() : null;

  const ctas = extractCTAs(html);

  return {
    cta_count: ctas.labels.length,
    cta_labels: ctas.labels,
    cta_destinations: ctas.destinations,
    nav_labels: [],
    h1_text,
  };
}

function extractCTAs(html) {
  const labels = [];
  const destinations = [];

  const buttonRegex = /<(button|a)[^>]*>(.*?)<\/\1>/gis;
  let match;

  while ((match = buttonRegex.exec(html)) !== null) {
    const content = stripHtml(match[2]).trim();
    if (!content || content.length > 50) continue;

    const isPrimaryCTA = CTA_PATTERNS.primary.some(p => p.test(content));
    if (isPrimaryCTA) {
      labels.push(content);
      const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
      if (hrefMatch) destinations.push(hrefMatch[1]);
    }
  }

  return { labels: [...new Set(labels)], destinations: [...new Set(destinations)] };
}

function extractPricingFeatures(html, text, lowercaseText) {
  const has_free_tier = PRICING_PATTERNS.free_tier.some(p => p.test(lowercaseText));
  const has_enterprise = PRICING_PATTERNS.enterprise.some(p => p.test(lowercaseText));

  let trial_days = null;
  for (const pattern of PRICING_PATTERNS.trial_days) {
    const match = lowercaseText.match(pattern);
    if (match) {
      trial_days = parseInt(match[1], 10);
      if (match[2]?.toLowerCase() === 'week') trial_days *= 7;
      break;
    }
  }

  const seatScore = PRICING_PATTERNS.seat_based.filter(p => p.test(lowercaseText)).length;
  const usageScore = PRICING_PATTERNS.usage_based.filter(p => p.test(lowercaseText)).length;
  let pricing_model = 'unknown';
  if (seatScore > 0 && usageScore > 0) pricing_model = 'hybrid';
  else if (seatScore > usageScore) pricing_model = 'seat';
  else if (usageScore > 0) pricing_model = 'usage';

  const gating_signals = [];
  for (const [signal, patterns] of Object.entries(PRICING_PATTERNS.gating)) {
    if (patterns.some(p => p.test(lowercaseText))) {
      gating_signals.push(signal);
    }
  }

  const priceMatches = html.match(/\$[\d,]+(\.\d{2})?/g);
  const plan_count = priceMatches ? Math.min(priceMatches.length, 5) : 3;

  return {
    plan_count,
    plan_names: [],
    has_free_tier,
    has_enterprise,
    trial_days,
    pricing_model,
    gating_signals,
    limits: {},
  };
}

function extractProofFeatures(html, text, lowercaseText) {
  const logoImages = html.match(/<img[^>]*(?:logo|customer|client)[^>]*>/gi) || [];
  const logo_count = logoImages.length;

  const compliance_badges = [];
  for (const { pattern, badge } of COMPLIANCE_BADGES) {
    if (pattern.test(lowercaseText)) {
      if (badge === 'SOC2' && compliance_badges.includes('SOC2_TYPE_II')) continue;
      compliance_badges.push(badge);
    }
  }

  const quoteBlocks = html.match(/<blockquote/gi) || [];
  const testimonial_count = quoteBlocks.length;

  return {
    logo_count,
    logo_companies: [],
    case_study_count: 0,
    case_study_industries: [],
    testimonial_count,
    testimonial_titles: [],
    compliance_badges,
    security_claims: [],
  };
}

// ============================================
// DIFF CALCULATOR
// ============================================

function computeFeatureDiff(oldFeatures, newFeatures) {
  const changes = [];

  if (!oldFeatures) {
    return {
      page_type: newFeatures.page_type,
      has_meaningful_change: true,
      change_categories: ['initial_extraction'],
      changes: [{ field: 'initial', old_value: null, new_value: 'first_extraction', significance: 'major' }],
    };
  }

  // Compare pricing
  if (oldFeatures.pricing && newFeatures.pricing) {
    const old = oldFeatures.pricing;
    const new_ = newFeatures.pricing;

    if (old.plan_count !== new_.plan_count) {
      changes.push({ field: 'pricing.plan_count', old_value: old.plan_count, new_value: new_.plan_count, significance: 'major' });
    }
    if (old.pricing_model !== new_.pricing_model) {
      changes.push({ field: 'pricing.pricing_model', old_value: old.pricing_model, new_value: new_.pricing_model, significance: 'major' });
    }
    if (old.has_free_tier !== new_.has_free_tier) {
      changes.push({ field: 'pricing.has_free_tier', old_value: old.has_free_tier, new_value: new_.has_free_tier, significance: 'major' });
    }
    if (old.has_enterprise !== new_.has_enterprise) {
      changes.push({ field: 'pricing.has_enterprise', old_value: old.has_enterprise, new_value: new_.has_enterprise, significance: 'major' });
    }
    if (old.trial_days !== new_.trial_days) {
      changes.push({ field: 'pricing.trial_days', old_value: old.trial_days, new_value: new_.trial_days, significance: 'minor' });
    }
  }

  // Compare proof
  if (oldFeatures.proof && newFeatures.proof) {
    const old = oldFeatures.proof;
    const new_ = newFeatures.proof;

    const badgesAdded = new_.compliance_badges.filter(b => !old.compliance_badges.includes(b));
    if (badgesAdded.length > 0) {
      changes.push({ field: 'proof.compliance_badges', old_value: old.compliance_badges, new_value: new_.compliance_badges, significance: 'major' });
    }

    if (Math.abs(old.logo_count - new_.logo_count) > 3) {
      changes.push({ field: 'proof.logo_count', old_value: old.logo_count, new_value: new_.logo_count, significance: 'minor' });
    }
  }

  const hasMajor = changes.some(c => c.significance === 'major');
  const minorCount = changes.filter(c => c.significance === 'minor').length;

  return {
    page_type: newFeatures.page_type,
    has_meaningful_change: hasMajor || minorCount >= 2,
    change_categories: [...new Set(changes.filter(c => c.significance !== 'cosmetic').map(c => c.field.split('.')[0]))],
    changes,
  };
}

// ============================================
// LLM GATING
// ============================================

function shouldCallLLM(featureDiff, budget) {
  if (!featureDiff.has_meaningful_change) {
    return { should_call_llm: false, reason: 'no_meaningful_change', estimated_tokens: 0 };
  }

  if (budget.remaining_calls <= 0) {
    return { should_call_llm: false, reason: 'budget_exhausted', estimated_tokens: 0 };
  }

  const nonCosmeticChanges = featureDiff.changes.filter(c => c.significance !== 'cosmetic');
  if (nonCosmeticChanges.length === 0) {
    return { should_call_llm: false, reason: 'cosmetic_only', estimated_tokens: 0 };
  }

  const estimatedTokens = 500 + featureDiff.changes.length * 100;
  return { should_call_llm: true, reason: 'meaningful_change', estimated_tokens: estimatedTokens };
}

// ============================================
// N8N ENTRY POINT
// ============================================

// Get input from previous node
const input = $input.first().json;
const html = input.html || input.content || '';
const pageType = input.page_type || 'homepage';
const previousFeatures = input.previous_features || null;
const budget = input.budget || { remaining_calls: 100, remaining_tokens: 100000 };

// Extract features
const features = extractFeatures(html, pageType);

// Compute diff
const diff = computeFeatureDiff(previousFeatures, features);

// Gate LLM
const gatingDecision = shouldCallLLM(diff, budget);

// Return results
return [{
  json: {
    features,
    diff,
    gating_decision: gatingDecision,
    should_skip_llm: !gatingDecision.should_call_llm,
    skip_reason: gatingDecision.reason,
  }
}];
