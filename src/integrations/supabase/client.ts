import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dnqjzgfunvbofsuibcsk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BRsuub5AYE41NbNlJAbahA_ChcNLP02';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use implicit flow so magic links work when opened in a different browser.
    // PKCE (default) stores a code_verifier in the originating browser's localStorage,
    // which makes cross-browser magic link clicks fail silently.
    flowType: 'implicit',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});
