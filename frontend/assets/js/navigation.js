// Smooth page navigation with transitions
class PageNavigator {
    constructor() {
        this.transitionDuration = 150; // Giảm từ 300ms xuống 200ms cho nhanh hơn
        this.init();
    }

    init() {
        // Create transition overlay
        this.createTransitionOverlay();
        
        // Add click handlers to all internal links
        this.attachLinkHandlers();
        
        // Update active navigation
        this.updateActiveNav();
        
        // Handle back/forward buttons
        window.addEventListener('popstate', () => {
            this.updateActiveNav();
        });
    }

    createTransitionOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'page-transition';
        overlay.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

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
            
            // Handle internal navigation
            e.preventDefault();
            this.navigateTo(href);
        });
    }

    navigateTo(url) {
        // Show transition
        this.overlay.classList.add('active');
        
        // Navigate after transition
        setTimeout(() => {
            window.location.href = url;
        }, this.transitionDuration);
    }

    updateActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Update all navigation links
        document.querySelectorAll('nav a').forEach(link => {
            const href = link.getAttribute('href');
            
            // Remove active classes
            link.classList.remove('text-coffee', 'font-semibold', 'border-b-2', 'border-coffee', 'pb-1');
            link.classList.add('text-gray-700');
            
            // Add active class to current page
            if (href && (href === currentPage || 
                (currentPage === 'index.html' && href === '#') ||
                (currentPage === '' && href === '#'))) {
                link.classList.remove('text-gray-700');
                link.classList.add('text-coffee', 'font-semibold', 'border-b-2', 'border-coffee', 'pb-1');
            }
        });
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        setTimeout(() => menu.classList.add('active'), 10);
    } else {
        menu.classList.remove('active');
        setTimeout(() => menu.classList.add('hidden'), 300);
    }
}

// Cart toggle functions
function toggleCart() {
    window.location.href = 'cart.html';
}

function toggleMiniCart() {
    window.location.href = 'cart.html';
}

// Update cart count (Note: Also handled by ui-update.js)
function updateCartCount() {
    // Use ui-update.js version if available
    if (typeof window.updateCartCount === 'function' && window.updateCartCount.toString().includes('cartUpdated')) {
        return; // Let ui-update.js handle it
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('#cartCount');
    cartCountElements.forEach(el => {
        el.textContent = count;
        if (count > 0) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

// Scroll animations
function initScrollAnimations() {
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

    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });
}

// Header scroll effect
function initHeaderScroll() {
    const header = document.querySelector('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }

        lastScroll = currentScroll;
    });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 
                    type === 'error' ? 'bg-red-500' : 
                    type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
    
    notification.className = `fixed top-24 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 notification-enter`;
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('notification-exit');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize page navigator
    new PageNavigator();
    
    // Update cart count (only if ui-update.js hasn't done it)
    setTimeout(() => {
        if (typeof window.updateCartCount === 'function') {
            // Let ui-update.js handle cart count
        } else {
            updateCartCount();
        }
    }, 100);
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize header scroll effect
    initHeaderScroll();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});

// Scroll to menu function (for index.html)
function scrollToMenu() {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
        menuSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Note: handleLogin, handleLogout, and updateUserDisplay are now handled by ui-update.js
// These functions are kept here for backward compatibility but should not be used
