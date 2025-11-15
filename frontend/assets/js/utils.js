// Shared Utility Functions for Coffee Shop System
// All common utility functions should be defined here to avoid duplication

/**
 * Format price in Vietnamese Dong
 * @param {number} price - Price to format
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
    if (typeof price !== 'number') {
        price = parseFloat(price) || 0;
    }
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

/**
 * Format date to Vietnamese format
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format date and time to Vietnamese format
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted datetime string
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format time only
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted time string
 */
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Show notification toast
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification-toast');
    existingNotifications.forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 translate-x-full max-w-md`;
    
    // Set background color based on type
    const bgColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.classList.add(bgColors[type] || bgColors.info);
    
    notification.innerHTML = `
        <div class="flex items-center text-white">
            <i class="fas ${icons[type] || icons.info} mr-3 text-xl"></i>
            <span class="font-medium">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Slide in animation
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 10);
    
    // Auto remove after duration
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Show loading spinner overlay
 */
function showLoading() {
    const existingLoader = document.getElementById('globalLoader');
    if (existingLoader) return;
    
    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loader.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl">
            <div class="flex items-center space-x-3">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-coffee"></div>
                <span class="text-coffee font-semibold">Đang xử lý...</span>
            </div>
        </div>
    `;
    document.body.appendChild(loader);
}

/**
 * Hide loading spinner overlay
 */
function hideLoading() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.remove();
    }
}

/**
 * Confirm dialog with custom styling
 * @param {string} message - Message to display
 * @param {string} title - Dialog title
 * @returns {Promise<boolean>} Promise that resolves to true if confirmed
 */
async function confirmDialog(message, title = 'Xác nhận') {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                <div class="bg-coffee text-white px-6 py-4">
                    <h3 class="text-xl font-bold">${title}</h3>
                </div>
                <div class="p-6">
                    <p class="text-gray-700 text-lg">${message}</p>
                </div>
                <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                    <button class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors" onclick="this.closest('.fixed').remove(); window.confirmDialogResolve(false);">
                        Hủy
                    </button>
                    <button class="px-4 py-2 bg-coffee text-white rounded-lg hover:bg-coffee-dark transition-colors" onclick="this.closest('.fixed').remove(); window.confirmDialogResolve(true);">
                        Xác nhận
                    </button>
                </div>
            </div>
        `;
        
        window.confirmDialogResolve = resolve;
        document.body.appendChild(dialog);
    });
}

/**
 * Debounce function to limit rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit rate of function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Scroll to top of page smoothly
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Scroll to element by ID
 * @param {string} elementId - ID of element to scroll to
 */
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (Vietnamese format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
function isValidPhone(phone) {
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Generate random ID
 * @returns {string} Random ID string
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Promise that resolves to true if successful
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Đã sao chép vào clipboard!', 'success');
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        showNotification('Không thể sao chép!', 'error');
        return false;
    }
}

/**
 * Check if user is on mobile device
 * @returns {boolean} True if mobile device
 */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Get product image URL with fallback
 * @param {string} image - Image filename or URL
 * @returns {string} Full image URL
 */
function getProductImageUrl(image) {
    if (!image) {
        return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80';
    }
    
    // Check if image is base64 encoded (from database)
    if (image.startsWith('data:image')) {
        return image;
    }
    
    // If already a full URL, return as is
    if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
    }
    
    // Otherwise, construct URL from assets
    return `assets/images/products/${image}`;
}

/**
 * Get badge text for product based on properties
 * @param {Object} product - Product object
 * @returns {string|null} Badge text or null
 */
function getBadgeForProduct(product) {
    if (product.isNew) return 'Mới';
    if (product.isBestSeller) return 'Bán chạy';
    if (product.isHot) return 'Hot';
    if (product.discount > 0) return `-${product.discount}%`;
    return null;
}

/**
 * Calculate discount amount
 * @param {number} price - Original price
 * @param {number} discount - Discount percentage
 * @returns {number} Discounted price
 */
function calculateDiscount(price, discount) {
    return price * (1 - discount / 100);
}

/**
 * Toggle mobile menu visibility
 */
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
    
    menu.classList.toggle('hidden');
}

/**
 * Toggle user dropdown menu
 */
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (!dropdown) return;
    
    dropdown.classList.toggle('hidden');
    
    // Close dropdown when clicking outside
    if (!dropdown.classList.contains('hidden')) {
        setTimeout(() => {
            document.addEventListener('click', function closeDropdown(e) {
                if (!e.target.closest('.user-menu')) {
                    dropdown.classList.add('hidden');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 10);
    }
}

/**
 * Logout user
 */
async function logout() {
    if (typeof authManager !== 'undefined' && authManager.logout) {
        await authManager.logout();
    } else {
        // Fallback logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        
        showNotification('Đã đăng xuất thành công!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatPrice,
        formatDate,
        formatDateTime,
        formatTime,
        showNotification,
        showLoading,
        hideLoading,
        confirmDialog,
        debounce,
        throttle,
        scrollToTop,
        scrollToElement,
        isValidEmail,
        isValidPhone,
        generateId,
        copyToClipboard,
        isMobile,
        getProductImageUrl,
        getBadgeForProduct,
        calculateDiscount,
        toggleMobileMenu,
        toggleUserMenu,
        logout
    };
}
