// Shared utility functions for admin pages
// Import this file AFTER permissions.js

// Get auth token (compatible with both 'token' and 'authToken')
function getAuthToken() {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           sessionStorage.getItem('authToken');
}

// Get user data
function getUserData() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : {};
}

// Check if user is logged in
function isLoggedIn() {
    return !!getAuthToken() && !!getUserData().role;
}

// Get current user role
function getCurrentUserRole() {
    return getUserData().role || null;
}

// Check if user has admin role
function isAdmin() {
    return getCurrentUserRole() === 'admin';
}

// Check if user has staff role
function isStaff() {
    return getCurrentUserRole() === 'staff';
}

// Check if user has admin or staff role
function isAdminOrStaff() {
    const role = getCurrentUserRole();
    return role === 'admin' || role === 'staff';
}

// Logout function
function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('userLogout'));
        
        // Redirect to login
        window.location.href = '../login.html';
    }
}
