import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mwytqxblyjvgbqsdurpc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eXRxeGJseWp2Z2Jxc2R1cnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNzYxNzksImV4cCI6MjA1Mzc1MjE3OX0.5IrMeFK4jrvTenIFxDdMgVvpvJzpMsTAqnwJPFesqxQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
