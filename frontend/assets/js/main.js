// Main JavaScript file
// NOTE: Auth and UI updates are now handled by ui-update.js
// This file only contains shared utility functions

document.addEventListener('DOMContentLoaded', function() {
    console.log('Coffee System loaded');

    // Initialize common functionality
    initScrollEffects();
    
    // Note: Navigation, User Auth, and Cart Count are now handled by ui-update.js
});

function initScrollEffects() {
    // Back to top button
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.remove('opacity-0', 'invisible');
                backToTopBtn.classList.add('opacity-100', 'visible');
            } else {
                backToTopBtn.classList.add('opacity-0', 'invisible');
                backToTopBtn.classList.remove('opacity-100', 'visible');
            }
        });
    }
}

// Toggle mobile menu (global function)
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        const isHidden = mobileMenu.classList.contains('hidden');
        mobileMenu.classList.toggle('hidden');
        
        // Update navigation active state when menu opens
        if (isHidden && typeof updateActiveNavigation === 'function') {
            updateActiveNavigation();
        }
    }
}

// Note: toggleUserMenu, logout are now handled by ui-update.js

// Scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Note: updateCartCount is now handled by ui-update.js
// This is kept for backward compatibility only
function updateCartCount() {
    if (typeof window.updateCartCount === 'function' && 
        window.updateCartCount.toString().includes('cartUpdated')) {
        // Use ui-update.js version
        window.updateCartCount();
    } else {
        // Fallback
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
    }
}

// Format price helper (if not defined in api.js)
if (typeof formatPrice === 'undefined') {
    function formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }
}

// Format date helper (if not defined in api.js)
if (typeof formatDate === 'undefined') {
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Format date time helper (if not defined in api.js)
if (typeof formatDateTime === 'undefined') {
    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
