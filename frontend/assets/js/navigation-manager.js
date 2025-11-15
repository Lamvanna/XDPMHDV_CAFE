// Centralized Navigation Management System
// Handles mobile menu, smooth scrolling, and page transitions

class NavigationManager {
    constructor() {
        this.transitionDuration = 150;
        this.init();
    }

    /**
     * Initialize navigation manager
     */
    init() {
        this.createTransitionOverlay();
        this.attachLinkHandlers();
        this.updateActiveNav();
        this.initScrollEffects();
        
        // Handle back/forward buttons
        window.addEventListener('popstate', () => {
            this.updateActiveNav();
        });
    }

    /**
     * Create page transition overlay
     */
    createTransitionOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'page-transition';
        overlay.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    /**
     * Attach click handlers to internal links
     */
    attachLinkHandlers() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            
            // Skip external links, anchors, and special links
            if (!href || 
                href.startsWith('#') || 
                href.startsWith('http') || 
                href.startsWith('mailto') || 
                href.startsWith('tel') ||
                link.hasAttribute('data-no-transition')) {
                return;
            }
            
            // Handle internal navigation with transition
            e.preventDefault();
            this.navigateTo(href);
        });
    }

    /**
     * Navigate to URL with transition
     * @param {string} url - URL to navigate to
     */
    navigateTo(url) {
        this.overlay.classList.add('active');
        
        setTimeout(() => {
            window.location.href = url;
        }, this.transitionDuration);
    }

    /**
     * Update active navigation state
     */
    updateActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        document.querySelectorAll('nav a, .nav-link').forEach(link => {
            const href = link.getAttribute('href');
            
            // Remove active classes
            link.classList.remove('text-coffee', 'font-semibold', 'border-b-2', 'border-coffee');
            
            // Add active class to current page
            if (href && (
                href === currentPage || 
                (currentPage === 'index.html' && (href === '#' || href === 'index.html')) ||
                (currentPage === '' && (href === '#' || href === 'index.html'))
            )) {
                link.classList.add('text-coffee', 'font-semibold');
            }
        });
    }

    /**
     * Initialize scroll effects
     */
    initScrollEffects() {
        // Header scroll effect
        this.initHeaderScroll();
        
        // Scroll animations
        this.initScrollAnimations();
        
        // Back to top button
        this.initBackToTop();
    }

    /**
     * Initialize header scroll effect
     */
    initHeaderScroll() {
        const header = document.querySelector('header');
        if (!header) return;

        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                header.classList.add('shadow-xl');
            } else {
                header.classList.remove('shadow-xl');
            }
            
            lastScroll = currentScroll;
        });
    }

    /**
     * Initialize scroll animations
     */
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in-up, .fade-in').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Initialize back to top button
     */
    initBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.remove('opacity-0', 'invisible');
                backToTopBtn.classList.add('opacity-100', 'visible');
            } else {
                backToTopBtn.classList.add('opacity-0', 'invisible');
                backToTopBtn.classList.remove('opacity-100', 'visible');
            }
        });
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        if (!menu) return;

        const isHidden = menu.classList.contains('hidden');
        menu.classList.toggle('hidden');
        
        // Update navigation when menu opens
        if (isHidden) {
            this.updateActiveNav();
        }
    }

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        if (menu) {
            menu.classList.add('hidden');
        }
    }

    /**
     * Scroll to section by ID
     * @param {string} sectionId - Section ID to scroll to
     */
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    /**
     * Scroll to menu section (with fallback to menu page)
     */
    scrollToMenu() {
        const menuSection = document.getElementById('menu');
        if (menuSection) {
            this.scrollToSection('menu');
        } else {
            window.location.href = 'menu.html';
        }
    }

    /**
     * Scroll to promotions section
     */
    scrollToPromotions() {
        const section = document.getElementById('promotions');
        if (section) {
            this.scrollToSection('promotions');
        } else {
            window.location.href = 'promotion.html';
        }
    }
}

// Create global navigation manager instance
const navigationManager = new NavigationManager();

// Global helper functions
function toggleMobileMenu() {
    navigationManager.toggleMobileMenu();
}

function closeMobileMenu() {
    navigationManager.closeMobileMenu();
}

function scrollToMenu() {
    navigationManager.scrollToMenu();
}

function scrollToPromotions() {
    navigationManager.scrollToPromotions();
}

function goToMenu() {
    window.location.href = 'menu.html';
}

function openGoogleMaps() {
    window.open('https://www.google.com/maps/search/123+Nguyễn+Văn+Linh,+Quận+7,+TP.HCM', '_blank');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NavigationManager, navigationManager };
}
