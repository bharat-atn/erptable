// Database configuration for Supabase

const devConfig = {
    url: 'https://your-dev-url.supabase.co',
    key: 'your-development-key',
    database: 'your-development-database'
};

const prodConfig = {
    url: 'https://your-prod-url.supabase.co',
    key: 'your-production-key',
    database: 'your-production-database'
};

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

export default config;