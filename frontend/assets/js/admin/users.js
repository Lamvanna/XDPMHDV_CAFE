/**
 * Users Management - Admin
 * Quản lý khách hàng và lịch sử mua hàng
 */

let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const usersPerPage = 10;

// Check permission
const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

if (!user || !user.role || user.role === 'customer') {
    window.location.href = '../login.html';
} else if (user.role === 'staff') {
    // Staff không được truy cập trang quản lý khách hàng
    window.location.href = 'admin-stats.html';
} else if (user.role !== 'admin') {
    window.location.href = '../login.html';
}

if (!getAuthToken()) {
    alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    window.location.href = '../login.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../login.html';
    }
}

/**
 * Load all users (customers only)
 */
async function loadUsers() {
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Handle 403 Forbidden - no permission
        if (response.status === 403) {
            console.log('⚠️ Access denied (403) - insufficient permissions');
            alert('Bạn không có quyền truy cập chức năng này!');
            window.location.href = 'admin-orders.html'; // Redirect staff to orders
            return;
        }

        // Handle 401 Unauthorized - token expired
        if (response.status === 401) {
            console.log('⚠️ Token expired (401)');
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            showNotification('Phiên đăng nhập đã hết hạn', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }

        const data = await response.json();
        if (data.success) {
            // Show all users (admin can see all)
            allUsers = data.data || [];
            // Sắp xếp khách hàng mới nhất lên đầu
            allUsers.sort((a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id));
            filteredUsers = [...allUsers];
            updateStats();
            displayUsers();
        } else {
            showNotification(data.message || 'Lỗi tải danh sách', 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Lỗi tải danh sách khách hàng', 'error');
    }
}

/**
 * Update statistics
 */
function updateStats() {
    const total = allUsers.length;
    const active = allUsers.filter(u => !u.isBlocked).length;
    const withOrders = allUsers.filter(u => u.orderCount > 0).length;
    const vip = allUsers.filter(u => u.totalSpent >= 5000000).length; // VIP if spent >= 5M

    document.getElementById('totalCustomers').textContent = total;
    document.getElementById('activeCustomers').textContent = active;
    document.getElementById('customersWithOrders').textContent = withOrders;
    document.getElementById('vipCustomers').textContent = vip;
}

/**
 * Display users in table with pagination
 */
function displayUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">Chưa có khách hàng nào</td></tr>';
        updatePaginationInfo(0, 0, 0);
        return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = Math.min(startIndex + usersPerPage, filteredUsers.length);
    const usersToDisplay = filteredUsers.slice(startIndex, endIndex);

    tbody.innerHTML = usersToDisplay.map(u => {
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || u.username || u.email.split('@')[0];
        const orderCount = u.orderCount || 0;
        const totalSpent = u.totalSpent || 0;
        const isVIP = totalSpent >= 5000000;
        
        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                            ${fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <p class="font-semibold text-gray-800">${fullName}</p>
                                ${isVIP ? '<span class="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium"><i class="fas fa-crown mr-1"></i>VIP</span>' : ''}
                            </div>
                            <p class="text-sm text-gray-500">@${u.username || u.email.split('@')[0]}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-600"><i class="fas fa-envelope mr-2"></i>${u.email}</p>
                    <p class="text-sm text-gray-600"><i class="fas fa-phone mr-2"></i>${u.phone || '<span class="text-gray-400">Chưa có</span>'}</p>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${orderCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
                        ${orderCount} đơn
                    </span>
                </td>
                <td class="px-6 py-4">
                    <p class="font-semibold text-gray-800">${formatCurrency(totalSpent)}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm text-gray-600">${new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="viewUserDetail('${u._id}')" 
                            class="text-blue-600 hover:text-blue-800 mr-3 transition-colors"
                            title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="toggleBlockUser('${u._id}', ${u.isBlocked || false})" 
                            class="${u.isBlocked ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'} transition-colors"
                            title="${u.isBlocked ? 'Mở khóa' : 'Khóa tài khoản'}">
                        <i class="fas fa-${u.isBlocked ? 'unlock' : 'ban'}"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    updatePaginationInfo(startIndex + 1, endIndex, filteredUsers.length);
    renderPaginationControls(totalPages);
}

/**
 * Update pagination info
 */
function updatePaginationInfo(from, to, total) {
    document.getElementById('showingFrom').textContent = from;
    document.getElementById('showingTo').textContent = to;
    document.getElementById('totalUsers').textContent = total;
}

/**
 * Render pagination controls
 */
function renderPaginationControls(totalPages) {
    const container = document.getElementById('paginationControls');
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `
        <button onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''} 
                class="px-3 py-1 border rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<button onclick="changePage(1)" class="px-3 py-1 border rounded bg-white hover:bg-gray-50">1</button>`;
        if (startPage > 2) {
            html += `<span class="px-2 py-1">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button onclick="changePage(${i})" 
                    class="px-3 py-1 border rounded ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="px-2 py-1">...</span>`;
        }
        html += `<button onclick="changePage(${totalPages})" class="px-3 py-1 border rounded bg-white hover:bg-gray-50">${totalPages}</button>`;
    }

    // Next button
    html += `
        <button onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = html;
}

/**
 * Change page
 */
function changePage(page) {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayUsers();
}

/**
 * Apply filters
 */
function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const status = document.getElementById('statusFilter').value;
    const orderFilter = document.getElementById('orderFilter').value;

    filteredUsers = allUsers.filter(u => {
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').toLowerCase();
        const email = u.email.toLowerCase();
        const phone = (u.phone || '').toLowerCase();

        const matchSearch = !search || 
                           fullName.includes(search) || 
                           email.includes(search) || 
                           phone.includes(search);
        
        const matchStatus = !status || 
                           (status === 'active' && !u.isBlocked) || 
                           (status === 'inactive' && u.isBlocked);
        
        const matchOrder = !orderFilter || 
                          (orderFilter === 'hasOrders' && (u.orderCount || 0) > 0) || 
                          (orderFilter === 'noOrders' && (u.orderCount || 0) === 0);

        return matchSearch && matchStatus && matchOrder;
    });

    currentPage = 1;
    displayUsers();
}

/**
 * View user detail with order history
 */
async function viewUserDetail(userId) {
    const user = allUsers.find(u => u._id === userId);
    if (!user) return;

    try {
        const token = getAuthToken();
        
        // Load user's orders
        const ordersResponse = await fetch(`${API_BASE_URL}/orders?userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const ordersData = await ordersResponse.json();
        const orders = ordersData.success ? (ordersData.data || ordersData.orders || []) : [];
        
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.username;
        const totalSpent = user.totalSpent || 0;
        const isVIP = totalSpent >= 5000000;
        
        const detailHTML = `
            <div class="space-y-6">
                <!-- User Info -->
                <div class="grid grid-cols-2 gap-6">
                    <div class="col-span-2">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                                ${fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <h4 class="text-2xl font-bold text-gray-800">${fullName}</h4>
                                    ${isVIP ? '<span class="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium"><i class="fas fa-crown mr-1"></i>VIP</span>' : ''}
                                    ${user.isBlocked ? '<span class="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium"><i class="fas fa-ban mr-1"></i>Đã khóa</span>' : ''}
                                </div>
                                <p class="text-gray-500">@${user.username || user.email.split('@')[0]}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p class="text-sm text-gray-500 mb-1">Email</p>
                        <p class="font-medium"><i class="fas fa-envelope mr-2 text-gray-400"></i>${user.email}</p>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p class="text-sm text-gray-500 mb-1">Số điện thoại</p>
                        <p class="font-medium"><i class="fas fa-phone mr-2 text-gray-400"></i>${user.phone || '<span class="text-gray-400">Chưa có</span>'}</p>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p class="text-sm text-gray-500 mb-1">Địa chỉ</p>
                        <p class="font-medium"><i class="fas fa-map-marker-alt mr-2 text-gray-400"></i>${user.address || '<span class="text-gray-400">Chưa có</span>'}</p>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p class="text-sm text-gray-500 mb-1">Ngày tham gia</p>
                        <p class="font-medium"><i class="fas fa-calendar mr-2 text-gray-400"></i>${new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                </div>
                
                <!-- Stats -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-blue-600">${orders.length}</p>
                        <p class="text-sm text-gray-600 mt-1">Đơn hàng</p>
                    </div>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-green-600">${formatCurrency(totalSpent)}</p>
                        <p class="text-sm text-gray-600 mt-1">Tổng chi tiêu</p>
                    </div>
                    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                        <p class="text-3xl font-bold text-amber-600">${orders.length > 0 ? formatCurrency(totalSpent / orders.length) : '0đ'}</p>
                        <p class="text-sm text-gray-600 mt-1">Giá trị TB/đơn</p>
                    </div>
                </div>
                
                <!-- Order History -->
                <div>
                    <h5 class="font-bold text-lg text-gray-800 mb-3">Lịch sử đơn hàng (${orders.length})</h5>
                    ${orders.length > 0 ? `
                        <div class="space-y-2 max-h-96 overflow-y-auto">
                            ${orders.slice(0, 10).map(order => `
                                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <span class="font-semibold text-gray-800">#${order.orderCode || order._id.slice(-6).toUpperCase()}</span>
                                            <span class="px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusConfig(order.status).bgClass} ${getOrderStatusConfig(order.status).textClass}">
                                                ${getOrderStatusConfig(order.status).label}
                                            </span>
                                        </div>
                                        <p class="font-bold text-gray-800">${formatCurrency(order.total || order.totalAmount || 0)}</p>
                                    </div>
                                    <p class="text-sm text-gray-600">
                                        <i class="fas fa-calendar mr-1"></i>${new Date(order.createdAt).toLocaleDateString('vi-VN')} ${new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                                    </p>
                                    <p class="text-sm text-gray-600 mt-1">
                                        <i class="fas fa-shopping-bag mr-1"></i>${order.items?.length || 0} sản phẩm
                                        ${order.orderType ? ` • <i class="fas fa-${order.orderType === 'delivery' ? 'truck' : order.orderType === 'dine-in' ? 'utensils' : 'shopping-bag'} mr-1"></i>${order.orderType === 'delivery' ? 'Giao hàng' : order.orderType === 'dine-in' ? 'Tại chỗ' : 'Mang về'}` : ''}
                                    </p>
                                </div>
                            `).join('')}
                            ${orders.length > 10 ? `<p class="text-center text-sm text-gray-500 py-2">Và ${orders.length - 10} đơn hàng khác...</p>` : ''}
                        </div>
                    ` : '<p class="text-center text-gray-400 py-8">Chưa có đơn hàng nào</p>'}
                </div>
            </div>
        `;
        
        document.getElementById('userDetailTitle').textContent = `Chi tiết khách hàng: ${fullName}`;
        document.getElementById('userDetailContent').innerHTML = detailHTML;
        document.getElementById('userDetailModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading user detail:', error);
        showNotification('Lỗi tải thông tin chi tiết', 'error');
    }
}

/**
 * Close user detail modal
 */
function closeUserDetailModal() {
    document.getElementById('userDetailModal').classList.add('hidden');
}

/**
 * Toggle block/unblock user
 */
async function toggleBlockUser(userId, isCurrentlyBlocked) {
    const action = isCurrentlyBlocked ? 'mở khóa' : 'khóa';
    if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isBlocked: !isCurrentlyBlocked })
        });

        const data = await response.json();
        if (data.success) {
            showNotification(`Đã ${action} tài khoản thành công`, 'success');
            loadUsers();
        } else {
            showNotification(data.message || `Lỗi ${action} tài khoản`, 'error');
        }
    } catch (error) {
        console.error('Error toggling user block:', error);
        showNotification(`Lỗi ${action} tài khoản`, 'error');
    }
}

/**
 * Get order status configuration
 */
function getOrderStatusConfig(status) {
    const configs = {
        pending: { label: 'Chờ xác nhận', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
        confirmed: { label: 'Đã xác nhận', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
        preparing: { label: 'Đang chuẩn bị', bgClass: 'bg-purple-100', textClass: 'text-purple-800' },
        ready: { label: 'Sẵn sàng', bgClass: 'bg-cyan-100', textClass: 'text-cyan-800' },
        completed: { label: 'Hoàn thành', bgClass: 'bg-green-100', textClass: 'text-green-800' },
        cancelled: { label: 'Đã hủy', bgClass: 'bg-red-100', textClass: 'text-red-800' }
    };
    return configs[status] || configs.pending;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }

    // Order filter
    const orderFilter = document.getElementById('orderFilter');
    if (orderFilter) {
        orderFilter.addEventListener('change', applyFilters);
    }
}
