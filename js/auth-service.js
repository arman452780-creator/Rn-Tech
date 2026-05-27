import { getSupabase } from './supabase-client.js';

const supabase = getSupabase();

export const authService = {
    async signUp(email, password, fullName) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        console.log("Logout Clicked");
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            // Clear all local storage/session storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Remove specific Supabase keys if any remain
            Object.keys(localStorage).forEach(key => {
                if (key.includes('sb-') || key.includes('supabase')) {
                    localStorage.removeItem(key);
                }
            });

            console.log("Supabase Session Cleared");
        } catch (err) {
            console.error("Logout failed:", err);
            // Even if it fails, try to clear local data
            localStorage.clear();
            sessionStorage.clear();
            throw err;
        }
    },

    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
};
