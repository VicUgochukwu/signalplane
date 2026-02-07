// Feature Extractor Types
// Phase 1: Deterministic extraction before LLM

export interface ExtractedFeatures {
  page_type: PageType;
  extraction_version: string;
  extraction_confidence: number;
  extracted_at: string;

  // Universal features (all page types)
  universal: UniversalFeatures;

  // Page-type specific features
  pricing?: PricingFeatures;
  proof?: ProofFeatures;
  integrations?: IntegrationFeatures;
}

export type PageType =
  | 'homepage'
  | 'pricing'
  | 'security'
  | 'customers'
  | 'case_studies'
  | 'integrations'
  | 'docs'
  | 'comparison'
  | 'partners';

export interface UniversalFeatures {
  cta_count: number;
  cta_labels: string[];
  cta_destinations: string[];
  nav_labels: string[];
  h1_text: string | null;
}

export interface PricingFeatures {
  plan_count: number;
  plan_names: string[];
  has_free_tier: boolean;
  has_enterprise: boolean;
  trial_days: number | null;
  pricing_model: PricingModel;
  gating_signals: GatingSignal[];
  limits: Record<string, string>;
}

export type PricingModel = 'seat' | 'usage' | 'flat' | 'hybrid' | 'unknown';

export type GatingSignal = 'sso' | 'audit_logs' | 'sla' | 'dedicated' | 'custom_roles' | 'api_access';

export interface ProofFeatures {
  logo_count: number;
  logo_companies: string[];
  case_study_count: number;
  case_study_industries: string[];
  testimonial_count: number;
  testimonial_titles: string[];
  compliance_badges: ComplianceBadge[];
  security_claims: string[];
}

export type ComplianceBadge =
  | 'SOC2'
  | 'SOC2_TYPE_II'
  | 'HIPAA'
  | 'GDPR'
  | 'ISO27001'
  | 'PCI_DSS'
  | 'FEDRAMP'
  | 'CCPA'
  | 'FERPA';

export interface IntegrationFeatures {
  integration_count: number;
  integration_names: string[];
  integration_categories: Record<string, string[]>;
  marketplace_presence: string[];
}

// Feature Diff Types
export interface FeatureDiff {
  page_type: PageType;
  has_meaningful_change: boolean;
  change_categories: string[];
  changes: FeatureChange[];
}

export interface FeatureChange {
  field: string;
  old_value: unknown;
  new_value: unknown;
  significance: ChangeSignificance;
}

export type ChangeSignificance = 'major' | 'minor' | 'cosmetic';

// LLM Gating Types
export interface GatingDecision {
  should_call_llm: boolean;
  reason: GatingReason;
  estimated_tokens: number;
}

export type GatingReason =
  | 'no_meaningful_change'
  | 'budget_exhausted'
  | 'cosmetic_only'
  | 'meaningful_change';

export interface CostBudget {
  remaining_calls: number;
  remaining_tokens: number;
}
