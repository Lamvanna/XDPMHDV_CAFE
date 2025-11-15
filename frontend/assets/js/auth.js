// Authentication functions for Coffee Shop System
// NOTE: This file is kept for backward compatibility
// Use auth-manager.js for new code - it provides centralized authentication

const AUTH_API_URL = 'http://localhost:3000/api/auth';

// Login function - kept for backward compatibility
// Prefer using authManager.login() from auth-manager.js
async function login(email, password, rememberMe = false) {
    if (typeof authManager !== 'undefined') {
        return await authManager.login(email, password, rememberMe);
    }
    
    // Fallback implementation
    try {
        const response = await fetch(`${AUTH_API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        if (data.success && data.token) {
            // Save token and user data - use consistent key names
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('token', data.token);
            storage.setItem('authToken', data.token); // Keep for backward compatibility
            storage.setItem('user', JSON.stringify(data.user));
            return data;
        }
        
        throw new Error('Invalid response from server');
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Register function - kept for backward compatibility
async function register(userData) {
    if (typeof authManager !== 'undefined') {
        return await authManager.register(userData);
    }
    
    // Fallback implementation
    try {
        const response = await fetch(`${AUTH_API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        if (data.success && data.token) {
            // Save token and user data (use 'token' key for consistency)
            localStorage.setItem('token', data.token);
            localStorage.setItem('authToken', data.token); // Keep for backward compatibility
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Dispatch custom event for user login
            window.dispatchEvent(new CustomEvent('userLogin', { detail: data.user }));
            
            return data;
        }
        
        throw new Error('Invalid response from server');
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Logout function - kept for backward compatibility
async function logout() {
    if (typeof authManager !== 'undefined') {
        return await authManager.logout();
    }
    
    // Fallback implementation
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (token) {
            // Call backend logout endpoint
            await fetch(`${AUTH_API_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear all auth data from both storages
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Also remove old 'token' key for backward compatibility
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('userLogout'));
    }
}

// Check if user is logged in
function isLoggedIn() {
    if (typeof authManager !== 'undefined') {
        return authManager.isLoggedIn();
    }
    
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    return !!(token && user);
}

// Get current user
function getCurrentUser() {
    if (typeof authManager !== 'undefined') {
        return authManager.getCurrentUser();
    }
    
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Get auth token
function getAuthToken() {
    if (typeof authManager !== 'undefined') {
        return authManager.getToken();
    }
    
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Check user role
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

function isStaff() {
    const user = getCurrentUser();
    return user && (user.role === 'staff' || user.role === 'admin');
}

function isCustomer() {
    const user = getCurrentUser();
    return user && user.role === 'customer';
}

// Update user profile
async function updateProfile(profileData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        // If profileData has 'name' field, split it into firstName and lastName
        if (profileData.name) {
            const nameParts = profileData.name.trim().split(' ');
            profileData.firstName = nameParts[0];
            profileData.lastName = nameParts.slice(1).join(' ');
            delete profileData.name;
        }
        
        const response = await fetch(`${AUTH_API_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Profile update failed');
        }
        
        if (data.success && data.user) {
            // Update user data in localStorage
            const storage = localStorage.getItem('authToken') ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(data.user));
            return data;
        }
        
        throw new Error('Invalid response from server');
    } catch (error) {
        console.error('Profile update error:', error);
        throw error;
    }
}

// Change password
async function changePassword(currentPassword, newPassword) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(`${AUTH_API_URL}/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Password change failed');
        }
        
        return data;
    } catch (error) {
        console.error('Password change error:', error);
        throw error;
    }
}

// Redirect if not authenticated
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Redirect if not admin
function requireAdmin() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return false;
    }
    if (!isAdmin()) {
        alert('Access denied. Admin privileges required.');
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Redirect if not staff
function requireStaff() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return false;
    }
    if (!isStaff()) {
        alert('Access denied. Staff privileges required.');
        window.location.href = '/index.html';
        return false;
    }
    return true;
}