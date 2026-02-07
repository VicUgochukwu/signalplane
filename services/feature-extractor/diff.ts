// Feature Diff Calculator
// Compares two feature extractions and determines significance

import type {
  ExtractedFeatures,
  FeatureDiff,
  FeatureChange,
  ChangeSignificance,
} from './types';

// Significance rules - which changes matter
const SIGNIFICANCE_RULES = {
  // Major changes - always emit signal
  major: [
    'pricing.pricing_model',
    'pricing.plan_count',
    'pricing.has_free_tier',
    'pricing.has_enterprise',
    'proof.compliance_badges',
  ],
  // Minor changes - emit if multiple or with major
  minor: [
    'pricing.trial_days',
    'pricing.gating_signals',
    'proof.logo_count', // if delta > 3
    'proof.case_study_count',
    'integrations.integration_count', // if delta > 5
  ],
  // Cosmetic - don't emit alone
  cosmetic: [
    'universal.cta_labels',
    'universal.nav_labels',
    'universal.h1_text',
  ],
};

export function computeFeatureDiff(
  oldFeatures: ExtractedFeatures | null,
  newFeatures: ExtractedFeatures
): FeatureDiff {
  const changes: FeatureChange[] = [];

  if (!oldFeatures) {
    // First extraction - treat as meaningful
    return {
      page_type: newFeatures.page_type,
      has_meaningful_change: true,
      change_categories: ['initial_extraction'],
      changes: [{
        field: 'initial',
        old_value: null,
        new_value: 'first_extraction',
        significance: 'major',
      }],
    };
  }

  // Compare universal features
  compareUniversal(oldFeatures, newFeatures, changes);

  // Compare page-type specific features
  if (oldFeatures.pricing && newFeatures.pricing) {
    comparePricing(oldFeatures.pricing, newFeatures.pricing, changes);
  }

  if (oldFeatures.proof && newFeatures.proof) {
    compareProof(oldFeatures.proof, newFeatures.proof, changes);
  }

  if (oldFeatures.integrations && newFeatures.integrations) {
    compareIntegrations(oldFeatures.integrations, newFeatures.integrations, changes);
  }

  // Determine if there's a meaningful change
  const hasMajor = changes.some(c => c.significance === 'major');
  const minorCount = changes.filter(c => c.significance === 'minor').length;
  const has_meaningful_change = hasMajor || minorCount >= 2;

  // Collect change categories
  const change_categories = [...new Set(
    changes
      .filter(c => c.significance !== 'cosmetic')
      .map(c => c.field.split('.')[0])
  )];

  return {
    page_type: newFeatures.page_type,
    has_meaningful_change,
    change_categories,
    changes,
  };
}

function compareUniversal(
  old: ExtractedFeatures,
  new_: ExtractedFeatures,
  changes: FeatureChange[]
): void {
  // H1 change
  if (old.universal.h1_text !== new_.universal.h1_text) {
    const isMinorEdit = isSimilarText(
      old.universal.h1_text || '',
      new_.universal.h1_text || ''
    );
    changes.push({
      field: 'universal.h1_text',
      old_value: old.universal.h1_text,
      new_value: new_.universal.h1_text,
      significance: isMinorEdit ? 'cosmetic' : 'minor',
    });
  }

  // CTA changes
  const ctaAdded = new_.universal.cta_labels.filter(
    l => !old.universal.cta_labels.includes(l)
  );
  const ctaRemoved = old.universal.cta_labels.filter(
    l => !new_.universal.cta_labels.includes(l)
  );

  if (ctaAdded.length > 0 || ctaRemoved.length > 0) {
    changes.push({
      field: 'universal.cta_labels',
      old_value: old.universal.cta_labels,
      new_value: new_.universal.cta_labels,
      significance: 'cosmetic',
    });
  }
}

function comparePricing(
  old: NonNullable<ExtractedFeatures['pricing']>,
  new_: NonNullable<ExtractedFeatures['pricing']>,
  changes: FeatureChange[]
): void {
  // Plan count change - MAJOR
  if (old.plan_count !== new_.plan_count) {
    changes.push({
      field: 'pricing.plan_count',
      old_value: old.plan_count,
      new_value: new_.plan_count,
      significance: 'major',
    });
  }

  // Pricing model change - MAJOR
  if (old.pricing_model !== new_.pricing_model) {
    changes.push({
      field: 'pricing.pricing_model',
      old_value: old.pricing_model,
      new_value: new_.pricing_model,
      significance: 'major',
    });
  }

  // Free tier change - MAJOR
  if (old.has_free_tier !== new_.has_free_tier) {
    changes.push({
      field: 'pricing.has_free_tier',
      old_value: old.has_free_tier,
      new_value: new_.has_free_tier,
      significance: 'major',
    });
  }

  // Enterprise tier change - MAJOR
  if (old.has_enterprise !== new_.has_enterprise) {
    changes.push({
      field: 'pricing.has_enterprise',
      old_value: old.has_enterprise,
      new_value: new_.has_enterprise,
      significance: 'major',
    });
  }

  // Trial days change - MINOR
  if (old.trial_days !== new_.trial_days) {
    changes.push({
      field: 'pricing.trial_days',
      old_value: old.trial_days,
      new_value: new_.trial_days,
      significance: 'minor',
    });
  }

  // Gating signals change - MINOR
  const gatingAdded = new_.gating_signals.filter(s => !old.gating_signals.includes(s));
  const gatingRemoved = old.gating_signals.filter(s => !new_.gating_signals.includes(s));

  if (gatingAdded.length > 0 || gatingRemoved.length > 0) {
    changes.push({
      field: 'pricing.gating_signals',
      old_value: old.gating_signals,
      new_value: new_.gating_signals,
      significance: 'minor',
    });
  }
}

function compareProof(
  old: NonNullable<ExtractedFeatures['proof']>,
  new_: NonNullable<ExtractedFeatures['proof']>,
  changes: FeatureChange[]
): void {
  // Compliance badges change - MAJOR
  const badgesAdded = new_.compliance_badges.filter(b => !old.compliance_badges.includes(b));
  const badgesRemoved = old.compliance_badges.filter(b => !new_.compliance_badges.includes(b));

  if (badgesAdded.length > 0 || badgesRemoved.length > 0) {
    changes.push({
      field: 'proof.compliance_badges',
      old_value: old.compliance_badges,
      new_value: new_.compliance_badges,
      significance: 'major',
    });
  }

  // Logo count change - MINOR if delta > 3
  const logoDelta = Math.abs(old.logo_count - new_.logo_count);
  if (logoDelta > 3) {
    changes.push({
      field: 'proof.logo_count',
      old_value: old.logo_count,
      new_value: new_.logo_count,
      significance: 'minor',
    });
  }

  // Case study count change - MINOR
  if (old.case_study_count !== new_.case_study_count) {
    changes.push({
      field: 'proof.case_study_count',
      old_value: old.case_study_count,
      new_value: new_.case_study_count,
      significance: 'minor',
    });
  }

  // Testimonial count change - COSMETIC
  if (Math.abs(old.testimonial_count - new_.testimonial_count) > 2) {
    changes.push({
      field: 'proof.testimonial_count',
      old_value: old.testimonial_count,
      new_value: new_.testimonial_count,
      significance: 'cosmetic',
    });
  }
}

function compareIntegrations(
  old: NonNullable<ExtractedFeatures['integrations']>,
  new_: NonNullable<ExtractedFeatures['integrations']>,
  changes: FeatureChange[]
): void {
  // Integration count change - MINOR if delta > 5
  const integrationDelta = Math.abs(old.integration_count - new_.integration_count);
  if (integrationDelta > 5) {
    changes.push({
      field: 'integrations.integration_count',
      old_value: old.integration_count,
      new_value: new_.integration_count,
      significance: 'minor',
    });
  }

  // New integrations added
  const integrationsAdded = new_.integration_names.filter(
    n => !old.integration_names.includes(n)
  );

  if (integrationsAdded.length > 0) {
    changes.push({
      field: 'integrations.integration_names',
      old_value: old.integration_names,
      new_value: new_.integration_names,
      significance: integrationsAdded.length >= 3 ? 'minor' : 'cosmetic',
    });
  }

  // Marketplace presence change - MINOR
  const marketplacesAdded = new_.marketplace_presence.filter(
    m => !old.marketplace_presence.includes(m)
  );

  if (marketplacesAdded.length > 0) {
    changes.push({
      field: 'integrations.marketplace_presence',
      old_value: old.marketplace_presence,
      new_value: new_.marketplace_presence,
      significance: 'minor',
    });
  }
}

// Utility: Check if two strings are similar (Levenshtein distance)
function isSimilarText(a: string, b: string): boolean {
  if (!a || !b) return false;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return true;

  // Quick check: same first 20 chars
  if (a.substring(0, 20) === b.substring(0, 20)) {
    return true;
  }

  // Check if mostly the same (> 80% overlap)
  const aWords = new Set(a.toLowerCase().split(/\s+/));
  const bWords = new Set(b.toLowerCase().split(/\s+/));

  let overlap = 0;
  for (const word of aWords) {
    if (bWords.has(word)) overlap++;
  }

  const overlapRatio = overlap / Math.max(aWords.size, bWords.size);
  return overlapRatio > 0.8;
}
