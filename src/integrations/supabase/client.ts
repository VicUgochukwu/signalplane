import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dnqjzgfunvbofsuibcsk.supabase.co';
// JWT-format anon key required for edge function invocations
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucWp6Z2Z1bnZib2ZzdWliY3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzU1MzYsImV4cCI6MjA4NTUxMTUzNn0._BSLMKejeXdGhxPL_916N_LBP--pLBLkKivfxKNccP0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
