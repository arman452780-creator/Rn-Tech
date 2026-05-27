import { getSupabase } from './supabase-client.js';

export const adminService = {
    // --- Students ---
    async getAllStudents() {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addStudent(studentData) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('students')
            .insert([studentData])
            .select();
        if (error) throw error;
        return data[0];
    },

    async updateStudent(id, studentData) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('students')
            .update(studentData)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async deleteStudent(id) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- Courses ---
    async getAllCourses() {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addCourse(courseData) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('courses')
            .insert([courseData])
            .select();
        if (error) throw error;
        return data[0];
    },

    async updateCourse(id, courseData) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('courses')
            .update(courseData)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async deleteCourse(id) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- Notices ---
    async getAllNotices() {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addNotice(noticeData) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('notices')
            .insert([noticeData])
            .select();
        return { data, error };
    },

    async updateNotice(id, noticeData) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('notices')
            .update(noticeData)
            .eq('id', id)
            .select();
        return { data, error };
    },

    async deleteNotice(id) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase
            .from('notices')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- Upcoming Batches ---
    async getAllBatches() {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('upcoming_batches')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addBatch(batchData) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('upcoming_batches')
            .insert([batchData])
            .select();
        return { data, error };
    },

    async updateBatch(id, batchData) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('upcoming_batches')
            .update(batchData)
            .eq('id', id)
            .select();
        return { data, error };
    },

    async deleteBatch(id) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase
            .from('upcoming_batches')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- Messages ---
    async getAllMessages() {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            // Fallback to contact_messages
            const { data: cData, error: cError } = await supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });
            if (cError) throw cError;
            return cData;
        }
        return data;
    },

    async updateMessageStatus(id, status) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('messages')
            .update({ status })
            .eq('id', id)
            .select();
        
        if (error) {
            const { data: cData, error: cError } = await supabase
                .from('contact_messages')
                .update({ status })
                .eq('id', id)
                .select();
            if (cError) throw cError;
            return cData[0];
        }
        return data[0];
    },

    async deleteMessage(id) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);
        if (error) {
            const { error: cError } = await supabase
                .from('contact_messages')
                .delete()
                .eq('id', id);
            if (cError) throw cError;
        }
    },

    // --- Gallery ---
    async getAllGallery() {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('uploaded_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async uploadMedia(file, category, mediaType, showInSlider = false) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${category}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('gallery')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('gallery')
            .getPublicUrl(filePath);

        const { data, error: dbError } = await supabase
            .from('gallery')
            .insert([{
                media_url: publicUrl,
                media_type: mediaType,
                category: category,
                show_in_slider: showInSlider,
                uploaded_at: new Date()
            }])
            .select();

        if (dbError) throw dbError;
        return data[0];
    },

    async deleteMedia(id, url) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        // Extract path from URL to delete from storage
        const path = url.split('gallery/')[1];
        if (path) {
            await supabase.storage.from('gallery').remove([path]);
        }

        const { error } = await supabase
            .from('gallery')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async updateMediaSliderStatus(id, showInSlider) {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase
            .from('gallery')
            .update({ show_in_slider: showInSlider })
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    }
};
