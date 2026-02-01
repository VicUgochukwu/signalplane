import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dnqjzgfunvbofsuibcsk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BRsuub5AYE41NbNlJAbahA_ChcNLP02';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
