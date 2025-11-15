// Centralized Authentication Management System
// Handles all authentication operations with consistent token/user storage

class AuthManager {
    constructor() {
        this.tokenKey = 'authToken';
        this.userKey = 'user';
        this.API_URL = 'http://localhost:3000/api/auth';
        this.init();
    }

    /**
     * Initialize auth manager
     */
    init() {
        this.setupEventListeners();
        this.updateUIForAuthState();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for auth state changes
        window.addEventListener('authStateChanged', () => {
            this.updateUIForAuthState();
        });

        // Listen for storage changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.tokenKey || e.key === this.userKey) {
                this.dispatchAuthChange();
            }
        });
    }

    /**
     * Dispatch auth state change event
     */
    dispatchAuthChange() {
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: {
                isLoggedIn: this.isLoggedIn(),
                user: this.getCurrentUser()
            }
        }));
    }

    /**
     * Get auth token from storage
     * @returns {string|null} Auth token or null
     */
    getToken() {
        return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
    }

    /**
     * Get current user from storage
     * @returns {Object|null} User object or null
     */
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem(this.userKey) || sessionStorage.getItem(this.userKey);
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    /**
     * Fetch and sync user data from API if missing in localStorage
     * @returns {Promise<Object|null>} User object or null
     */
    async syncUserData() {
        try {
            // Check if user data already exists
            const existingUser = this.getCurrentUser();
            if (existingUser && existingUser.role) {
                console.log('✅ User data already exists:', existingUser.role);
                return existingUser;
            }

            // Check if we have a token
            const token = this.getToken();
            if (!token) {
                console.log('⚠️ No token found, cannot sync user data');
                return null;
            }

            console.log('🔄 Syncing user data from API...');

            // Fetch user profile from API
            const response = await fetch(`${this.API_URL.replace('/auth', '')}/users/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('⚠️ Token expired, clearing auth data');
                    this.logout();
                    return null;
                }
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.user) {
                // Save user data to storage
                const storage = localStorage.getItem(this.tokenKey) ? localStorage : sessionStorage;
                storage.setItem(this.userKey, JSON.stringify(data.user));
                
                console.log('✅ User data synced successfully:', data.user.role);
                return data.user;
            }

            return null;
        } catch (error) {
            console.error('❌ Error syncing user data:', error);
            return null;
        }
    }

    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in
     */
    isLoggedIn() {
        const token = this.getToken();
        const user = this.getCurrentUser();
        return !!(token && user);
    }

    /**
     * Check if current user has specific role
     * @param {string} role - Role to check (admin, staff, customer)
     * @returns {boolean} True if user has role
     */
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }

    /**
     * Check if current user is admin
     * @returns {boolean} True if user is admin
     */
    isAdmin() {
        return this.hasRole('admin');
    }

    /**
     * Check if current user is staff
     * @returns {boolean} True if user is staff
     */
    isStaff() {
        return this.hasRole('staff');
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {boolean} rememberMe - Remember user (default: false)
     * @returns {Promise<Object>} Login response
     */
    async login(email, password, rememberMe = false) {
        try {
            const response = await fetch(`${this.API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Xử lý lỗi cụ thể
                if (response.status === 401) {
                    throw new Error('Email hoặc mật khẩu không đúng');
                } else if (response.status === 404) {
                    throw new Error('Tài khoản không tồn tại');
                }
                throw new Error(data.error || data.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            }

            if (data.success && data.token && data.user) {
                // Store token and user (save with both keys for consistency)
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem(this.tokenKey, data.token);
                storage.setItem('token', data.token); // Also save with 'token' key
                storage.setItem(this.userKey, JSON.stringify(data.user));

                // Dispatch auth change event
                this.dispatchAuthChange();

                if (typeof showNotification === 'function') {
                    showNotification(`Xin chào, ${data.user.firstName || data.user.username}!`, 'success');
                }

                return data;
            }

            throw new Error('Phản hồi không hợp lệ từ server');
        } catch (error) {
            console.error('Login error:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message, 'error');
            }
            throw error;
        }
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration response
     */
    async register(userData) {
        try {
            const response = await fetch(`${this.API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            console.log('📥 Backend response:', { status: response.status, ok: response.ok, data });

            if (!response.ok) {
                console.log('❌ Response not OK, handling error...');
                // Xử lý lỗi cụ thể
                if (response.status === 400) {
                    const errorMsg = data.error || data.message || '';
                    const lowerMsg = errorMsg.toLowerCase();
                    
                    // Check exact error messages
                    if (lowerMsg.includes('email') && (lowerMsg.includes('exist') || lowerMsg.includes('already') || lowerMsg.includes('taken'))) {
                        throw new Error('Email đã được sử dụng. Vui lòng chọn email khác.');
                    } 
                    
                    if (lowerMsg.includes('username') && (lowerMsg.includes('exist') || lowerMsg.includes('already') || lowerMsg.includes('taken'))) {
                        throw new Error('Tên đăng nhập đã tồn tại.');
                    }
                    
                    // Only show generic "already exists" if the message explicitly says so
                    if ((lowerMsg.includes('user') || lowerMsg.includes('account')) && 
                        (lowerMsg.includes('exist') || lowerMsg.includes('already'))) {
                        throw new Error('Tài khoản đã tồn tại. Vui lòng sử dụng thông tin khác.');
                    }
                    
                    // Return the original error message from backend
                    if (errorMsg) {
                        throw new Error(errorMsg);
                    }
                }
                
                throw new Error(data.error || data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            }

            // Only process success if response is OK
            console.log('✅ Response OK, processing success...');
            if (data.success && data.token && data.user) {
                console.log('💾 Storing token and user...');
                // Store token and user
                localStorage.setItem(this.tokenKey, data.token);
                localStorage.setItem('token', data.token); // Also save with 'token' key
                localStorage.setItem(this.userKey, JSON.stringify(data.user));

                // Dispatch auth change event
                this.dispatchAuthChange();

                if (typeof showNotification === 'function') {
                    showNotification('Đăng ký thành công!', 'success');
                }

                return data;
            }

            throw new Error('Phản hồi không hợp lệ từ server');
        } catch (error) {
            console.error('Registration error:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message, 'error');
            }
            throw error;
        }
    }

    /**
     * Logout user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            const token = this.getToken();

            // Call backend logout endpoint if token exists
            if (token) {
                try {
                    await fetch(`${this.API_URL}/logout`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                } catch (error) {
                    console.error('Logout API call failed:', error);
                    // Continue with local cleanup even if API fails
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear all auth data from both storages
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.userKey);
            sessionStorage.removeItem(this.tokenKey);
            sessionStorage.removeItem(this.userKey);

            // Dispatch auth change event
            this.dispatchAuthChange();

            if (typeof showNotification === 'function') {
                showNotification('Đăng xuất thành công!', 'success');
            }
        }
    }

    /**
     * Update UI based on authentication state
     */
    updateUIForAuthState() {
        const isUserLoggedIn = this.isLoggedIn();
        const user = this.getCurrentUser();

        // Update login/user button
        const loginBtn = document.getElementById('loginBtn');
        const userBtn = document.getElementById('userBtn');
        const userName = document.getElementById('userName');

        if (isUserLoggedIn && user) {
            // User is logged in
            if (loginBtn) {
                loginBtn.classList.add('hidden');
                loginBtn.style.display = 'none';
            }
            if (userBtn) {
                userBtn.classList.remove('hidden');
                userBtn.style.display = 'inline-flex';
            }
            if (userName) {
                const displayName = user.firstName || user.username || 'Tài khoản';
                userName.textContent = displayName;
            }

            // Update mobile menu
            this.updateMobileMenuForAuth(user);
        } else {
            // User is not logged in
            if (loginBtn) {
                loginBtn.classList.remove('hidden');
                loginBtn.style.display = 'inline-flex';
            }
            if (userBtn) {
                userBtn.classList.add('hidden');
                userBtn.style.display = 'none';
            }

            // Update mobile menu
            this.updateMobileMenuForAuth(null);
        }
    }

    /**
     * Update mobile menu for auth state
     * @param {Object|null} user - User object or null
     */
    updateMobileMenuForAuth(user) {
        const mobileMenu = document.getElementById('mobileMenu');
        if (!mobileMenu) return;

        let userSection = mobileMenu.querySelector('.mobile-user-section');

        if (user) {
            if (!userSection) {
                const navElement = mobileMenu.querySelector('nav');
                if (navElement) {
                    userSection = document.createElement('div');
                    userSection.className = 'mobile-user-section pt-3 mt-3 border-t border-gray-200';
                    navElement.appendChild(userSection);
                }
            }

            if (userSection) {
                userSection.innerHTML = `
                    <p class="text-sm text-gray-600 mb-2">
                        Xin chào, <span class="font-semibold text-coffee">${user.firstName || user.username}</span>
                    </p>
                    <a href="profile.html" class="block text-gray-700 hover:text-coffee py-2">
                        <i class="fas fa-user-circle mr-2"></i>Hồ sơ
                    </a>
                    <a href="my-orders.html" class="block text-gray-700 hover:text-coffee py-2">
                        <i class="fas fa-shopping-bag mr-2"></i>Đơn hàng của tôi
                    </a>
                    ${user.role === 'admin' ? `
                        <a href="admin/admin-stats.html" class="block text-gray-700 hover:text-coffee py-2">
                            <i class="fas fa-cog mr-2"></i>Quản trị
                        </a>
                    ` : ''}
                    <a href="#" onclick="handleLogout(); return false;" class="block text-red-600 hover:text-red-700 py-2">
                        <i class="fas fa-sign-out-alt mr-2"></i>Đăng xuất
                    </a>
                `;
            }
        } else {
            if (userSection) {
                userSection.remove();
            }
        }
    }

    /**
     * Require authentication - redirect to login if not authenticated
     * @param {string} redirectUrl - URL to redirect after login (default: current page)
     */
    requireAuth(redirectUrl = null) {
        if (!this.isLoggedIn()) {
            const returnUrl = redirectUrl || window.location.href;
            window.location.href = `login.html?returnUrl=${encodeURIComponent(returnUrl)}`;
            return false;
        }
        return true;
    }

    /**
     * Require admin role - redirect if not admin
     */
    requireAdmin() {
        if (!this.requireAuth()) return false;
        
        if (!this.isAdmin()) {
            if (typeof showNotification === 'function') {
                showNotification('Bạn không có quyền truy cập trang này!', 'error');
            }
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return false;
        }
        return true;
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Auto-sync user data on page load if token exists but user data is missing
(async function autoSyncUserData() {
    const token = authManager.getToken();
    const user = authManager.getCurrentUser();
    
    // If has token but no user data (or no role), sync from API
    if (token && (!user || !user.role)) {
        console.log('🔄 Auto-syncing user data on page load...');
        await authManager.syncUserData();
    }
})();

// Global helper functions for backward compatibility
function getAuthToken() {
    return authManager.getToken();
}

function getCurrentUser() {
    return authManager.getCurrentUser();
}

function isLoggedIn() {
    return authManager.isLoggedIn();
}

async function login(email, password, rememberMe = false) {
    return await authManager.login(email, password, rememberMe);
}

async function register(userData) {
    return await authManager.register(userData);
}

async function logout() {
    await authManager.logout();
}

// Handle logout with redirect
async function handleLogout() {
    await logout();
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Toggle user menu dropdown
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Close user menu when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');
    
    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    authManager.updateUIForAuthState();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, authManager };
}
