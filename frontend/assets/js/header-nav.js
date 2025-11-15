// Header and Navigation Functions
// This file handles all header and navigation interactions

// Toggle User Menu Dropdown
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Close user menu when clicking outside
document.addEventListener('click', function (event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');

    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

// Toggle Mobile Menu
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Logout Function
function logout() {
    // Clear ALL localStorage and sessionStorage FIRST
    localStorage.clear();
    sessionStorage.clear();

    // Show notification
    if (typeof showNotification === 'function') {
        showNotification('Đăng xuất thành công!', 'success');
    }

    // Force redirect with cache busting
    setTimeout(() => {
        window.location.href = 'index.html?logout=' + new Date().getTime();
    }, 300);
}

// Update User Display in Header
function updateUserDisplay() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const loginBtn = document.getElementById('loginBtn');
    const userBtn = document.getElementById('userBtn');
    const userName = document.getElementById('userName');

    if (token && user.name) {
        // User is logged in - Show user button, hide login button
        if (loginBtn) {
            loginBtn.style.display = 'none';
            loginBtn.classList.add('hidden');
        }
        if (userBtn) {
            userBtn.classList.remove('hidden');
            userBtn.classList.add('flex', 'md:flex');
            userBtn.style.display = 'inline-flex';
        }
        if (userName) {
            userName.textContent = user.name;
        }
    } else {
        // User is not logged in - Show login button, hide user button
        if (loginBtn) {
            loginBtn.classList.remove('hidden');
            loginBtn.style.display = 'inline-flex';
        }
        if (userBtn) {
            userBtn.classList.add('hidden');
            userBtn.classList.remove('flex', 'md:flex');
            userBtn.style.display = 'none';
        }
    }
}

// Update Cart Count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('#cartCount');

    cartCountElements.forEach(el => {
        el.textContent = count;
        if (count > 0) {
            el.classList.remove('hidden');
        }
    });
}

// Scroll to specific section
function scrollToPromotions() {
    const section = document.getElementById('promotions');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function goToMenu() {
    window.location.href = 'menu.html';
}

function scrollToMenu() {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.location.href = 'menu.html';
    }
}

// Open Google Maps
function openGoogleMaps() {
    window.open('https://www.google.com/maps/search/123+Nguyễn+Văn+Linh,+Quận+7,+TP.HCM', '_blank');
}

// Reservation Functions
function openNewReservation() {
    window.location.href = 'reservation.html';
}

function viewReservationDetail(reservationId) {
    console.log('View reservation:', reservationId);
    // TODO: Implement reservation detail view
    alert('Chi tiết đặt bàn #' + reservationId);
}

function reorderReservation(reservationId) {
    console.log('Reorder reservation:', reservationId);
    window.location.href = 'reservation.html?reorder=' + reservationId;
}

function cancelReservation(reservationId) {
    if (confirm('Bạn có chắc chắn muốn hủy đặt bàn này?')) {
        console.log('Cancel reservation:', reservationId);
        // TODO: Implement cancel reservation API call
        alert('Đã hủy đặt bàn #' + reservationId);
        location.reload();
    }
}

function editReservation(reservationId) {
    window.location.href = 'reservation.html?edit=' + reservationId;
}

// Promotion Functions
function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        if (typeof showNotification === 'function') {
            showNotification('Đã sao chép mã: ' + code, 'success');
        } else {
            alert('Đã sao chép mã: ' + code);
        }
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

function applyPromotion(code) {
    // Save promotion code to localStorage
    localStorage.setItem('appliedPromoCode', code);

    if (typeof showNotification === 'function') {
        showNotification('Đã áp dụng mã khuyến mãi: ' + code, 'success');
    }

    // Redirect to menu or cart
    setTimeout(() => {
        window.location.href = 'menu.html';
    }, 1000);
}

// Filter Functions
function applyFilters() {
    const fromDate = document.getElementById('fromDate')?.value;
    const toDate = document.getElementById('toDate')?.value;
    const status = document.getElementById('statusFilter')?.value;
    const search = document.getElementById('searchReservation')?.value;

    console.log('Applying filters:', { fromDate, toDate, status, search });
    // TODO: Implement filter logic
}

// Back to Top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/Hide Back to Top Button
window.addEventListener('scroll', function () {
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.remove('opacity-0', 'invisible');
            backToTopBtn.classList.add('opacity-100', 'visible');
        } else {
            backToTopBtn.classList.remove('opacity-100', 'visible');
            backToTopBtn.classList.add('opacity-0', 'invisible');
        }
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Update user display
    updateUserDisplay();

    // Update cart count immediately
    updateCartCount();

    // Listen for cart updates from localStorage
    window.addEventListener('storage', function (e) {
        if (e.key === 'cart') {
            updateCartCount();
        }
    });

    // Listen for custom cart update events
    window.addEventListener('cartUpdated', updateCartCount);

    // Listen for login/logout events
    window.addEventListener('userLoggedIn', updateUserDisplay);
    window.addEventListener('userLoggedOut', updateUserDisplay);

    // Update cart count every 500ms to catch any changes
    setInterval(updateCartCount, 500);
});

// Show notification helper
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';

    notification.className = `fixed top-24 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300`;
    notification.style.transform = 'translateX(400px)';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
