// UI Update System - Handles dynamic UI updates based on authentication state

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', function () {
    updateUIForAuthState();
    updateCartCount();
    updateActiveNavigation();
});

// Main function to update UI based on authentication state
function updateUIForAuthState() {
    const isUserLoggedIn = isLoggedIn();
    const user = getCurrentUser();

    // Update login/user button
    const loginBtn = document.getElementById('loginBtn');
    const userBtn = document.getElementById('userBtn');
    const userName = document.getElementById('userName');

    if (isUserLoggedIn && user) {
        // User is logged in - show user button, hide login button
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userBtn) userBtn.classList.remove('hidden');

        // Update user name display
        if (userName) {
            const displayName = user.firstName || user.username || 'Tài khoản';
            userName.textContent = displayName;
        }

        console.log('UI updated for logged in user:', user.username);
    } else {
        // User is not logged in - show login button, hide user button
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userBtn) userBtn.classList.add('hidden');

        console.log('UI updated for guest user');
    }

    // Update mobile menu if exists
    updateMobileMenuForAuthState(isUserLoggedIn, user);

    // Update admin links if user is admin/staff
    updateAdminLinksForRole(user);
}

// Update mobile menu based on auth state
function updateMobileMenuForAuthState(isLoggedIn, user) {
    const mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu) return;

    // Find or create user info section in mobile menu
    let userSection = mobileMenu.querySelector('.mobile-user-section');

    if (isLoggedIn && user) {
        if (!userSection) {
            // Create user section if it doesn't exist
            const navElement = mobileMenu.querySelector('nav');
            if (navElement) {
                userSection = document.createElement('div');
                userSection.className = 'mobile-user-section pt-3 mt-3 border-t border-gray-200';
                userSection.innerHTML = `
                    <p class="text-sm text-gray-600 mb-2">Xin chào, <span class="font-semibold text-coffee" id="mobileUserName"></span></p>
                    <a href="profile.html" class="block text-gray-700 hover:text-coffee py-2">
                        <i class="fas fa-user-circle mr-2"></i>Hồ sơ
                    </a>
                    <a href="my-orders.html" class="block text-gray-700 hover:text-coffee py-2">
                        <i class="fas fa-shopping-bag mr-2"></i>Đơn hàng của tôi
                    </a>
                    <a href="#" onclick="handleLogout(); return false;" class="block text-red-600 hover:text-red-700 py-2">
                        <i class="fas fa-sign-out-alt mr-2"></i>Đăng xuất
                    </a>
                `;
                navElement.appendChild(userSection);
            }
        }

        // Update mobile user name
        const mobileUserName = document.getElementById('mobileUserName');
        if (mobileUserName) {
            mobileUserName.textContent = user.firstName || user.username;
        }
    } else {
        // Remove user section if exists
        if (userSection) {
            userSection.remove();
        }
    }
}

// Update admin links visibility based on user role
function updateAdminLinksForRole(user) {
    if (!user) return;

    // Show/hide admin links based on role
    const adminLinks = document.querySelectorAll('[data-role="admin"]');
    const staffLinks = document.querySelectorAll('[data-role="staff"]');

    if (user.role === 'admin') {
        adminLinks.forEach(link => link.classList.remove('hidden'));
        staffLinks.forEach(link => link.classList.remove('hidden'));
    } else if (user.role === 'staff') {
        adminLinks.forEach(link => link.classList.add('hidden'));
        staffLinks.forEach(link => link.classList.remove('hidden'));
    } else {
        adminLinks.forEach(link => link.classList.add('hidden'));
        staffLinks.forEach(link => link.classList.add('hidden'));
    }
}

// Toggle user dropdown menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');

    if (dropdown && !userMenu?.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

// Handle logout with UI update
async function handleLogout() {
    try {
        // Call logout function from auth.js
        await logout();

        // Update UI immediately
        updateUIForAuthState();

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification('Đăng xuất thành công!', 'success');
        }

        // Redirect to home after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);

    } catch (error) {
        console.error('Logout error:', error);
        if (typeof showNotification === 'function') {
            showNotification('Có lỗi xảy ra khi đăng xuất', 'error');
        }
    }
}

// Update cart count in header
function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    if (!cartCountElement) return;

    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCountElement.textContent = totalItems;

        // Show/hide badge based on count
        if (totalItems > 0) {
            cartCountElement.classList.remove('hidden');
        } else {
            cartCountElement.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
        cartCountElement.textContent = '0';
    }
}

// Listen for storage changes (when another tab logs in/out)
window.addEventListener('storage', function (e) {
    if (e.key === 'authToken' || e.key === 'user') {
        updateUIForAuthState();
    }
    if (e.key === 'cart') {
        updateCartCount();
    }
});

// Listen for custom cart update events
window.addEventListener('cartUpdated', function () {
    updateCartCount();
});

// Update active navigation highlight
function updateActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Remove active classes from all nav links
    document.querySelectorAll('nav a, .nav-link').forEach(link => {
        link.classList.remove('text-coffee', 'font-semibold', 'border-b-2', 'border-coffee');
    });

    // Add active class to current page link
    document.querySelectorAll('nav a, .nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Extract filename from href
        const linkPage = href.split('/').pop().split('?')[0].split('#')[0];

        // Check if this is the current page
        if (linkPage === currentPage ||
            (currentPage === 'index.html' && (linkPage === 'index.html' || linkPage === '' || linkPage === '/' || href === '#'))) {
            link.classList.add('text-coffee', 'font-semibold');

            // Add border for desktop nav
            if (link.classList.contains('nav-link')) {
                link.classList.add('border-b-2', 'border-coffee');
            }
        }
    });

    // Update mobile menu active state
    updateMobileNavigation(currentPage);
}

// Update mobile menu navigation
function updateMobileNavigation(currentPage) {
    const mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu) return;

    mobileMenu.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        const linkPage = href.split('/').pop().split('?')[0].split('#')[0];

        // Remove active classes
        link.classList.remove('text-coffee', 'font-semibold', 'bg-coffee', 'bg-opacity-10');

        // Add active class if current page
        if (linkPage === currentPage ||
            (currentPage === 'index.html' && (linkPage === 'index.html' || linkPage === ''))) {
            link.classList.add('text-coffee', 'font-semibold', 'bg-coffee', 'bg-opacity-10');
        }
    });
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.updateUIForAuthState = updateUIForAuthState;
    window.updateCartCount = updateCartCount;
    window.toggleUserMenu = toggleUserMenu;
    window.handleLogout = handleLogout;
    window.updateActiveNavigation = updateActiveNavigation;
}
