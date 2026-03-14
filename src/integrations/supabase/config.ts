// Supabase configuration for development and production

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export different configurations based on environment types
export const getSupabaseConfig = () => {
    if (process.env.NODE_ENV === 'development') {
        return {
            url: process.env.DEV_SUPABASE_URL,
            key: process.env.DEV_SUPABASE_ANON_KEY,
        };
    }
    return {
        url: process.env.PROD_SUPABASE_URL,
        key: process.env.PROD_SUPABASE_ANON_KEY,
    };
};