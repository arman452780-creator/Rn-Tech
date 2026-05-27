import { dbService } from './db-service.js';
import { authService } from './auth-service.js';
import { getSupabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('RN-TECH Supabase Integration Initialized');

    // --- Load Notices ---
    // Moved to initDynamicNotices() for enhanced functionality and realtime sync

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

    // --- Handle Contact Form ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnSpinner = submitBtn.querySelector('.btn-spinner');
            const errorMsg = document.getElementById('contactError');
            const successMsg = document.getElementById('contactSuccess');

            // Reset states
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';
            
            // Loading state
            submitBtn.disabled = true;
            if (btnText) btnText.style.opacity = '0.5';
            if (btnSpinner) btnSpinner.style.display = 'block';

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                await dbService.submitContactMessage({
                    name: data.name,
                    email: data.email,
                    message: data.message
                });

                // Success state
                contactForm.reset();
                successMsg.style.display = 'flex';
                
                // Optional: Scroll to success message
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            } catch (error) {
                console.error('Error submitting contact message:', error);
                errorMsg.textContent = 'Failed to send message. Please try again later.';
                errorMsg.style.display = 'block';
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                if (btnText) btnText.style.opacity = '1';
                if (btnSpinner) btnSpinner.style.display = 'none';
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

    // --- Dynamic Slider ---
    await initDynamicSlider();

    // --- Dynamic Notices ---
    await initDynamicNotices();

    // --- Dynamic Batches ---
    await initDynamicBatches();
});

async function initDynamicNotices() {
    const container = document.getElementById('notices-container');
    if (!container) return;

    const loadNotices = async () => {
        console.log("Fetching Homepage Notices...");
        
        // Step 1: Direct Test Fetch (Diagnostic)
        try {
            const supabase = getSupabase();
            const { data: testData, error: testError } = await supabase
                .from('notices')
                .select('*')
                .eq('published', true)
                .order('created_at', { ascending: false });
            
            console.log("Direct Test - Homepage Notices:", testData);
            console.log("Direct Test - Homepage Error:", testError);
        } catch (e) {
            console.log("Direct test fetch failed", e);
        }

        try {
            const notices = await dbService.getNotices();
            console.log("Homepage Notices Loaded");
            console.log("Fetched Notices:", notices);

            if (notices && notices.length > 0) {
                container.innerHTML = ''; // Clear placeholders
                
                const displayNotices = notices.slice(0, 5);

                displayNotices.forEach(notice => {
                    const createdDate = new Date(notice.created_at);
                    const now = new Date();
                    const diffDays = Math.ceil((now - createdDate) / (1000 * 60 * 60 * 24));
                    const isNew = diffDays <= 7;

                    const noticeEl = document.createElement('div');
                    noticeEl.className = 'notice-item shimmer-glass';
                    
                    if (notice.pinned) {
                        noticeEl.style.borderLeft = '3px solid var(--color-accent)';
                    }

                    noticeEl.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <p style="margin: 0; font-weight: 600; color: var(--color-text); font-size: 0.95rem;">
                                    ${notice.pinned ? '<i class="fas fa-thumbtack" style="color: var(--color-accent); margin-right: 8px; font-size: 0.8rem;"></i>' : ''}
                                    ${notice.title || 'Notification'}
                                </p>
                                ${isNew ? '<span class="badge-new">NEW</span>' : ''}
                            </div>
                            <p style="margin: 0; font-size: 0.85rem; color: var(--color-text-dim); line-height: 1.4;">${notice.content || notice.description}</p>
                            <span style="font-size: 0.7rem; color: var(--color-text-dim); opacity: 0.6; align-self: flex-end;">${createdDate.toLocaleDateString()}</span>
                        </div>
                    `;
                    container.appendChild(noticeEl);
                });
            } else {
                container.innerHTML = `
                    <div class="notice-item shimmer-glass" style="justify-content: center; opacity: 0.7; padding: 2rem 1rem;">
                        <p style="margin: 0; font-size: 0.9rem; font-style: italic; color: var(--color-text-muted);">No active notices available.</p>
                    </div>
                `;
            }
            console.log("Realtime Notices Synced");
        } catch (error) {
            console.error('Notice Fetch Error:', error);
            container.innerHTML = `
                <div class="notice-item shimmer-glass" style="border-left: 3px solid #ff4d4d;">
                    <p style="margin: 0; font-size: 0.85rem; color: #ff4d4d;"><i class="fas fa-exclamation-circle"></i> Failed to sync announcements. Reconnecting...</p>
                </div>
            `;
        }
    };

    await loadNotices();

    // Realtime Subscription
    const supabase = getSupabase();
    supabase.channel('public:notices')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, (payload) => {
            console.log("Realtime Notice Sync Active", payload);
            loadNotices();
        })
        .subscribe();
}

/**
 * Upcoming Batches Integration
 */
async function initDynamicBatches() {
    const container = document.getElementById('upcoming-batches-container');
    if (!container) return;

    const loadBatches = async () => {
        try {
            console.log("Fetching Upcoming Batches...");
            const batches = await dbService.getUpcomingBatches();
            console.log("Upcoming Batches Loaded");
            console.log("Published Batches:", batches);

            if (batches && batches.length > 0) {
                container.innerHTML = '';
                
                // Show max 5
                batches.slice(0, 5).forEach(batch => {
                    const batchEl = document.createElement('div');
                    batchEl.className = 'notice-item shimmer-glass';
                    
                    if (batch.featured) {
                        batchEl.style.borderLeft = '3px solid var(--color-accent)';
                    }

                    const startDate = new Date(batch.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    batchEl.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <p style="margin: 0; font-weight: 600; color: var(--color-text); font-size: 0.95rem;">
                                    ${batch.batch_name}
                                </p>
                                <span class="badge-new">SOON</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                <p style="margin: 0; font-size: 0.8rem; color: var(--color-accent); font-weight: 500;">${batch.course_name}</p>
                                <p style="margin: 0; font-size: 0.75rem; color: var(--color-text-dim); opacity: 0.8;">
                                    <i class="far fa-clock" style="margin-right: 4px;"></i>${batch.timing}
                                </p>
                            </div>
                            <span style="font-size: 0.7rem; color: var(--color-text-dim); opacity: 0.6; align-self: flex-end; margin-top: 4px;">
                                Starts: ${startDate}
                            </span>
                        </div>
                    `;
                    container.appendChild(batchEl);
                });
            } else {
                container.innerHTML = `
                    <div class="notice-item shimmer-glass" style="justify-content: center; opacity: 0.7; padding: 2rem 1rem;">
                        <p style="margin: 0; font-size: 0.9rem; font-style: italic; color: var(--color-text-muted);">Stay tuned for new batches!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Batch Fetch Error:', error);
            container.innerHTML = `
                <div class="notice-item shimmer-glass" style="border-left: 3px solid #ff4d4d;">
                    <p style="margin: 0; font-size: 0.85rem; color: #ff4d4d;">Failed to load batches.</p>
                </div>
            `;
        }
    };

    await loadBatches();

    // Realtime Sync
    const supabase = getSupabase();
    supabase.channel('public:upcoming_batches')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'upcoming_batches' }, (payload) => {
            console.log("Realtime Batch Sync Active", payload);
            loadBatches();
        })
        .subscribe();
}

async function initDynamicSlider() {
    const container = document.getElementById('hero-slider-container');
    const dotsContainer = document.getElementById('hero-slider-dots');
    if (!container || !dotsContainer) return;

    const loadSlider = async () => {
        try {
            const sliderImages = await dbService.getSliderImages();
            console.log("Gallery Images Loaded");
            console.log("Featured Slider Images:", sliderImages);

            if (sliderImages && sliderImages.length > 0) {
                // Save navigation buttons
                const prevBtn = container.querySelector('.prev-btn');
                const nextBtn = container.querySelector('.next-btn');
                
                // Clear existing slides and dots
                container.innerHTML = '';
                dotsContainer.innerHTML = '';

                // Add dynamic slides
                sliderImages.forEach((img, index) => {
                    const slide = document.createElement('div');
                    slide.className = `slide ${index === 0 ? 'active' : ''}`;
                    
                    if (img.media_type === 'video') {
                        slide.innerHTML = `<video src="${img.media_url}" autoplay muted loop width="100%"></video>`;
                    } else {
                        slide.innerHTML = `<img src="${img.media_url}" alt="Slider Image" width="100%" loading="lazy">`;
                    }
                    container.appendChild(slide);

                    const dot = document.createElement('span');
                    dot.className = `dot ${index === 0 ? 'active' : ''}`;
                    dot.setAttribute('data-slide', index);
                    dotsContainer.appendChild(dot);
                });

                // Put buttons back
                if (prevBtn) container.appendChild(prevBtn);
                if (nextBtn) container.appendChild(nextBtn);
                
                // Re-initialize slider logic from script.js
                reinitSliderLogic();
                console.log("Homepage Slider Synced");
            }
        } catch (error) {
            console.error('Error loading slider images:', error);
        }
    };

    await loadSlider();

    // Realtime Subscription
    const supabase = getSupabase();
    supabase.channel('gallery-slider-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, (payload) => {
            console.log("Realtime Gallery Update Active", payload);
            loadSlider();
        })
        .subscribe();
}

function reinitSliderLogic() {
    let slideIndex = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (!slides.length) return;

    function showSlides(n) {
        if (n >= slides.length) { slideIndex = 0; }
        if (n < 0) { slideIndex = slides.length - 1; }

        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        slides[slideIndex].classList.add('active');
        if(dots[slideIndex]) dots[slideIndex].classList.add('active');
    }

    function nextSlide() {
        showSlides(++slideIndex);
    }

    function prevSlide() {
        showSlides(--slideIndex);
    }

    let slideInterval = setInterval(nextSlide, 4000);

    function startTimer() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 4000);
    }

    if(prevBtn) {
        prevBtn.onclick = () => {
            prevSlide();
            startTimer();
        };
    }
    
    if(nextBtn) {
        nextBtn.onclick = () => {
            nextSlide();
            startTimer();
        };
    }

    dots.forEach((dot, index) => {
        dot.onclick = () => {
            slideIndex = index;
            showSlides(slideIndex);
            startTimer();
        };
    });
}

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
