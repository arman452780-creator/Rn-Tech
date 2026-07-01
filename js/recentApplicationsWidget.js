// js/recentApplicationsWidget.js
import { getSupabase } from './supabase-client.js';
import { pdfService } from './pdfService.js';

const supabase = getSupabase();

export const recentApplicationsWidget = {
    containerId: 'recentApplicationsList',
    state: {
        students: [],
        filter: 'All', // 'Today', 'Yesterday', 'This Week', 'This Month', 'All'
        searchQuery: '',
        isRealtimeConnected: false,
        pollingInterval: null,
        limit: 5,
        searchTimeout: null,
        cacheKey: 'rntech_recent_students_cache'
    },
    
    init() {
        this.loadCache();
        this.renderSkeleton();
        this.setupUI();
        this.fetchData();
        this.setupRealtime();
        
        // Add styles if not present
        this.injectStyles();
    },

    loadCache() {
        try {
            const cached = localStorage.getItem(this.state.cacheKey);
            if (cached) {
                this.state.students = JSON.parse(cached);
                this.renderCards();
            }
        } catch (e) {
            console.error('Failed to load cache', e);
        }
    },

    saveCache() {
        try {
            localStorage.setItem(this.state.cacheKey, JSON.stringify(this.state.students));
        } catch (e) {
            console.error('Failed to save cache', e);
        }
    },

    setupUI() {
        const filterSelect = document.getElementById('recentFilterSelect');
        const searchInput = document.getElementById('recentSearchInput');

        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.state.filter = e.target.value;
                this.fetchData();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.state.searchTimeout);
                this.state.searchTimeout = setTimeout(() => {
                    this.state.searchQuery = e.target.value.trim();
                    this.fetchData();
                }, 300);
            });
        }
    },

    async fetchData() {
        this.renderSkeleton();
        
        try {
            let query = supabase
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply Filters
            const now = new Date();
            if (this.state.filter === 'Today') {
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                query = query.gte('created_at', startOfDay);
            } else if (this.state.filter === 'Yesterday') {
                const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                query = query.gte('created_at', startOfYesterday.toISOString()).lt('created_at', endOfYesterday.toISOString());
            } else if (this.state.filter === 'This Week') {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
                startOfWeek.setHours(0,0,0,0);
                query = query.gte('created_at', startOfWeek.toISOString());
            } else if (this.state.filter === 'This Month') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                query = query.gte('created_at', startOfMonth);
            }

            // Apply Search
            if (this.state.searchQuery) {
                const sq = `%${this.state.searchQuery}%`;
                query = query.or(`student_name.ilike.${sq},student_id.ilike.${sq},registration_no.ilike.${sq},mobile.ilike.${sq},course.ilike.${sq},district.ilike.${sq}`);
            }

            // Always limit to what we need + 1 to know if there's more
            query = query.limit(this.state.limit + 1);

            const { data, error } = await query;

            if (error) throw error;

            const hasMore = data.length > this.state.limit;
            this.state.students = data.slice(0, this.state.limit);
            this.saveCache();
            this.renderCards(hasMore);

        } catch (error) {
            console.error('Error fetching recent applications:', error);
            this.renderError();
        }
    },

    setupRealtime() {
        const channel = supabase.channel('public:students_recent');
        
        channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students' }, payload => {
            // Only add if it matches current filter/search
            if (this.state.filter === 'All' && !this.state.searchQuery) {
                this.state.students.unshift(payload.new);
                if (this.state.students.length > this.state.limit) {
                    this.state.students.pop();
                }
                this.saveCache();
                this.renderCards();
                this.showToast(payload.new);
            } else {
                // If filtered, just refetch to be safe and accurate
                this.fetchData();
                this.showToast(payload.new);
            }
        }).subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                this.state.isRealtimeConnected = true;
                this.stopPolling();
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                this.state.isRealtimeConnected = false;
                this.startPolling();
                // Attempt reconnect after a delay
                setTimeout(() => this.setupRealtime(), 5000);
            }
        });
    },

    startPolling() {
        if (!this.state.pollingInterval) {
            this.state.pollingInterval = setInterval(() => {
                if (!this.state.isRealtimeConnected) {
                    this.fetchData();
                }
            }, 30000);
        }
    },

    stopPolling() {
        if (this.state.pollingInterval) {
            clearInterval(this.state.pollingInterval);
            this.state.pollingInterval = null;
        }
    },

    formatTimeAgo(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just Now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} Minutes Ago`;
        
        const diffInDays = Math.floor(diffInSeconds / 86400);
        if (diffInDays === 0 && date.getDate() === now.getDate()) {
            return `Today • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        if (diffInDays === 1 || (diffInDays === 0 && date.getDate() !== now.getDate())) {
            return `Yesterday`;
        }
        if (diffInDays < 7) return `${diffInDays} Days Ago`;
        
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    getBadgeType(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        const diffInHours = (new Date() - date) / (1000 * 60 * 60);
        
        if (diffInHours <= 24) return 'NEW';
        if (diffInHours <= 24 * 7) return 'RECENT';
        return null;
    },

    renderSkeleton() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        let html = '';
        for (let i = 0; i < 3; i++) {
            html += `
                <div class="app-card-premium skeleton">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line" style="width: 60%"></div>
                        <div class="skeleton-line" style="width: 40%"></div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    },

    renderError() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        if (this.state.students.length > 0) {
            // Has cache, silently fail or show subtle indicator
            this.renderCards();
            return;
        }

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #ff4d4d; margin-bottom: 1rem;"></i>
                <p>Unable to load recent admissions.</p>
                <button class="btn btn-outline btn-sm" onclick="recentApplicationsWidget.fetchData()">Retry</button>
            </div>
        `;
    },

    renderEmpty() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-graduate" style="font-size: 2.5rem; color: var(--color-text-dim); margin-bottom: 1rem;"></i>
                <p>No Recent Admissions Yet</p>
            </div>
        `;
    },

    renderCards(hasMore = false) {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        if (this.state.students.length === 0) {
            this.renderEmpty();
            return;
        }

        let html = '';
        this.state.students.forEach((student, index) => {
            const timeAgo = this.formatTimeAgo(student.created_at);
            const badge = this.getBadgeType(student.created_at);
            const badgeHtml = badge === 'NEW' 
                ? `<span class="badge-new-glow">NEW</span>` 
                : (badge === 'RECENT' ? `<span class="badge-recent">RECENT</span>` : '');

            const photoUrl = student.profile_photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.student_name) + '&background=0d8abc&color=fff';

            // Animation style for initial load
            const animationStyle = `animation: slideDownFadeIn 0.4s ease forwards ${index * 0.1}s; opacity: 0;`;

            html += `
                <div class="app-card-premium" style="${animationStyle}">
                    <div class="app-card-left">
                        <div class="student-avatar" style="background-image: url('${photoUrl}')"></div>
                        <div class="student-info">
                            <h4>${student.student_name} ${badgeHtml}</h4>
                            <p class="student-meta">
                                <span>${student.registration_no || student.student_id}</span> • 
                                <span style="color: var(--color-accent)">${student.course}</span> • 
                                <span>${student.district || 'N/A'}</span>
                            </p>
                            <span class="time-ago">${timeAgo}</span>
                        </div>
                    </div>
                    <div class="app-card-right">
                        <div class="three-dots-menu">
                            <button class="three-dots-btn" onclick="recentApplicationsWidget.toggleMenu('${student.student_id}')">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="menu-dropdown" id="menu-${student.student_id}">
                                <a href="#" onclick="recentApplicationsWidget.viewStudent('${student.student_id}')"><i class="fas fa-eye"></i> View Student</a>
                                <a href="#" onclick="recentApplicationsWidget.previewPDF('${student.student_id}')"><i class="fas fa-file-pdf"></i> Preview Registration Form</a>
                                <a href="#" onclick="recentApplicationsWidget.downloadPDF('${student.student_id}')"><i class="fas fa-download"></i> Download Registration PDF</a>
                                <a href="#" onclick="recentApplicationsWidget.printPDF('${student.student_id}')"><i class="fas fa-print"></i> Print Registration PDF</a>
                                <div class="menu-divider"></div>
                                <a href="#" class="disabled"><i class="fas fa-rupee-sign"></i> Fee Details <span>Coming Soon</span></a>
                                <a href="#" class="disabled"><i class="fas fa-calendar-check"></i> Attendance <span>Coming Soon</span></a>
                                <a href="#" class="disabled"><i class="fas fa-id-card"></i> ID Card <span>Coming Soon</span></a>
                                <a href="#" class="disabled"><i class="fas fa-certificate"></i> Certificate <span>Coming Soon</span></a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        if (hasMore) {
            html += `
                <div style="text-align: center; margin-top: 1rem;">
                    <button class="btn btn-outline btn-sm" onclick="recentApplicationsWidget.viewAll()">View More</button>
                </div>
            `;
        }

        container.innerHTML = html;
        
        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.three-dots-menu')) {
                document.querySelectorAll('.menu-dropdown.show').forEach(m => m.classList.remove('show'));
            }
        });
    },

    toggleMenu(id) {
        document.querySelectorAll('.menu-dropdown.show').forEach(m => {
            if (m.id !== `menu-${id}`) m.classList.remove('show');
        });
        const menu = document.getElementById(`menu-${id}`);
        if (menu) menu.classList.toggle('show');
    },

    viewStudent(id) {
        window.location.href = `admin-students.html?highlight=${id}`;
    },

    viewAll() {
        window.location.href = `admin-students.html?highlight=latest`;
    },

    async previewPDF(id) {
        const student = this.state.students.find(s => s.student_id === id);
        if (student) {
            this.showLoadingToast("Generating PDF...");
            await pdfService.previewRegistrationPDF(student, student.registration_no, student.student_id);
            this.hideLoadingToast();
        }
    },

    async downloadPDF(id) {
        const student = this.state.students.find(s => s.student_id === id);
        if (student) {
            this.showLoadingToast("Generating PDF...");
            await pdfService.downloadRegistrationPDF(student, student.registration_no, student.student_id);
            this.hideLoadingToast();
        }
    },

    async printPDF(id) {
        const student = this.state.students.find(s => s.student_id === id);
        if (student) {
            this.showLoadingToast("Preparing Print...");
            await pdfService.printRegistrationPDF(student, student.registration_no, student.student_id);
            this.hideLoadingToast();
        }
    },

    showToast(student) {
        const toastContainer = document.getElementById('toast-container') || (function() {
            const tc = document.createElement('div');
            tc.id = 'toast-container';
            Object.assign(tc.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: '99999',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            });
            document.body.appendChild(tc);
            return tc;
        })();

        const toast = document.createElement('div');
        toast.className = 'premium-toast';
        toast.innerHTML = `
            <div class="toast-icon">🎉</div>
            <div class="toast-content">
                <div class="toast-title">New Admission</div>
                <div class="toast-desc">${student.student_name} • ${student.course}</div>
                <div class="toast-time">Just Now</div>
            </div>
        `;
        
        toast.addEventListener('click', () => {
            this.viewStudent(student.student_id);
        });

        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },
    
    showLoadingToast(message) {
        let lToast = document.getElementById('loadingToast');
        if (!lToast) {
            lToast = document.createElement('div');
            lToast.id = 'loadingToast';
            Object.assign(lToast.style, {
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--color-bg-card)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '30px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                zIndex: '99999',
                border: '1px solid var(--color-accent)',
                display: 'none',
                alignItems: 'center',
                gap: '10px'
            });
            lToast.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${message}</span>`;
            document.body.appendChild(lToast);
        } else {
            lToast.querySelector('span').textContent = message;
        }
        lToast.style.display = 'flex';
    },

    hideLoadingToast() {
        const lToast = document.getElementById('loadingToast');
        if (lToast) lToast.style.display = 'none';
    },

    injectStyles() {
        if (!document.getElementById('recentWidgetStyles')) {
            const style = document.createElement('style');
            style.id = 'recentWidgetStyles';
            style.textContent = `
                .app-card-premium {
                    background: rgba(25, 25, 35, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                    transition: all 0.3s ease;
                }
                .app-card-premium:hover {
                    transform: translateY(-2px);
                    border-color: rgba(0, 163, 255, 0.3);
                    box-shadow: 0 5px 20px rgba(0, 163, 255, 0.1);
                }
                .app-card-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .student-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 8px; /* Square passport style */
                    background-size: cover;
                    background-position: center;
                    background-color: var(--color-bg-darker);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .student-info h4 {
                    margin: 0 0 0.2rem 0;
                    font-size: 1.05rem;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .student-meta {
                    margin: 0 0 0.2rem 0;
                    font-size: 0.85rem;
                    color: var(--color-text-dim);
                }
                .time-ago {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.4);
                }
                
                .badge-new-glow {
                    background: rgba(0, 255, 136, 0.15);
                    color: #00ff88;
                    border: 1px solid rgba(0, 255, 136, 0.3);
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    animation: pulseGlow 2s infinite;
                }
                .badge-recent {
                    background: rgba(0, 163, 255, 0.15);
                    color: #00a3ff;
                    border: 1px solid rgba(0, 163, 255, 0.3);
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4); }
                    70% { box-shadow: 0 0 0 5px rgba(0, 255, 136, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0); }
                }

                .three-dots-menu {
                    position: relative;
                }
                .three-dots-btn {
                    background: transparent;
                    border: none;
                    color: var(--color-text-dim);
                    padding: 0.5rem;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: 0.2s;
                }
                .three-dots-btn:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.1);
                }
                .menu-dropdown {
                    position: absolute;
                    right: 0;
                    top: 100%;
                    background: var(--color-bg-card);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 0.5rem;
                    min-width: 220px;
                    z-index: 100;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(10px);
                    transition: all 0.2s ease;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .menu-dropdown.show {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }
                .menu-dropdown a {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    color: #fff;
                    text-decoration: none;
                    font-size: 0.85rem;
                    border-radius: 4px;
                    transition: 0.2s;
                }
                .menu-dropdown a:hover:not(.disabled) {
                    background: rgba(255,255,255,0.05);
                    color: var(--color-accent);
                }
                .menu-dropdown a i {
                    width: 16px;
                    text-align: center;
                }
                .menu-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.1);
                    margin: 0.25rem 0;
                }
                .menu-dropdown a.disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    justify-content: space-between;
                }
                .menu-dropdown a.disabled span {
                    font-size: 0.65rem;
                    background: rgba(255,255,255,0.1);
                    padding: 2px 4px;
                    border-radius: 4px;
                }

                .skeleton .skeleton-avatar {
                    width: 50px; height: 50px; border-radius: 8px;
                    background: linear-gradient(90deg, #2a2a35 25%, #3a3a45 50%, #2a2a35 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                }
                .skeleton .skeleton-line {
                    height: 12px; border-radius: 6px; margin-bottom: 8px;
                    background: linear-gradient(90deg, #2a2a35 25%, #3a3a45 50%, #2a2a35 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                }
                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                @keyframes slideDownFadeIn {
                    0% { transform: translateY(-20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: var(--color-text-dim);
                }

                .premium-toast {
                    background: rgba(30, 30, 40, 0.9);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 255, 136, 0.3);
                    border-left: 4px solid #00ff88;
                    border-radius: 8px;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    transform: translateX(120%);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    cursor: pointer;
                    min-width: 250px;
                }
                .premium-toast.show {
                    transform: translateX(0);
                }
                .toast-icon { font-size: 1.5rem; }
                .toast-title { font-weight: bold; color: #fff; font-size: 0.9rem; }
                .toast-desc { color: var(--color-text-dim); font-size: 0.8rem; }
                .toast-time { color: rgba(255,255,255,0.4); font-size: 0.7rem; margin-top: 2px; }

                /* Header Controls */
                .widget-header-controls {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }
                .widget-search {
                    flex: 1;
                    min-width: 200px;
                    position: relative;
                }
                .widget-search input {
                    width: 100%;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #fff;
                    padding: 0.5rem 1rem 0.5rem 2.5rem;
                    border-radius: 6px;
                }
                .widget-search i {
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--color-text-dim);
                }
                .widget-filter select {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #fff;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    outline: none;
                }
                .widget-filter select option {
                    background-color: #1e1e28;
                    color: #fff;
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// Make accessible to window for onclick handlers
window.recentApplicationsWidget = recentApplicationsWidget;
