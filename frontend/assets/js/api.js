// API interaction functions
const API_BASE_URL = 'http://localhost:3000/api';
const API_URL = 'http://localhost:3000'; // Base URL without /api for backward compatibility

// Get auth token from storage
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Get user from storage
function getCurrentUser() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Helper function to fetch with error handling and authentication
async function fetchAPI(endpoint, options = {}) {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Add Authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
            console.log('⚠️ Token expired or invalid (401). Clearing auth data...');
            
            // Clear all auth data
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            
            // Check if we're already on login page to avoid redirect loop
            if (!window.location.pathname.includes('login.html')) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = 'login.html';
            }
            
            throw new Error('Authentication required');
        }
        
        // Handle 403 Forbidden - insufficient permissions
        if (response.status === 403) {
            console.log('⚠️ Access denied (403) - insufficient permissions');
            const data = await response.json();
            throw new Error(data.error || 'Bạn không có quyền truy cập chức năng này');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error(`❌ Error fetching ${endpoint}:`, error.message);
        throw error;
    }
}

// Products API
async function fetchProducts(category = null) {
    try {
        let endpoint = '/products';
        if (category && category !== 'all') {
            endpoint += `?category=${encodeURIComponent(category)}`;
        }
        
        const response = await fetchAPI(endpoint);
        return response.products || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function fetchProduct(id) {
    try {
        const response = await fetchAPI(`/products/${id}`);
        return response.product || null;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

async function fetchProductByName(name) {
    try {
        const products = await fetchProducts();
        return products.find(p => 
            p.name.toLowerCase() === name.toLowerCase()
        ) || null;
    } catch (error) {
        console.error('Error fetching product by name:', error);
        return null;
    }
}

// Users API
async function fetchUsers() {
    try {
        const response = await fetchAPI('/users');
        return response.users || response || [];
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

async function fetchUser(id) {
    try {
        const response = await fetchAPI(`/users/${id}`);
        return response.user || response || null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// Orders API
async function fetchOrders(userId = null) {
    try {
        let endpoint = '/orders';
        if (userId) {
            endpoint = `/orders/user/${userId}`;
        }
        
        const response = await fetchAPI(endpoint);
        return response.orders || [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

async function fetchOrder(id) {
    try {
        const response = await fetchAPI(`/orders/${id}`);
        return response.order || null;
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
}

async function createOrder(orderData) {
    try {
        const response = await fetchAPI('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        return response.order || response;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

// Reservations API (using Tables API)
async function fetchReservations(userId = null) {
    try {
        const response = await fetchAPI('/tables');
        const tables = response.tables || [];
        
        // Extract all reservations from all tables
        let reservations = [];
        tables.forEach(table => {
            if (table.reservations && table.reservations.length > 0) {
                table.reservations.forEach(reservation => {
                    reservations.push({
                        ...reservation,
                        tableNumber: table.number,
                        tableId: table._id
                    });
                });
            }
        });
        
        if (userId) {
            reservations = reservations.filter(r => r.user && r.user._id === userId);
        }
        
        return reservations;
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return [];
    }
}

async function createReservation(tableId, reservationData) {
    try {
        const response = await fetchAPI(`/tables/${tableId}/reservations`, {
            method: 'POST',
            body: JSON.stringify(reservationData)
        });
        return response;
    } catch (error) {
        console.error('Error creating reservation:', error);
        throw error;
    }
}

// Tables API
async function fetchTables() {
    try {
        const response = await fetchAPI('/tables');
        return response.tables || [];
    } catch (error) {
        console.error('Error fetching tables:', error);
        return [];
    }
}

async function fetchTable(id) {
    try {
        const response = await fetchAPI(`/tables/${id}`);
        return response.table || null;
    } catch (error) {
        console.error('Error fetching table:', error);
        return null;
    }
}

// Promotions API
async function fetchPromotions() {
    try {
        const response = await fetchAPI('/promotions/active');
        console.log('📦 Fetched promotions:', response);
        return response.promotions || [];
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return [];
    }
}

async function fetchPromotion(id) {
    try {
        const response = await fetchAPI(`/promotions/${id}`);
        return response.promotion || null;
    } catch (error) {
        console.error('Error fetching promotion:', error);
        return null;
    }
}

async function validatePromotionCode(code, orderValue, productIds) {
    try {
        const response = await fetchAPI('/promotions/validate', {
            method: 'POST',
            body: JSON.stringify({ code, orderValue, productIds })
        });
        return response;
    } catch (error) {
        console.error('Error validating promotion code:', error);
        throw error;
    }
}

// Stats API
async function fetchStats() {
    try {
        const response = await fetchAPI('/stats');
        return response.stats || response || {};
    } catch (error) {
        console.error('Error fetching stats:', error);
        return {};
    }
}

// Note: Utility functions (formatPrice, formatDate, showNotification, etc.)
// are now centralized in utils.js to avoid code duplication
// Keep these here only as fallbacks if utils.js is not loaded

if (typeof formatPrice === 'undefined') {
    function formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }
}

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

if (typeof showNotification === 'undefined') {
    function showNotification(message, type = 'info') {
        // Fallback notification
        alert(message);
    }
}
