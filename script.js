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
    if (document.getElementById('hero-slider-container')) {
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
    // --- Contact Form Logic moved to js/main.js ---


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

    // --- Register Page Logic ---
    if (window.location.pathname.includes('register.html') || document.getElementById('courseRegisterForm')) {
        // 1. Auto-select current year
        const currentYear = new Date().getFullYear().toString();
        const sessionSelect = document.getElementById('asession');
        if (sessionSelect) {
            for (let i = 0; i < sessionSelect.options.length; i++) {
                if (sessionSelect.options[i].value === currentYear) {
                    sessionSelect.selectedIndex = i;
                    break;
                }
            }
        }

        // 2. Auto-fill today's date
        const dojInput = document.getElementById('doj');
        if (dojInput) {
            const today = new Date().toISOString().split('T')[0];
            dojInput.value = today;
        }

        // 3. Title case formatting for specific inputs
        const titleCaseInputs = document.querySelectorAll('.title-case-input');
        titleCaseInputs.forEach(input => {
            input.addEventListener('input', function() {
                let start = this.selectionStart;
                let end = this.selectionEnd;
                this.value = this.value.replace(/\b\w/g, function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
                this.setSelectionRange(start, end);
            });
        });

        // 4. Net Fee auto-populate removed as requested (default value should be empty)
        // 5. Course field from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const course = urlParams.get('course');
        if (course) {
            const courseInput = document.getElementById('registerCourse');
            if (courseInput) {
                courseInput.value = course;
            }

            // Auto-select course category based on course name
            const programSelect = document.getElementById('program');
            if (programSelect) {
                const courseUpper = course.toUpperCase();
                let categoryValue = "3"; // Default to Basic Course

                const exactMatches = {
                    "CERTIFICATE IN TALLY PRIME": "3",
                    "MICROSOFT OFFICE": "3",
                    "MS-OFFICE": "3"
                };

                if (exactMatches[courseUpper]) {
                    categoryValue = exactMatches[courseUpper];
                } else if (courseUpper.includes("TYPING")) {
                    categoryValue = "8"; // Typing Course
                } else if (courseUpper.includes("TRAINING")) {
                    categoryValue = "9"; // Training Course
                } else if (courseUpper.includes("LANGUAGE") || courseUpper.includes("PROGRAMMING") || ["HTML", "XML", "DHTML", "C+", "C++", "JAVA", "PYTHON", "C#", "FOXPRO"].some(lang => courseUpper.includes(lang))) {
                    categoryValue = "6"; // Language Course
                } else if (courseUpper.includes("ADVANCE DIPLOMA") || courseUpper.includes("POST GRADUATE")) {
                    categoryValue = "5"; // Diploma Course
                } else if (courseUpper.includes("CERTIFICATE") || courseUpper.includes("DIPLOMA IN")) {
                    categoryValue = "4"; // Certificate Course
                }

                programSelect.value = categoryValue;

            }

            // Auto-select course duration based on course name
            const durationInput = document.getElementById('courseDuration');
            if (durationInput) {
                const courseUpper = course.toUpperCase();
                let duration = "01 Months"; // default
                
                if (courseUpper === "POST GRADUATE IN DIPLOMA IN COMPUTER APPLICATION" || courseUpper === "ADVANCE DIPLOMA IN FINANCIAL ACCOUNTING") {
                    duration = "18 Months";
                } else if (courseUpper === "ADVANCE DIPLOMA IN COMPUTER APPLICATION") {
                    duration = "12 Months";
                } else if (courseUpper === "DIPLOMA IN FINANCIAL ACCOUNTING") {
                    duration = "09 Months";
                } else if (courseUpper === "DIPLOMA IN COMPUTER APPLICATION" || courseUpper === "DIPLOMA IN DESKTOP PUBLISHING") {
                    duration = "06 Months";
                } else if (courseUpper === "MICROSOFT OFFICE" || courseUpper === "CERTIFICATE IN COMPUTER FINANCIAL ACCOUNTING" || courseUpper === "CERTIFICATE IN FINANCIAL ACCOUNTING" || courseUpper === "DIPLOMA IN OFFICE AUTOMATION") {
                    duration = "04 Months";
                } else if (courseUpper === "MS-OFFICE" || courseUpper === "CERTIFICATE IN BASIC COMPUTER" || courseUpper === "CERTIFICATE IN CORE JAVA PROGRAMMING" || courseUpper === "CERTIFICATE IN COMPUTER TYPING" || courseUpper.includes("DIPLOMA IN COMPUTER TYPING")) {
                    duration = "03 Months";
                } else if (courseUpper === "TALLY ERP 9" || courseUpper === "MARG ERP" || courseUpper === "CERTIFICATE IN TALLY PRIME" || courseUpper.includes("PROGRAMMING") || courseUpper.includes("TRAINING") || courseUpper.includes("BASIC COMPUTER TYPING")) {
                    duration = "02 Months";
                }
                
                durationInput.value = duration;
            }
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
