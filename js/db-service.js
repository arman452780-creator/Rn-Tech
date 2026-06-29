import { getSupabase } from './supabase-client.js';

const supabase = getSupabase();

export const dbService = {
    // --- Notices ---
    async getNotices() {
        const { data, error } = await supabase
            .from('notices')
            .select('*')
            .eq('published', true)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        return data;
    },

    // --- Courses ---
    async getCourses() {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('active', true);
        
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
            .from('students')
            .select('student_name, course, created_at, profile_photo_url')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data;
    },

    // --- Gallery / Slider ---
    async getSliderImages() {
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .eq('show_in_slider', true)
            .order('uploaded_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // --- Upcoming Batches ---
    async getUpcomingBatches() {
        const { data, error } = await supabase
            .from('upcoming_batches')
            .select('*')
            .eq('published', true)
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }
};
