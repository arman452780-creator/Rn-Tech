import { getSupabase } from './supabase-client.js';

const supabase = getSupabase();

export const dbService = {
    // --- Notices ---
    async getNotices() {
        const { data, error } = await supabase
            .from('notices')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // --- Courses ---
    async getCourses() {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('is_active', true);
        
        if (error) throw error;
        return data;
    },

    // --- Registrations ---
    async submitRegistration(formData) {
        const { data, error } = await supabase
            .from('registrations')
            .insert([formData]);
        
        if (error) throw error;
        return data;
    },

    // --- Contact Messages ---
    async submitContactMessage(messageData) {
        const { data, error } = await supabase
            .from('contact_messages')
            .insert([messageData]);
        
        if (error) throw error;
        return data;
    },

    // --- Recent Admissions (for index page) ---
    async getRecentAdmissions(limit = 5) {
        const { data, error } = await supabase
            .from('registrations')
            .select('full_name, course_name, created_at')
            .eq('status', 'approved') // Only show approved ones
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data;
    }
};
