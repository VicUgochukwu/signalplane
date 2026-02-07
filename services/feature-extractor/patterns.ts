// Extraction Patterns - Deterministic rules for feature extraction
// No LLM required - pure regex and DOM parsing

export const PRICING_PATTERNS = {
  // Free tier detection
  free_tier: [
    /free\s*(plan|tier|forever|starter)/i,
    /\$0/,
    /no\s*credit\s*card/i,
    /start\s*for\s*free/i,
    /free\s*trial/i,
  ],

  // Enterprise tier detection
  enterprise: [
    /enterprise/i,
    /custom\s*pricing/i,
    /contact\s*(us|sales)/i,
    /talk\s*to\s*sales/i,
    /get\s*a\s*quote/i,
    /request\s*demo/i,
  ],

  // Trial days extraction
  trial_days: [
    /(\d+)[\s-]*(day|week).*?(trial|free)/i,
    /try.*?(\d+)\s*(day|week)/i,
    /free\s*for\s*(\d+)\s*(day|week)/i,
  ],

  // Pricing model detection
  seat_based: [
    /per\s*(user|seat|member|employee)/i,
    /\$[\d.]+\s*\/\s*(user|seat|member)/i,
    /billed\s*per\s*(user|seat)/i,
  ],

  usage_based: [
    /usage[\s-]based/i,
    /metered/i,
    /pay[\s-]as[\s-]you[\s-]go/i,
    /per\s*(request|call|event|transaction)/i,
  ],

  flat_rate: [
    /flat\s*rate/i,
    /unlimited\s*(users|seats)/i,
    /one\s*price/i,
  ],

  // Enterprise gating signals
  gating: {
    sso: [/sso/i, /single\s*sign[\s-]on/i, /saml/i, /okta/i, /azure\s*ad/i],
    audit_logs: [/audit\s*log/i, /activity\s*log/i, /compliance\s*log/i],
    sla: [/sla/i, /uptime\s*guarantee/i, /99\.\d+%\s*uptime/i],
    dedicated: [/dedicated/i, /private\s*cloud/i, /single[\s-]tenant/i],
    custom_roles: [/custom\s*role/i, /role[\s-]based\s*access/i, /rbac/i],
    api_access: [/api\s*access/i, /api\s*key/i, /developer\s*api/i],
  },

  // Limit extraction patterns
  limits: {
    storage: [/(\d+)\s*(gb|tb|mb)\s*(storage|space)/i],
    users: [/up\s*to\s*(\d+)\s*(user|seat|member)/i, /(\d+)\s*(user|seat|member)\s*limit/i],
    projects: [/(\d+)\s*project/i],
    api_calls: [/(\d+[km]?)\s*(api\s*)?(call|request)/i],
  },
};

export const COMPLIANCE_BADGES = [
  { pattern: /soc\s*2\s*type\s*(ii|2)/i, badge: 'SOC2_TYPE_II' as const },
  { pattern: /soc\s*2/i, badge: 'SOC2' as const },
  { pattern: /hipaa/i, badge: 'HIPAA' as const },
  { pattern: /gdpr/i, badge: 'GDPR' as const },
  { pattern: /iso\s*27001/i, badge: 'ISO27001' as const },
  { pattern: /pci[\s-]dss/i, badge: 'PCI_DSS' as const },
  { pattern: /fedramp/i, badge: 'FEDRAMP' as const },
  { pattern: /ccpa/i, badge: 'CCPA' as const },
  { pattern: /ferpa/i, badge: 'FERPA' as const },
];

export const PROOF_PATTERNS = {
  // Case study indicators
  case_study: [
    /case\s*stud/i,
    /customer\s*stor/i,
    /success\s*stor/i,
    /how\s*.*\s*uses/i,
  ],

  // Testimonial indicators
  testimonial: [
    /testimonial/i,
    /what\s*.*\s*say/i,
    /customer\s*review/i,
    /loved\s*by/i,
  ],

  // Industry extraction
  industries: [
    /healthcare/i,
    /fintech/i,
    /financial\s*services/i,
    /e[\s-]?commerce/i,
    /retail/i,
    /saas/i,
    /enterprise/i,
    /startup/i,
    /government/i,
    /education/i,
    /media/i,
    /technology/i,
  ],

  // Security claims
  security_claims: [
    /end[\s-]to[\s-]end\s*encrypt/i,
    /256[\s-]?bit\s*(aes|encryption)/i,
    /zero[\s-]knowledge/i,
    /penetration\s*test/i,
    /security\s*audit/i,
    /bug\s*bounty/i,
    /data\s*residency/i,
  ],
};

export const INTEGRATION_PATTERNS = {
  // Marketplace presence
  marketplaces: [
    { pattern: /salesforce\s*appexchange/i, name: 'salesforce_appexchange' },
    { pattern: /hubspot\s*marketplace/i, name: 'hubspot_marketplace' },
    { pattern: /shopify\s*app\s*store/i, name: 'shopify_app_store' },
    { pattern: /slack\s*app\s*directory/i, name: 'slack_directory' },
    { pattern: /microsoft\s*appsource/i, name: 'microsoft_appsource' },
    { pattern: /google\s*workspace\s*marketplace/i, name: 'google_workspace' },
    { pattern: /atlassian\s*marketplace/i, name: 'atlassian_marketplace' },
  ],

  // Integration categories
  categories: {
    crm: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'dynamics'],
    data: ['snowflake', 'bigquery', 'redshift', 'databricks', 'fivetran'],
    communication: ['slack', 'teams', 'discord', 'intercom', 'zendesk'],
    identity: ['okta', 'auth0', 'onelogin', 'azure ad', 'google workspace'],
    payments: ['stripe', 'braintree', 'paypal', 'square', 'adyen'],
    analytics: ['segment', 'amplitude', 'mixpanel', 'heap', 'google analytics'],
  },
};

// CTA patterns for universal extraction
export const CTA_PATTERNS = {
  primary: [
    /get\s*started/i,
    /start\s*free/i,
    /try\s*(it\s*)?free/i,
    /sign\s*up/i,
    /create\s*account/i,
    /book\s*(a\s*)?demo/i,
    /request\s*demo/i,
    /contact\s*sales/i,
    /talk\s*to\s*sales/i,
  ],
  secondary: [
    /learn\s*more/i,
    /see\s*how/i,
    /watch\s*demo/i,
    /read\s*more/i,
    /explore/i,
  ],
};
