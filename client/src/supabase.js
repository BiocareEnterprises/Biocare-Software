import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zrcjkksbuwnvqaivbelr.supabase.co';
const supabaseKey = 'sb_publishable_nlUWebU0Kv_XIrQ6uef9CQ_QJ5PDTBO';

export const supabase = createClient(supabaseUrl, supabaseKey);