import { getSupabase } from './supabase-client.js';

const supabase = getSupabase();

export const dashboardService = {
    // Fetch stats for the dashboard
    async getDashboardStats() {
        try {
            // Get total students
            const { count: studentCount, error: studentError } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true });
            
            // Get active courses
            const { count: courseCount, error: courseError } = await supabase
                .from('courses')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            
            // Get pending registrations/applications
            // Checking both tables for robustness
            let pendingCount = 0;
            const { count: appCount, error: appError } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            
            if (appError) {
                const { count: regCount } = await supabase
                    .from('registrations')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');
                pendingCount = regCount || 0;
            } else {
                pendingCount = appCount || 0;
            }

            // Get new messages
            let messageCount = 0;
            const { count: msgCount, error: msgError } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'unread');
            
            if (msgError) {
                // Try total count if status filter fails
                const { count: totalMsgCount } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true });
                
                if (!totalMsgCount) {
                    // Try contact_messages table
                    const { count: cMsgCount } = await supabase
                        .from('contact_messages')
                        .select('*', { count: 'exact', head: true });
                    messageCount = cMsgCount || 0;
                } else {
                    messageCount = totalMsgCount || 0;
                }
            } else {
                messageCount = msgCount || 0;
            }

            console.log("Dashboard Stats Loaded");

            return {
                students: studentCount || 0,
                courses: courseCount || 0,
                pending: pendingCount || 0,
                messages: messageCount || 0
            };
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            throw error;
        }
    },

    // Get recent applications
    async getRecentApplications(limit = 5) {
        try {
            let { data, error } = await supabase
                .from('applications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) {
                const { data: regData, error: regError } = await supabase
                    .from('registrations')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);
                
                if (regError) throw regError;
                data = regData;
            }

            console.log("Applications Synced");
            return data;
        } catch (error) {
            console.error("Error fetching recent applications:", error);
            throw error;
        }
    },

    // Realtime Subscriptions
    subscribeToChanges(callback) {
        const channels = [
            supabase.channel('students-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, payload => callback('students', payload)).subscribe(),
            supabase.channel('courses-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, payload => callback('courses', payload)).subscribe(),
            supabase.channel('applications-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, payload => callback('applications', payload)).subscribe(),
            supabase.channel('registrations-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, payload => callback('registrations', payload)).subscribe(),
            supabase.channel('messages-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => callback('messages', payload)).subscribe(),
            supabase.channel('contact-messages-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, payload => callback('contact_messages', payload)).subscribe()
        ];

        console.log("Realtime Subscription Active");
        
        return {
            unsubscribe: async () => {
                for (const channel of channels) {
                    await supabase.removeChannel(channel);
                }
                console.log("Realtime Subscriptions Removed");
            }
        };
    }
};
