import { dbService } from './db-service.js';
import { authService } from './auth-service.js';
import { getSupabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('RN-TECH Supabase Integration Initialized');

    // --- Load Notices ---
    const noticesContainer = document.getElementById('notices-container');
    if (noticesContainer) {
        try {
            const notices = await dbService.getNotices();
            if (notices && notices.length > 0) {
                noticesContainer.innerHTML = ''; // Clear placeholders
                notices.forEach(notice => {
                    const noticeEl = document.createElement('div');
                    noticeEl.className = 'notice-item shimmer-glass';
                    noticeEl.innerHTML = `
                        <p>${notice.content}</p>
                        ${notice.type === 'urgent' ? '<span class="badge-new" style="background: var(--color-accent-2);">URGENT</span>' : '<span class="badge-new">NEW</span>'}
                    `;
                    noticesContainer.appendChild(noticeEl);
                });
            }
        } catch (error) {
            console.error('Error loading notices:', error);
        }
    }

    // --- Load Recent Admissions ---
    const admissionsContainer = document.getElementById('recent-admissions-container');
    if (admissionsContainer) {
        try {
            const admissions = await dbService.getRecentAdmissions(5);
            if (admissions && admissions.length > 0) {
                admissionsContainer.innerHTML = ''; // Clear placeholders
                admissions.forEach(student => {
                    const studentEl = document.createElement('div');
                    studentEl.className = 'notice-item student-item shimmer-glass';
                    studentEl.innerHTML = `
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=e0b85a&color=000"
                             alt="Student" class="student-photo">
                        <div class="student-details">
                            <p class="student-info">Name : ${student.full_name}</p>
                            <p class="student-info">Course : ${student.course_name || 'N/A'}</p>
                        </div>
                        <span class="badge-new">NEW</span>
                    `;
                    admissionsContainer.appendChild(studentEl);
                });
            }
        } catch (error) {
            console.error('Error loading admissions:', error);
        }
    }

    // --- Load Dynamic Courses (for courses.html) ---
    const dynamicCoursesContainer = document.getElementById('dynamic-courses-container');
    if (dynamicCoursesContainer) {
        try {
            const courses = await dbService.getCourses();
            if (courses && courses.length > 0) {
                // Group by category if needed, but for now just show them
                dynamicCoursesContainer.innerHTML = `
                    <div class="accordion-item">
                        <button class="accordion-header">
                            Managed Courses <span class="accordion-icon">+</span>
                        </button>
                        <div class="accordion-content courses-list" id="supabase-courses-list"></div>
                    </div>
                `;
                const list = document.getElementById('supabase-courses-list');
                courses.forEach(course => {
                    const courseEl = document.createElement('div');
                    courseEl.className = 'course-card-item color-green';
                    courseEl.innerHTML = `
                        <div class="course-info">
                            <p><strong>Course Name :</strong> ${course.title}</p>
                            <p><strong>Duration :</strong> ${course.duration || 'N/A'}</p>
                            <p><strong>Fee :</strong> ₹ ${course.fees || 'N/A'}</p>
                            <p><strong>Content :</strong> ${course.description || 'N/A'}</p>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <a href="apply.html?course=${encodeURIComponent(course.title)}" class="btn btn-apply">Apply</a>
                            <a href="register.html?course=${encodeURIComponent(course.title)}" class="btn btn-outline" style="border-color: var(--color-accent); color: var(--color-accent);">Register</a>
                        </div>
                    `;
                    list.appendChild(courseEl);
                });
                
                // Re-initialize accordion logic for the new item
                const newHeader = dynamicCoursesContainer.querySelector('.accordion-header');
                newHeader.addEventListener('click', () => {
                    const item = newHeader.parentElement;
                    const content = newHeader.nextElementSibling;
                    if (item.classList.contains('active')) {
                        item.classList.remove('active');
                        content.style.maxHeight = null;
                    } else {
                        item.classList.add('active');
                        content.style.maxHeight = content.scrollHeight + 48 + "px";
                    }
                });
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    }

    // --- Handle Form Submissions ---
    const applyForm = document.getElementById('courseApplyForm');
    if (applyForm) {
        applyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = applyForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const formData = new FormData(applyForm);
            const data = Object.fromEntries(formData.entries());
            
            try {
                await dbService.submitRegistration({
                    full_name: data.name,
                    email: data.email,
                    phone: data.contact,
                    course_name: data.courses,
                    status: 'pending'
                });
                
                showSuccessMessage(applyForm, 'Application Sent', 'Thank you! We received your application and will contact you shortly.');
            } catch (error) {
                console.error('Error submitting application:', error);
                submitBtn.textContent = 'Error. Try Again.';
                submitBtn.disabled = false;
            }
        });
    }

    const registerForm = document.getElementById('courseRegisterForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());
            
            try {
                // Map complex form data to Supabase table
                await dbService.submitRegistration({
                    full_name: data.name,
                    email: data.email,
                    phone: data.contact,
                    course_name: data.courses,
                    status: 'pending'
                    // Add other fields as needed to your Supabase table
                });
                
                showSuccessMessage(registerForm, 'Registration Sent', 'Thank you! We received your registration and will contact you shortly.');
            } catch (error) {
                console.error('Error submitting registration:', error);
                submitBtn.textContent = 'Error. Try Again.';
                submitBtn.disabled = false;
            }
        });
    }

    // --- Handle Auth State ---
    authService.onAuthStateChange((event, session) => {
        if (session) {
            console.log('User signed in:', session.user);
            updateUIForLoggedInUser(session.user);
        } else {
            console.log('User signed out');
            updateUIForLoggedOutUser();
        }
    });
});

function showSuccessMessage(form, title, message) {
    form.innerHTML = `
        <div style="text-align: center; padding: 1rem 0;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" style="margin-bottom: 1rem;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3 style="color: var(--color-text); margin-bottom: 0.5rem; font-size: 1.5rem;">${title}</h3>
            <p style="color: var(--color-text-muted);">${message}</p>
            <a href="courses.html" class="btn btn-outline" style="margin-top: 2rem;">Back to Courses</a>
        </div>
    `;
}

async function updateUIForLoggedInUser(user) {
    const loginLink = document.getElementById('nav-login-link');
    if (loginLink) {
        loginLink.remove();
    }

    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('nav-user-profile')) {
        const supabase = getSupabase();
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const profileLink = document.createElement('a');
        profileLink.className = 'nav-link';
        profileLink.id = 'nav-user-profile';
        
        if (profile && profile.role === 'admin') {
            profileLink.href = 'admin-dashboard.html';
            profileLink.textContent = 'Dashboard';
            profileLink.style.color = 'var(--color-accent)';
            profileLink.style.fontWeight = 'bold';
        } else {
            profileLink.href = '#';
            profileLink.textContent = 'Profile';
        }
        
        navLinks.appendChild(profileLink);

        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.className = 'nav-link';
        logoutLink.id = 'nav-logout';
        logoutLink.textContent = 'Logout';
        logoutLink.style.color = '#ff4d4d'; // Soft red for logout
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await authService.signOut();
            window.location.reload();
        });
        navLinks.appendChild(logoutLink);
    }
}

function updateUIForLoggedOutUser() {
    const profileLink = document.getElementById('nav-user-profile');
    if (profileLink) profileLink.remove();
    const logoutLink = document.getElementById('nav-logout');
    if (logoutLink) logoutLink.remove();

    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('nav-login-link')) {
        const loginLink = document.createElement('a');
        loginLink.href = 'admin-login.html';
        loginLink.className = 'nav-link';
        loginLink.id = 'nav-login-link';
        loginLink.textContent = 'Login';
        navLinks.appendChild(loginLink);
    }
}
