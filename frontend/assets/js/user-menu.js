// User menu dropdown handler with role-based admin access
async function initializeUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    if (!userDropdown) return;
    
    // Remove existing admin menu first to avoid duplicates
    const existingAdminLink = userDropdown.querySelector('a[href*="admin"]');
    if (existingAdminLink) {
        existingAdminLink.remove();
    }
    
    // Get user from API to ensure accurate role
    const user = await getCurrentUserFromAPI();
    
    if (user && user.role) {
        // Add admin menu if user is admin or staff
        if (user.role === 'admin' || user.role === 'staff') {
            const reservationLink = userDropdown.querySelector('a[href*="reservation-history"]');
            
            if (reservationLink) {
                // Create admin menu item
                const adminLink = document.createElement('a');
                adminLink.href = 'admin/admin-stats.html';
                adminLink.className = 'block px-4 py-2 text-gray-700 hover:bg-coffee hover:text-white transition-colors';
                adminLink.innerHTML = '<i class="fas fa-user-shield mr-2"></i>Quản trị';
                adminLink.id = 'adminMenuLink';
                
                // Insert after reservation history link
                reservationLink.parentNode.insertBefore(adminLink, reservationLink.nextSibling);
                
                console.log('✅ Admin menu added for role:', user.role);
            }
        }
    }
}

// Get current user - prioritizes localStorage, validates with API only if needed
async function getCurrentUserFromAPI() {
    try {
        // 1. Try localStorage first (fastest, no network call)
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                
                // Validate user has required fields
                if (user && user.role && (user.email || user.username)) {
                    console.log('✅ User loaded from localStorage:', user.role);
                    return user;
                }
            } catch (parseError) {
                console.log('⚠️ Could not parse user from storage:', parseError.message);
            }
        }
        
        // 2. No valid local data, try API
        const token = localStorage.getItem('token') || 
                     localStorage.getItem('authToken') || 
                     sessionStorage.getItem('authToken');
        
        if (!token) {
            console.log('⚠️ No token found, user not logged in');
            return null;
        }
        
        console.log('🔄 Fetching user from API...');
        
        const response = await fetch('http://localhost:3000/api/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('⚠️ Token expired or invalid (401). Please login again.');
                // Clear invalid token
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
                return null;
            }
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.user) {
            // Update localStorage with fresh data from API
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('✅ User fetched from API and cached:', data.user.role);
            return data.user;
        }
        
        return null;
    } catch (error) {
        console.log('❌ Error in getCurrentUserFromAPI:', error.message);
        return null;
    }
}

// Watch for localStorage changes (when user logs in/out)
window.addEventListener('storage', function(e) {
    if (e.key === 'user' || e.key === 'token') {
        console.log('🔄 User data changed, updating menu...');
        initializeUserMenu();
    }
});

// Custom event for same-window localStorage changes
window.addEventListener('userLogin', function() {
    console.log('🔄 User login detected, updating menu...');
    initializeUserMenu();
});

window.addEventListener('userLogout', function() {
    console.log('🔄 User logout detected, removing admin menu...');
    const adminLink = document.getElementById('adminMenuLink');
    if (adminLink) {
        adminLink.remove();
    }
});

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUserMenu);
} else {
    initializeUserMenu();
}

// Re-check every time user dropdown is opened
document.addEventListener('click', function(e) {
    const userButton = e.target.closest('[id*="userMenuBtn"], [id*="userButton"]');
    if (userButton) {
        // Small delay to ensure dropdown is visible
        setTimeout(initializeUserMenu, 50);
    }
});
