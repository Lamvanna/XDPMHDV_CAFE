// Permission Management System

// Helper function to get auth token (check both 'token' and 'authToken')
function getAuthToken() {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           sessionStorage.getItem('authToken');
}

// Helper function to get user data
function getUserData() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : {};
}

const PERMISSIONS = {
    admin: {
        canAccessStats: true,
        canAccessProducts: true,
        canAccessOrders: true,
        canAccessPromotions: true,
        canAccessTables: true,
        canAccessStaff: true,
        canAccessInventory: true,
        canAccessSettings: true,
        canAccessPOS: true,
        canAccessContacts: true,
        canAccessUsers: true
    },
    staff: {
        canAccessStats: true,           // ✅ Xem thống kê dashboard
        canAccessProducts: true,        // ✅ Xem sản phẩm (chỉ xem)
        canAccessOrders: true,          // ✅ Xem và xử lý đơn hàng
        canAccessPromotions: false,     // ❌ Không quản lý khuyến mãi
        canAccessTables: true,          // ✅ Quản lý bàn
        canAccessStaff: false,          // ❌ Không quản lý nhân viên
        canAccessInventory: false,      // ❌ Không quản lý kho
        canAccessSettings: false,       // ❌ Không cài đặt hệ thống
        canAccessPOS: true,             // ✅ Dùng POS bán hàng
        canAccessContacts: true,        // ✅ Xem tin nhắn liên hệ
        canAccessUsers: false           // ❌ Không quản lý người dùng
    },
    customer: {
        canAccessStats: false,
        canAccessProducts: false,
        canAccessOrders: false,
        canAccessPromotions: false,
        canAccessTables: false,
        canAccessStaff: false,
        canAccessInventory: false,
        canAccessSettings: false,
        canAccessPOS: false
    }
};

// Page to permission mapping
const PAGE_PERMISSIONS = {
    'admin-stats.html': 'canAccessStats',
    'admin-products.html': 'canAccessProducts',
    'admin-orders.html': 'canAccessOrders',
    'admin-promotions.html': 'canAccessPromotions',
    'admin-tables.html': 'canAccessTables',
    'admin-staff.html': 'canAccessStaff',
    'admin-inventory.html': 'canAccessInventory',
    'admin-settings.html': 'canAccessSettings',
    'staff-pos.html': 'canAccessPOS',
    'admin-contacts.html': 'canAccessContacts',
    'admin-users.html': 'canAccessUsers'
};

// Check if user has permission
function hasPermission(userRole, permission) {
    if (!userRole || !PERMISSIONS[userRole]) return false;
    return PERMISSIONS[userRole][permission] === true;
}

// Check current page access
function checkPageAccess() {
    const token = getAuthToken();
    const user = getUserData();
    
    // Debug log
    console.log('🔒 Permission Check:', {
        page: window.location.pathname.split('/').pop(),
        hasToken: !!token,
        userRole: user.role,
        user: user
    });
    
    // If no token or no user role, redirect to login
    if (!token || !user.role) {
        alert('Vui lòng đăng nhập!');
        window.location.href = '../login.html';
        return false;
    }
    
    const currentPage = window.location.pathname.split('/').pop();
    const requiredPermission = PAGE_PERMISSIONS[currentPage];
    
    // If page doesn't require special permission, allow access
    if (!requiredPermission) return true;
    
    // Check if user has required permission
    if (!hasPermission(user.role, requiredPermission)) {
        console.warn('❌ Access Denied:', {
            user: user.role,
            page: currentPage,
            required: requiredPermission
        });
        
        // Show alert for better UX
        alert(`Bạn không có quyền truy cập trang này!\nVai trò hiện tại: ${getRoleDisplayName(user.role)}`);
        
        // Redirect staff to appropriate page
        if (user.role === 'staff') {
            window.location.href = 'admin-orders.html';
        } else {
            showAccessDenied(user.role);
        }
        return false;
    }
    
    console.log('✅ Access Granted');
    return true;
}

// Show access denied message
function showAccessDenied(userRole) {
    const mainContent = document.querySelector('.ml-64');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <div class="mb-6">
                    <i class="fas fa-lock text-red-500 text-6xl"></i>
                </div>
                <h2 class="text-3xl font-bold text-gray-800 mb-4">Không có quyền truy cập</h2>
                <p class="text-gray-600 mb-2">Bạn không có quyền truy cập trang này.</p>
                <p class="text-sm text-gray-500 mb-8">Vai trò hiện tại: <span class="font-semibold">${getRoleDisplayName(userRole)}</span></p>
                <div class="space-x-4">
                    <a href="admin-orders.html" class="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-all">
                        <i class="fas fa-shopping-cart mr-2"></i>Về trang Đơn hàng
                    </a>
                    <a href="../index.html" class="inline-block px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all">
                        <i class="fas fa-home mr-2"></i>Về trang chủ
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Get role display name
function getRoleDisplayName(role) {
    const roleNames = {
        admin: 'Quản trị viên',
        staff: 'Nhân viên',
        customer: 'Khách hàng'
    };
    return roleNames[role] || role;
}

// Filter sidebar menu based on permissions
function filterSidebarMenu() {
    const user = getUserData();
    const role = user.role;
    
    console.log('🔧 Filtering sidebar for role:', role);
    
    if (!role || role === 'admin') return; // Admin sees everything
    
    // Staff should only see: Dashboard, Products, Orders, Tables, POS, Contacts
    if (role === 'staff') {
        const staffAllowedPages = [
            'admin-stats.html',      // Dashboard
            'admin-products.html',   // Sản phẩm (chỉ xem)
            'admin-orders.html',     // Đơn hàng
            'admin-tables.html',     // Quản lý bàn
            'staff-pos.html',        // POS
            'admin-contacts.html'    // Tin nhắn liên hệ
        ];
        
        // Hide all other admin pages
        document.querySelectorAll('nav a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href.includes('admin-') || href.includes('staff-'))) {
                const isAllowed = staffAllowedPages.some(page => href.includes(page));
                if (!isAllowed) {
                    link.style.display = 'none';
                    console.log('🚫 Hiding:', href);
                } else {
                    console.log('✅ Showing:', href);
                }
            }
        });
        return;
    }
    
    // For other roles, check permissions
    const menuItems = document.querySelectorAll('nav a[href^="admin-"], nav a[href^="staff-"]');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        const filename = href.split('/').pop();
        const requiredPermission = PAGE_PERMISSIONS[filename];
        
        if (requiredPermission && !hasPermission(role, requiredPermission)) {
            // Hide menu item for staff without permission
            item.style.display = 'none';
        }
    });
}

// Show permission badge on menu items
function addPermissionBadges() {
    const user = getUserData();
    const role = user.role;
    
    if (role === 'admin') return; // Admin doesn't need badges
    
    const menuItems = document.querySelectorAll('nav a[href^="admin-"], nav a[href^="staff-"]');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        const filename = href.split('/').pop();
        const requiredPermission = PAGE_PERMISSIONS[filename];
        
        if (requiredPermission && !hasPermission(role, requiredPermission)) {
            // Add lock icon for restricted pages
            const icon = item.querySelector('i');
            if (icon) {
                icon.classList.add('fa-lock');
                icon.classList.remove('fa-chart-line', 'fa-coffee', 'fa-shopping-cart', 'fa-tag', 'fa-chair', 'fa-users', 'fa-warehouse', 'fa-cog', 'fa-cash-register');
            }
            item.classList.add('opacity-50', 'cursor-not-allowed');
            item.onclick = (e) => {
                e.preventDefault();
                alert('Bạn không có quyền truy cập trang này!');
            };
        }
    });
}

// Initialize permission system
document.addEventListener('DOMContentLoaded', () => {
    // Wait for user data to be available (in case user-menu.js is fetching from API)
    const checkAndInitialize = () => {
        const token = getAuthToken();
        const user = getUserData();
        
        // If we have token but no user data yet, wait a bit longer
        if (token && !user.role) {
            console.log('⏳ Waiting for user data...');
            setTimeout(checkAndInitialize, 100);
            return;
        }
        
        // Check page access first
        const hasAccess = checkPageAccess();
        
        // If has access, filter sidebar menu
        if (hasAccess) {
            filterSidebarMenu();
        }
    };
    
    checkAndInitialize();
});

// IMMEDIATE PERMISSION CHECK (runs before DOM ready)
(function() {
    const token = getAuthToken();
    const user = getUserData();
    
    if (token && user.role) {
        const currentPage = window.location.pathname.split('/').pop();
        const requiredPermission = PAGE_PERMISSIONS[currentPage];
        
        if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
            console.error('🚫 IMMEDIATE BLOCK - No permission for:', currentPage);
            alert(`Bạn không có quyền truy cập trang này!\nVai trò: ${getRoleDisplayName(user.role)}`);
            
            if (user.role === 'staff') {
                window.location.href = 'admin-orders.html';
            } else {
                window.location.href = '../login.html';
            }
        }
    }
})();
