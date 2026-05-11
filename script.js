document.addEventListener('DOMContentLoaded', () => {

    // --- Navigation Scroll Effect ---
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- Image Slider ---
    let slideIndex = 0;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    function showSlides(n) {
        if (!slides.length) return; // Exit if no slider

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

    if (slides.length > 0) {
        let slideInterval;

        function startTimer() {
            clearInterval(slideInterval); // Clear any existing timer
            slideInterval = setInterval(nextSlide, 4000); // Auto slide every 4 seconds
        }

        // Start auto slider initially
        startTimer();

        // Event listeners for buttons
        if(prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                startTimer(); // Restart auto-play on manual interaction
            });
        }
        
        if(nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                startTimer(); // Restart auto-play on manual interaction
            });
        }

        // Event listeners for dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                slideIndex = index;
                showSlides(slideIndex);
                startTimer(); // Restart auto-play on manual interaction
            });
        });
    }

    // --- Mobile Menu Toggle ---
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-link');

    const toggleMenu = () => {
        const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', !isExpanded);
        document.body.classList.toggle('nav-open');
        navLinks.classList.toggle('active');

        // Prevent body scroll when menu open
        if (!isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    };

    mobileToggle.addEventListener('click', toggleMenu);

    // Close mobile menu on link click
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // --- Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.reveal-fade-up, .reveal-slide-right, .reveal-slide-left');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('active');
            }
        });
    }, 100);

    // --- Form Submission Simulation ---
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            btn.textContent = 'Sending...';
            btn.disabled = true;

            setTimeout(() => {
                contactForm.innerHTML = 
                    '<div class="success-message" style="text-align: center; padding: 2rem 0;">' +
                        '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" style="margin-bottom: 1rem;">' +
                            '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>' +
                            '<polyline points="22 4 12 14.01 9 11.01"></polyline>' +
                        '</svg>' +
                        '<h3 style="color: var(--color-text); margin-bottom: 0.5rem; font-size: 1.5rem;">Application Sent</h3>' +
                        '<p style="color: var(--color-text-muted);">Thank you for taking the first step. I will be in touch within 48 hours to schedule your discovery call.</p>' +
                    '</div>';
            }, 1500);
        });
    }

    // --- Custom Select Dropdown logic to support scrolling ---
    const x = document.querySelectorAll(".custom-select-wrapper");
    for (let i = 0; i < x.length; i++) {
        const selElmnt = x[i].getElementsByTagName("select")[0];

        const selectedDiv = document.createElement("DIV");
        selectedDiv.setAttribute("class", "select-selected");
        selectedDiv.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
        x[i].appendChild(selectedDiv);

        const optionsDiv = document.createElement("DIV");
        optionsDiv.setAttribute("class", "select-items select-hide");

        for (let j = 1; j < selElmnt.options.length; j++) {
            const optionItem = document.createElement("DIV");
            optionItem.innerHTML = selElmnt.options[j].innerHTML;
            optionItem.addEventListener("click", function (e) {
                const s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                const h = this.parentNode.previousSibling;
                for (let k = 0; k < s.options.length; k++) {
                    if (s.options[k].innerHTML == this.innerHTML) {
                        s.selectedIndex = k;
                        h.innerHTML = this.innerHTML;
                        const y = this.parentNode.getElementsByClassName("same-as-selected");
                        for (let l = 0; l < y.length; l++) {
                            y[l].removeAttribute("class");
                        }
                        this.setAttribute("class", "same-as-selected");
                        s.dispatchEvent(new Event('change', { bubbles: true }));
                        break;
                    }
                }
                h.click();
            });
            optionsDiv.appendChild(optionItem);
        }
        x[i].appendChild(optionsDiv);

        selectedDiv.addEventListener("click", function (e) {
            e.stopPropagation();
            closeAllSelect(this);
            this.nextElementSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });
    }

    function closeAllSelect(elmnt) {
        const x = document.getElementsByClassName("select-items");
        const y = document.getElementsByClassName("select-selected");
        const arrNo = [];
        for (let i = 0; i < y.length; i++) {
            if (elmnt == y[i]) {
                arrNo.push(i);
            } else {
                y[i].classList.remove("select-arrow-active");
            }
        }
        for (let i = 0; i < x.length; i++) {
            if (arrNo.indexOf(i) === -1) {
                x[i].classList.add("select-hide");
            }
        }
    }

    document.addEventListener("click", closeAllSelect);

    // --- Accordion Logic ---
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = header.nextElementSibling;
            
            if (item.classList.contains('active')) {
                item.classList.remove('active');
                content.style.maxHeight = null;
            } else {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 48 + "px"; 
            }
        });
    });

    // --- Apply Page URL Parameters ---
    if (window.location.pathname.includes('apply.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const course = urlParams.get('course');
        
        if (course) {
            const courseInput = document.getElementById('applyCourse');
            if (courseInput) {
                courseInput.value = course;
            }
        }
        
        const applyForm = document.getElementById('courseApplyForm');
        if (applyForm) {
            // Logic moved to js/main.js for Supabase integration
        }
    }

    // --- Register Page URL Parameters ---
    if (window.location.pathname.includes('register.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const course = urlParams.get('course');
        
        if (course) {
            const courseInput = document.getElementById('registerCourse');
            if (courseInput) {
                courseInput.value = course;
            }
        }
        
        const registerForm = document.getElementById('courseRegisterForm');
        if (registerForm) {
            // Logic moved to js/main.js for Supabase integration
        }
    }

    // --- Notice Auto-Scroll ---
    const noticeBody = document.querySelector('.notice-body');
    if (noticeBody) {
        let isHovering = false;

        noticeBody.addEventListener('mouseenter', () => {
            isHovering = true;
        });

        noticeBody.addEventListener('mouseleave', () => {
            isHovering = false;
        });

        // Auto scroll interval (20px per second)
        setInterval(() => {
            if (!isHovering) {
                noticeBody.scrollTop += 1;
                // If we reach the bottom, jump back to the top
                if (Math.ceil(noticeBody.scrollTop) + noticeBody.clientHeight >= noticeBody.scrollHeight) {
                    noticeBody.scrollTop = 0;
                }
            }
        }, 50);
    }

    // --- Video Popup ---
    const videoPopupOverlay = document.getElementById('videoPopup');
    const closeVideoPopupBtn = document.getElementById('closeVideoPopup');
    const popupVideo = document.getElementById('popupVideo');

    if (videoPopupOverlay && closeVideoPopupBtn) {
        // Show popup after a short delay
        setTimeout(() => {
            videoPopupOverlay.classList.add('show');
            if (popupVideo) {
                // Autoplay may be blocked by browsers depending on settings, but muted autoplay usually works
                popupVideo.play().catch(e => console.log('Autoplay prevented:', e));
            }
        }, 1000);

        const closeVideoPopup = () => {
            videoPopupOverlay.classList.remove('show');
            if (popupVideo) {
                popupVideo.pause(); // Pause the video so it doesn't keep playing in the background
            }
        };

        // Close popup on click of close button
        closeVideoPopupBtn.addEventListener('click', closeVideoPopup);

        // Close popup on click outside the content
        videoPopupOverlay.addEventListener('click', (e) => {
            if (e.target === videoPopupOverlay) {
                closeVideoPopup();
            }
        });
    }

});
