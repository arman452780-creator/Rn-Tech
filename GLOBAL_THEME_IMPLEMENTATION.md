/**
 * RN-TECH GLOBAL PREMIUM THEME SYSTEM
 * 
 * ✅ COMPLETE IMPLEMENTATION
 * 
 * This unified theme system ensures that the entire RN-TECH platform
 * (website + admin portal + all future pages) feels like ONE connected
 * premium ecosystem with consistent visual language.
 */

ARCHITECTURE OVERVIEW
=====================

website/
├── global.css                    ← GLOBAL THEME FOUNDATION (1500+ lines)
│   ├── CSS Variables             (colors, typography, spacing, shadows)
│   ├── Global Components         (buttons, cards, inputs, modals, badges)
│   ├── Animation System          (fade, slide, scale, pulse, etc.)
│   ├── Utility Classes           (spacing, display, text, borders)
│   └── Responsive Design         (mobile, tablet, desktop breakpoints)
│
├── style.css                     ← WEBSITE STYLES (uses global)
│   └── Maps legacy variables to global theme
│   └── Website-specific (gold gradient buttons)
│   └── ~300 lines (was ~500)
│
├── admin-common.css              ← ADMIN STYLES (uses global)
│   ├── Sidebar with animations
│   ├── Navigation system
│   ├── Enhanced forms & tables
│   └── Responsive layouts
│   └── ~400 lines (enhanced)
│
├── *.css (page-specific)         ← Optional page overrides (uses global)
│
└── *.html (16 files)             ← All link global.css first
    ├── index.html
    ├── about.html
    ├── courses.html
    ├── faculties.html
    ├── apply.html
    ├── register.html
    ├── login.html
    └── admin-*.html (9 files)


GLOBAL THEME SYSTEM COMPONENTS
==============================

1. COLOR SYSTEM
   ├── Primary: Neon Cyan (#00f2ff)
   ├── Secondary: Electric Violet (#8a2be2)
   ├── Accent: Crimson Pulse (#ff0055)
   ├── Success: Emerald (#28a745)
   ├── Warning: Gold (#e0b85a)
   └── Error: Red Neon (#ff4d4d)
   + Dim & Glow variants for each

2. TYPOGRAPHY
   ├── Font: Outfit (primary)
   ├── Font: Playfair Display (serif)
   ├── Weights: Light (300) → Bold (700)
   └── Sizes: xs (0.75rem) → 5xl (3.5rem)

3. SPACING SCALE
   ├── xs: 0.5rem
   ├── sm: 1rem
   ├── md: 1.5rem
   ├── lg: 2rem
   ├── xl: 3rem
   └── ... to 5xl: 12rem

4. COMPONENT STYLES
   ├── BUTTONS
   │  ├── .btn-primary (cyan glow)
   │  ├── .btn-secondary (outline)
   │  ├── .btn-danger (red)
   │  └── .btn-success (green)
   │
   ├── CARDS
   │  ├── .card (base glass card)
   │  ├── .featured (top border accent)
   │  └── Status variants (success, error, warning)
   │
   ├── INPUTS
   │  ├── text, email, password inputs
   │  ├── textarea
   │  ├── select, date picker
   │  └── Unified focus state with glow
   │
   ├── MODALS
   │  ├── .modal-overlay (backdrop)
   │  ├── .modal-content (glass card)
   │  └── Animated entrance
   │
   └── BADGES
      ├── .badge-primary
      ├── .badge-success
      ├── Status badges (LIVE, DRAFT, FEATURED)
      └── Presence badges (PRESENT, ABSENT)

5. ANIMATIONS
   ├── Fade in/out (0.3s)
   ├── Slide up/down/left/right (0.4s)
   ├── Scale in (0.3s)
   ├── Float (3s loop)
   ├── Pulse/Glow (2s loop)
   └── Shimmer (1.5s loop)
   + Pre-reduced-motion support

6. RESPONSIVE DESIGN
   ├── Mobile ≤640px
   ├── Tablet 641px-1024px
   ├── Desktop 1025px+
   └── Large 1441px+

7. UTILITIES
   ├── Display (flex, grid, block, inline, none)
   ├── Spacing (margin, padding)
   ├── Text (color, alignment, size)
   ├── Border & Radius
   ├── Shadow & Glow
   └── Grid system (2, 3, 4 columns)

8. SCROLLBAR STYLING
   └── Custom gradient with glow effect

9. ACCESSIBILITY
   ├── prefers-reduced-motion support
   ├── prefers-contrast support
   └── Focus states

10. PERFORMANCE
    ├── GPU acceleration for animations
    ├── will-change optimization
    └── Backdrop-filter fallbacks


CSS VARIABLE NAMING CONVENTION
==============================

All global variables use --rn- prefix to avoid conflicts:

--rn-color-*          (colors)
--rn-bg-*             (backgrounds)
--rn-text-*           (text colors)
--rn-border-*         (border styles)
--rn-shadow-*         (shadows)
--rn-glow-*           (glow effects)
--rn-font-*           (typography)
--rn-size-*           (font sizes)
--rn-space-*          (spacing)
--rn-radius-*         (border radius)
--rn-transition-*     (animations)
--rn-glass-*          (glass morphism)
--rn-fw-*             (font weights)


BACKWARD COMPATIBILITY
======================

Old variables are mapped to new global variables in style.css:
--color-bg           → --rn-bg-darkest
--color-accent       → --rn-color-primary
--color-text         → --rn-text-primary
... etc

This ensures existing custom CSS continues working.


INTEGRATION POINTS
==================

✅ All 16 HTML files load global.css
✅ admin-common.css enhanced with global theme
✅ style.css maps legacy variables
✅ Page-specific CSS files inherit global theme
✅ Future pages automatically inherit theme


KEY BENEFITS
============

1. CONSISTENCY
   Every page feels like part of one ecosystem

2. MAINTAINABILITY
   Central location for all design decisions
   Change one variable, update entire platform

3. SCALABILITY
   New pages automatically get premium look
   New components use established patterns

4. PERFORMANCE
   Optimized animations
   GPU acceleration
   Efficient CSS architecture

5. ACCESSIBILITY
   Dark theme optimized
   Motion preferences respected
   Proper contrast ratios

6. FUTURE-PROOF
   Modular design
   Easy to extend
   Documented patterns

7. BRAND COHESION
   Unified RN-TECH aesthetic
   Professional appearance
   Memorable experience


FILES MODIFIED
==============

Created:
  ✅ global.css (1500+ lines)

Updated:
  ✅ index.html
  ✅ about.html
  ✅ courses.html
  ✅ faculties.html
  ✅ apply.html
  ✅ register.html
  ✅ login.html
  ✅ admin-dashboard.html
  ✅ admin-students.html
  ✅ admin-courses.html
  ✅ admin-notices.html
  ✅ admin-batches.html
  ✅ admin-gallery.html
  ✅ admin-messages.html
  ✅ admin-login.html
  ✅ admin-common.css (enhanced)
  ✅ style.css (optimized)

Total: 18 files


WHAT'S PRESERVED
================

✅ All layouts & structure
✅ All functionality
✅ Navigation logic
✅ Form behavior
✅ Admin features
✅ Existing content
✅ Page hierarchy

ONLY unified:
  - Visual theme
  - Design system
  - Component styling
  - Animation system
  - Responsive behavior


READY FOR DEPLOYMENT
====================

✅ Global theme system complete
✅ All pages integrated
✅ No breaking changes
✅ Backward compatible
✅ Performance optimized
✅ Mobile responsive
✅ Accessible
✅ Future-proof

The entire RN-TECH ecosystem now speaks with ONE
consistent, premium, professional visual language.
