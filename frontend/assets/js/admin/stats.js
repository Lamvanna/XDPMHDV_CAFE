// Dashboard Statistics
const API_URL = 'http://localhost:3000/api';
let revenueChart = null;
let ordersChart = null;

// Check permission - Allow both admin and staff
const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
if (!user || !user.role) {
    console.error('❌ No user data found');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '../login.html';
} else if (user.role !== 'admin' && user.role !== 'staff') {
    console.error('❌ Invalid role:', user.role);
    window.location.href = '../login.html';
}

// Verify token on page load
async function verifyToken() {
    const token = getAuthToken();
    if (!token) {
        console.error('❌ No token found');
        window.location.href = '../login.html';
        return false;
    }
    
    try {
        // Quick test with a simple endpoint
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            console.error('❌ Token is invalid or expired!');
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../login.html';
            return false;
        }
        
        console.log('✅ Token is valid');
        return true;
    } catch (error) {
        console.error('❌ Error verifying token:', error);
        return true; // Continue anyway if can't verify
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Verify token first
    const isValid = await verifyToken();
    if (isValid) {
        loadAllData();
    }
});

// Load all data
async function loadAllData() {
    try {
        await Promise.all([
            loadDashboardStats(),
            loadRevenueChart(),
            loadOrdersChart(),
            loadTopProducts(),
            loadRecentOrders()
        ]);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const token = getAuthToken();
        console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'Missing');
        
        if (!token) {
            console.error('❌ No token found! Redirecting to login...');
            window.location.href = '../login.html';
            return;
        }
        
        const response = await fetch(`${API_URL}/stats/dashboard`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Stats Response Status:', response.status);
        
        if (response.status === 401) {
            console.error('❌ Token invalid or expired! Redirecting to login...');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../login.html';
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ API Error:', errorData);
            throw new Error(errorData.error || 'Failed to load stats');
        }
        
        const data = await response.json();
        console.log('📊 Stats Data:', data);
        
        if (data.success) {
            // Update stats cards with null checks
            const todayRevenue = document.getElementById('todayRevenue');
            const todayOrders = document.getElementById('todayOrders');
            const totalOrders = document.getElementById('totalOrders');
            const totalCustomers = document.getElementById('totalCustomers');
            const totalProducts = document.getElementById('totalProducts');
            const newCustomers = document.getElementById('newCustomers');
            const activeProducts = document.getElementById('activeProducts');
            const completedOrders = document.getElementById('completedOrders');
            
            console.log('💰 Today Revenue:', data.today?.revenue);
            console.log('📦 Today Orders:', data.today?.orders);
            
            if (todayRevenue) todayRevenue.textContent = formatMoney(data.today?.revenue || 0);
            if (todayOrders) todayOrders.textContent = data.today?.orders || 0;
            if (totalOrders) totalOrders.textContent = data.total?.orders || 0;
            if (totalCustomers) totalCustomers.textContent = data.total?.customers || 0;
            if (totalProducts) totalProducts.textContent = data.total?.products || 0;
            if (newCustomers) newCustomers.textContent = data.today?.newCustomers || 0;
            if (activeProducts) activeProducts.textContent = data.total?.activeProducts || 0;
            
            // Calculate completed orders
            const completedCount = data.ordersByStatus?.find(s => s._id === 'completed')?.count || 0;
            if (completedOrders) completedOrders.textContent = completedCount;
            
            console.log('✅ Stats updated successfully');
        }
    } catch (error) {
        console.error('❌ Error loading dashboard stats:', error);
    }
}

// Load revenue chart
async function loadRevenueChart() {
    try {
        const token = getAuthToken();
        if (!token) {
            console.error('❌ No token for revenue chart');
            return;
        }
        
        const response = await fetch(`${API_URL}/stats/revenue?days=7`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            console.error('❌ Token expired in revenue chart');
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to load revenue data');
        }
        
        const data = await response.json();
        
        if (data.success && data.sales && Array.isArray(data.sales)) {
            const ctx = document.getElementById('revenueChart');
            if (!ctx) return;
            
            // Destroy existing chart
            if (revenueChart) {
                revenueChart.destroy();
            }
            
            // Create new chart
            revenueChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.sales.map(d => formatDate(d._id)),
                    datasets: [{
                        label: 'Doanh thu (VNĐ)',
                        data: data.sales.map(d => d.totalSales || 0),
                        borderColor: 'rgb(217, 119, 6)',
                        backgroundColor: 'rgba(217, 119, 6, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => formatMoney(context.parsed.y)
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => formatMoneyShort(value)
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading revenue chart:', error);
    }
}

// Load orders chart
async function loadOrdersChart() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/stats/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load orders data');
        }
        
        const data = await response.json();
        
        if (data.success && data.ordersByStatus) {
            const ctx = document.getElementById('ordersChart');
            if (!ctx) return;
            
            // Destroy existing chart
            if (ordersChart) {
                ordersChart.destroy();
            }
            
            // Status mapping
            const statusMap = {
                'pending': { label: 'Chờ xử lý', color: '#FFA500' },
                'preparing': { label: 'Đang chuẩn bị', color: '#3B82F6' },
                'ready': { label: 'Sẵn sàng', color: '#8B5CF6' },
                'completed': { label: 'Hoàn thành', color: '#10B981' },
                'cancelled': { label: 'Đã hủy', color: '#EF4444' }
            };
            
            const labels = [];
            const values = [];
            const colors = [];
            
            data.ordersByStatus.forEach(item => {
                const status = statusMap[item._id] || { label: item._id, color: '#gray' };
                labels.push(status.label);
                values.push(item.count);
                colors.push(status.color);
            });
            
            // Create new chart
            ordersChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 10,
                                font: {
                                    size: 12
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading orders chart:', error);
    }
}

// Load top products
async function loadTopProducts() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/stats/top-products?limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load top products');
        }
        
        const data = await response.json();
        
        const container = document.getElementById('topProducts');
        if (!container) return;
        
        if (data.success && data.products && data.products.length > 0) {
            container.innerHTML = data.products.map((product, index) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div class="flex items-center space-x-3">
                        <span class="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 font-bold text-sm">
                            ${index + 1}
                        </span>
                        <div>
                            <p class="font-semibold text-gray-800">${product.name || 'N/A'}</p>
                            <p class="text-sm text-gray-500">${product.soldCount || 0} đã bán</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-gray-800">${formatMoney(product.totalRevenue || 0)}</p>
                        <p class="text-sm text-gray-500">${formatMoney(product.price || 0)}/sp</p>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-center text-gray-400 py-8">Chưa có dữ liệu</p>';
        }
    } catch (error) {
        console.error('Error loading top products:', error);
        const container = document.getElementById('topProducts');
        if (container) {
            container.innerHTML = '<p class="text-center text-red-400 py-8">Lỗi tải dữ liệu</p>';
        }
    }
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/orders?limit=5&sort=-createdAt`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load recent orders');
        }
        
        const data = await response.json();
        
        const container = document.getElementById('recentOrders');
        if (!container) return;
        
        if (data.success && data.orders && data.orders.length > 0) {
            container.innerHTML = data.orders.map(order => {
                const statusColors = {
                    'pending': 'bg-yellow-100 text-yellow-800',
                    'preparing': 'bg-blue-100 text-blue-800',
                    'ready': 'bg-purple-100 text-purple-800',
                    'completed': 'bg-green-100 text-green-800',
                    'cancelled': 'bg-red-100 text-red-800'
                };
                
                const statusLabels = {
                    'pending': 'Chờ xử lý',
                    'preparing': 'Đang chuẩn bị',
                    'ready': 'Sẵn sàng',
                    'completed': 'Hoàn thành',
                    'cancelled': 'Đã hủy'
                };
                
                return `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                            <p class="font-semibold text-gray-800">#${order.orderNumber || order._id?.slice(-6) || 'N/A'}</p>
                            <p class="text-sm text-gray-500">${formatTimeAgo(order.createdAt)}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold text-gray-800">${formatMoney(order.total || 0)}</p>
                            <span class="text-xs px-2 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}">
                                ${statusLabels[order.status] || order.status}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="text-center text-gray-400 py-8">Chưa có đơn hàng</p>';
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
        const container = document.getElementById('recentOrders');
        if (container) {
            container.innerHTML = '<p class="text-center text-red-400 py-8">Lỗi tải dữ liệu</p>';
        }
    }
}

// Utility functions
function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount || 0);
}

function formatMoneyShort(amount) {
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
        return (amount / 1000).toFixed(0) + 'K';
    }
    return amount.toString();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
}
