import CONFIG from './config.js';

// Initialize the Supabase client
// We use the CDN version in the HTML, which exposes 'supabase' globally
// However, for a cleaner modular approach, we can wrap it here.

let supabaseClient = null;

export const getSupabase = () => {
    if (!supabaseClient) {
        if (typeof supabase === 'undefined') {
            console.error('Supabase library not loaded. Make sure to include the CDN script in your HTML.');
            return null;
        }
        supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    }
    return supabaseClient;
};
