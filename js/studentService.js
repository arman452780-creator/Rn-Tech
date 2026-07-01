import { getSupabase } from './supabase-client.js';

export const studentService = {
    // Generate Registration Number (e.g., RNT20260001)
    async generateRegistrationNo(admissionYear) {
        const supabase = getSupabase();
        const yearStr = admissionYear ? admissionYear.split('-')[0] : new Date().getFullYear().toString();
        const prefix = `RNT${yearStr}`;

        const { data, error } = await supabase
            .from('students')
            .select('registration_no')
            .like('registration_no', `${prefix}%`)
            .order('registration_no', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            const lastRegNo = data[0].registration_no;
            const lastNum = parseInt(lastRegNo.replace(prefix, ''), 10);
            const nextNum = lastNum + 1;
            return `${prefix}${nextNum.toString().padStart(4, '0')}`;
        } else {
            return `${prefix}0001`;
        }
    },

    // Generate Student ID (e.g., RNTS250001)
    async generateStudentId() {
        const supabase = getSupabase();
        const yearShort = new Date().getFullYear().toString().slice(-2);
        const prefix = `RNTS${yearShort}`;

        const { data, error } = await supabase
            .from('students')
            .select('student_id')
            .like('student_id', `${prefix}%`)
            .order('student_id', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            const lastId = data[0].student_id;
            const lastNum = parseInt(lastId.replace(prefix, ''), 10);
            const nextNum = lastNum + 1;
            return `${prefix}${nextNum.toString().padStart(4, '0')}`;
        } else {
            return `${prefix}0001`;
        }
    },

    // Register a new student
    async registerStudent(studentData) {
        const supabase = getSupabase();
        
        try {
            const registrationNo = studentData.registration_no || await this.generateRegistrationNo(studentData.admission_year);
            const studentId = studentData.student_id || await this.generateStudentId();

            const finalData = {
                ...studentData,
                registration_no: registrationNo,
                student_id: studentId,
                status: 'Active'
            };

            const { data, error } = await supabase
                .from('students')
                .insert([finalData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error("Error registering student:", error);
            throw error;
        }
    },

    // Get all students
    async getAllStudents() {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Update student
    async updateStudent(id, updates) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('students')
            .update({...updates, updated_at: new Date().toISOString()})
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    // Delete student
    async deleteStudent(id) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('students')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        
        if (!data || data.length === 0) {
            throw new Error("Action blocked by database. Please check Supabase RLS (Row Level Security) policies for DELETE on the 'students' table.");
        }
        
        return true;
    },

    // Upload student photo
    async uploadStudentPhoto(file, path) {
        const supabase = getSupabase();
        try {
            const { data, error } = await supabase.storage
                .from('student-photos')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('student-photos')
                .getPublicUrl(path);

            return publicUrlData.publicUrl;
        } catch (error) {
            console.error('Error uploading photo:', error);
            throw error;
        }
    },
    
    // Delete student photo
    async deleteStudentPhoto(path) {
        const supabase = getSupabase();
        try {
            const { error } = await supabase.storage
                .from('student-photos')
                .remove([path]);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting photo:', error);
            throw error;
        }
    },

    // Subscribe to real-time changes
    subscribeToStudents(callback) {
        const supabase = getSupabase();
        const channel = supabase.channel('students-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'students' },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();
        
        return channel;
    }
};
