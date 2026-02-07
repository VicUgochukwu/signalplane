// Load User Context for Company-Aware Packet Generation
// This node fetches user company profile and tracked competitors from Supabase
// Add this node BEFORE "Score + Select Top Signals" in the workflow

// Get user_id from workflow input or trigger
// For scheduled workflows, you'll need to loop through all users with completed onboarding
// For on-demand/webhook, get user_id from the request

// Option 1: Single user (webhook-triggered or manual run)
const userId = $input.first()?.json?.user_id || null;

// Option 2: For scheduled runs, query all onboarded users
// This would be done in a separate "Get All Onboarded Users" node

if (!userId) {
  // No user context - run in generic mode
  return [{
    json: {
      user_id: null,
      company_name: null,
      company_domain: null,
      competitor_ids: [],
      competitor_names: [],
      competitor_domains: [],
      is_personalized: false
    }
  }];
}

// Note: In n8n, you would use a Supabase node or HTTP Request node
// to call the get_user_context function. Example SQL:
//
// SELECT * FROM public.get_user_context('{{ userId }}');
//
// This returns:
// - company_name
// - company_domain
// - competitor_ids (UUID[])
// - competitor_names (TEXT[])
// - competitor_domains (TEXT[])

// For this Code node, we'll format the expected output structure
// The actual Supabase query should be done in a Supabase/Postgres node

// Expected input from Supabase query result:
const supabaseResult = $input.first()?.json;

return [{
  json: {
    user_id: userId,
    company_name: supabaseResult?.company_name || null,
    company_domain: supabaseResult?.company_domain || null,
    competitor_ids: supabaseResult?.competitor_ids || [],
    competitor_names: supabaseResult?.competitor_names || [],
    competitor_domains: supabaseResult?.competitor_domains || [],
    is_personalized: !!(supabaseResult?.company_name)
  }
}];
