/**
 * Order Admin Management System
 * Hệ thống quản lý đơn hàng đầy đủ
 */

// Global state
let allOrders = [];
let filteredOrders = [];
let currentOrder = null;

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    checkAdminPermission();
    await loadOrders();
    setupEventListeners();
});

/**
 * Check admin/staff permission
 */
function checkAdminPermission() {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        showNotification('Bạn không có quyền truy cập trang này', 'error');
        setTimeout(() => {
            window.location.href = '../login.html';
        }, 2000);
    }
}

/**
 * Load orders from API
 */
async function loadOrders() {
    try {
        showLoadingOrders();
        
        // Get token from localStorage (try both possible names)
        const token = localStorage.getItem('token') || 
                      localStorage.getItem('authToken') || 
                      sessionStorage.getItem('authToken');
        
        if (!token) {
            showErrorOrders('Vui lòng đăng nhập để xem đơn hàng');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 2000);
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showErrorOrders('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 2000);
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        allOrders = data.data || data.orders || [];
        filteredOrders = [...allOrders];
        
        renderOrders();
        updateStats();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showErrorOrders('Không thể tải danh sách đơn hàng. Vui lòng kiểm tra kết nối.');
    }
}

/**
 * Render orders to table
 */
function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    
    if (!tbody) {
        console.error('Orders table body not found');
        return;
    }
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-400">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p>Không có đơn hàng nào</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredOrders.map(order => createOrderRow(order)).join('');
}

/**
 * Create order row HTML
 */
function createOrderRow(order) {
    const statusConfig = getStatusConfig(order.status);
    const paymentConfig = getPaymentConfig(order.paymentStatus);
    const orderId = order._id || order.id;
    const orderCode = order.orderCode || `#${orderId.slice(-6).toUpperCase()}`;
    const customerName = order.user?.name || order.user?.username || order.user?.email?.split('@')[0] || 'Khách hàng';
    const totalItems = order.items?.length || 0;
    const totalAmount = order.total || order.totalAmount || 0;
    const orderDate = new Date(order.createdAt || Date.now()).toLocaleString('vi-VN');
    
    return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div class="font-medium text-gray-900">${orderCode}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900">${customerName}</div>
                ${order.user?.email ? `<div class="text-xs text-gray-500">${order.user.email}</div>` : ''}
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-600">${totalItems} sản phẩm</div>
            </td>
            <td class="px-6 py-4">
                <div class="font-semibold text-gray-900">${formatPrice(totalAmount)}</div>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 text-xs font-semibold rounded-full ${statusConfig.bgClass} ${statusConfig.textClass}">
                    <i class="${statusConfig.icon} mr-1"></i>${statusConfig.label}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 text-xs font-semibold rounded-full ${paymentConfig.bgClass} ${paymentConfig.textClass}">
                    <i class="${paymentConfig.icon} mr-1"></i>${paymentConfig.label}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
                ${orderDate}
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="viewOrderDetail('${orderId}')" 
                        class="text-blue-600 hover:text-blue-800 mr-2" 
                        title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                </button>
                ${order.status === 'pending' ? `
                    <button onclick="updateOrderStatus('${orderId}', 'confirmed')" 
                            class="text-green-600 hover:text-green-800 mr-2" 
                            title="Xác nhận">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                ${order.status === 'confirmed' ? `
                    <button onclick="updateOrderStatus('${orderId}', 'preparing')" 
                            class="text-blue-600 hover:text-blue-800 mr-2" 
                            title="Chuẩn bị">
                        <i class="fas fa-spinner"></i>
                    </button>
                ` : ''}
                ${order.status === 'preparing' ? `
                    <button onclick="updateOrderStatus('${orderId}', 'ready')" 
                            class="text-purple-600 hover:text-purple-800 mr-2" 
                            title="Sẵn sàng">
                        <i class="fas fa-bell"></i>
                    </button>
                ` : ''}
                ${order.status === 'ready' ? `
                    <button onclick="updateOrderStatus('${orderId}', 'completed')" 
                            class="text-green-600 hover:text-green-800 mr-2" 
                            title="Hoàn thành">
                        <i class="fas fa-check-double"></i>
                    </button>
                ` : ''}
                ${order.status !== 'cancelled' && order.status !== 'completed' ? `
                    <button onclick="cancelOrder('${orderId}')" 
                            class="text-red-600 hover:text-red-800" 
                            title="Hủy đơn">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `;
}

/**
 * Get status configuration
 */
function getStatusConfig(status) {
    const configs = {
        pending: {
            label: 'Chờ xác nhận',
            icon: 'fas fa-clock',
            bgClass: 'bg-yellow-100',
            textClass: 'text-yellow-800'
        },
        confirmed: {
            label: 'Đã xác nhận',
            icon: 'fas fa-check',
            bgClass: 'bg-blue-100',
            textClass: 'text-blue-800'
        },
        preparing: {
            label: 'Đang chuẩn bị',
            icon: 'fas fa-spinner',
            bgClass: 'bg-indigo-100',
            textClass: 'text-indigo-800'
        },
        ready: {
            label: 'Sẵn sàng',
            icon: 'fas fa-bell',
            bgClass: 'bg-purple-100',
            textClass: 'text-purple-800'
        },
        completed: {
            label: 'Hoàn thành',
            icon: 'fas fa-check-circle',
            bgClass: 'bg-green-100',
            textClass: 'text-green-800'
        },
        cancelled: {
            label: 'Đã hủy',
            icon: 'fas fa-times-circle',
            bgClass: 'bg-red-100',
            textClass: 'text-red-800'
        }
    };
    
    return configs[status] || configs.pending;
}

/**
 * Get payment status configuration
 */
function getPaymentConfig(paymentStatus) {
    const configs = {
        paid: {
            label: 'Đã thanh toán',
            icon: 'fas fa-check',
            bgClass: 'bg-green-100',
            textClass: 'text-green-800'
        },
        pending: {
            label: 'Chưa thanh toán',
            icon: 'fas fa-clock',
            bgClass: 'bg-gray-100',
            textClass: 'text-gray-800'
        }
    };
    
    return configs[paymentStatus] || configs.pending;
}

/**
 * Update order statistics
 */
function updateStats() {
    const stats = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        completed: 0,
        cancelled: 0
    };
    
    allOrders.forEach(order => {
        if (stats.hasOwnProperty(order.status)) {
            stats[order.status]++;
        }
    });
    
    // Pending count
    document.getElementById('pendingCount').textContent = stats.pending;
    // Processing count = confirmed + preparing
    document.getElementById('processingCount').textContent = stats.confirmed + stats.preparing + stats.ready;
    // Completed count
    document.getElementById('completedCount').textContent = stats.completed;
    // Cancelled count
    document.getElementById('cancelledCount').textContent = stats.cancelled;
}

/**
 * View order detail
 */
async function viewOrderDetail(orderId) {
    try {
        const order = allOrders.find(o => (o._id || o.id) === orderId);
        
        if (!order) {
            // Fetch from API if not in cache
            const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Order not found');
            
            const data = await response.json();
            currentOrder = data.data || data.order;
        } else {
            currentOrder = order;
        }
        
        renderOrderDetail(currentOrder);
        openModal();
        
    } catch (error) {
        console.error('Error viewing order:', error);
        showNotification('Không thể xem chi tiết đơn hàng', 'error');
    }
}

/**
 * Render order detail in modal
 */
function renderOrderDetail(order) {
    const detailContainer = document.getElementById('orderDetail');
    if (!detailContainer) return;
    
    const statusConfig = getStatusConfig(order.status);
    const paymentConfig = getPaymentConfig(order.paymentStatus);
    const orderCode = order.orderCode || `#${(order._id || order.id).slice(-6).toUpperCase()}`;
    const orderDate = new Date(order.createdAt || Date.now()).toLocaleString('vi-VN');
    
    detailContainer.innerHTML = `
        <!-- Order Header -->
        <div class="border-b pb-4 mb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="text-xl font-bold text-gray-800">Đơn hàng ${orderCode}</h4>
                    <p class="text-sm text-gray-500 mt-1">${orderDate}</p>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${statusConfig.bgClass} ${statusConfig.textClass}">
                        <i class="${statusConfig.icon} mr-1"></i>${statusConfig.label}
                    </span>
                    <div class="mt-2">
                        <span class="px-3 py-1 text-xs font-semibold rounded-full ${paymentConfig.bgClass} ${paymentConfig.textClass}">
                            <i class="${paymentConfig.icon} mr-1"></i>${paymentConfig.label}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Customer Info -->
        <div class="mb-4">
            <h5 class="font-semibold text-gray-700 mb-2">Thông tin khách hàng</h5>
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <p class="text-sm text-gray-500">Tên khách hàng</p>
                        <p class="font-medium">${order.user?.name || order.user?.username || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Email</p>
                        <p class="font-medium">${order.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Số điện thoại</p>
                        <p class="font-medium">${order.user?.phone || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Loại đơn hàng</p>
                        <p class="font-medium">
                            ${order.orderType === 'dine-in' ? '<i class="fas fa-utensils mr-1"></i>Tại chỗ' : 
                              order.orderType === 'takeaway' ? '<i class="fas fa-shopping-bag mr-1"></i>Mang về' :
                              '<i class="fas fa-motorcycle mr-1"></i>Giao hàng'}
                        </p>
                    </div>
                    ${order.table ? `
                        <div>
                            <p class="text-sm text-gray-500">Bàn số</p>
                            <p class="font-medium"><i class="fas fa-chair mr-1"></i>${order.table.number || order.table.name || 'N/A'}</p>
                        </div>
                    ` : ''}
                    ${order.deliveryAddress || (order.orderType === 'delivery' && order.user?.address) ? `
                        <div class="col-span-2">
                            <p class="text-sm text-gray-500">Địa chỉ giao hàng</p>
                            <p class="font-medium">
                                <i class="fas fa-map-marker-alt mr-1"></i>
                                ${order.deliveryAddress || order.user?.address || 'Chưa cập nhật'}
                            </p>
                        </div>
                    ` : ''}
                    ${order.customerName || order.customerPhone ? `
                        <div class="col-span-2">
                            <p class="text-sm text-gray-500">Thông tin khách hàng</p>
                            <p class="font-medium">
                                ${order.customerName ? `<i class="fas fa-user mr-1"></i>${order.customerName}` : ''}
                                ${order.customerPhone ? `<span class="ml-3"><i class="fas fa-phone mr-1"></i>${order.customerPhone}</span>` : ''}
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <!-- Order Items -->
        <div class="mb-4">
            <h5 class="font-semibold text-gray-700 mb-2">Sản phẩm đã đặt</h5>
            <div class="space-y-3">
                ${(order.items || []).map(item => {
                    const productImage = item.product?.image || item.image;
                    const imageUrl = productImage && productImage.startsWith('data:image') 
                        ? productImage 
                        : productImage && productImage.startsWith('http') 
                        ? productImage 
                        : 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80';
                    
                    return `
                        <div class="flex items-center gap-4 bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-amber-300 transition-colors">
                            <img src="${imageUrl}" 
                                 alt="${item.product?.name || item.name || 'Product'}" 
                                 class="w-20 h-20 object-cover rounded-lg shadow-sm"
                                 onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80'">
                            <div class="flex-1">
                                <h6 class="font-medium text-gray-800">${item.product?.name || item.name || 'N/A'}</h6>
                                <p class="text-sm text-gray-500 mt-1">
                                    ${item.product?.description || item.description || ''}
                                </p>
                            </div>
                            <div class="text-center px-3">
                                <p class="text-xs text-gray-500">Số lượng</p>
                                <p class="text-lg font-semibold text-gray-800">${item.quantity}</p>
                            </div>
                            <div class="text-right min-w-[100px]">
                                <p class="text-xs text-gray-500">Đơn giá</p>
                                <p class="text-sm font-medium text-gray-700">${formatPrice(item.price)}</p>
                                <p class="text-xs text-gray-400 mt-1">Thành tiền</p>
                                <p class="text-base font-bold text-amber-600">${formatPrice(item.price * item.quantity)}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <!-- Order Summary -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <div class="space-y-2">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Tạm tính</span>
                    <span class="font-medium">${formatPrice((order.total || 0) - (order.shippingFee || 0))}</span>
                </div>
                ${order.discount ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Giảm giá</span>
                        <span class="text-red-600 font-medium">-${formatPrice(order.discount)}</span>
                    </div>
                ` : ''}
                ${order.shippingFee ? `
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Phí vận chuyển</span>
                        <span class="font-medium">${formatPrice(order.shippingFee)}</span>
                    </div>
                ` : ''}
                <div class="border-t pt-2 flex justify-between">
                    <span class="font-semibold text-gray-800">Tổng cộng</span>
                    <span class="font-bold text-xl text-amber-600">${formatPrice(order.total || 0)}</span>
                </div>
            </div>
        </div>
        
        <!-- Notes -->
        ${order.notes ? `
            <div class="mb-4">
                <h5 class="font-semibold text-gray-700 mb-2">Ghi chú</h5>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p class="text-sm text-gray-700">${order.notes}</p>
                </div>
            </div>
        ` : ''}
        
        <!-- Actions -->
        <div class="flex gap-2 pt-4 border-t">
            ${order.status === 'pending' ? `
                <button onclick="updateOrderStatus('${order._id || order.id}', 'confirmed')" 
                        class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                    <i class="fas fa-check mr-2"></i>Xác nhận đơn
                </button>
            ` : ''}
            ${order.status === 'confirmed' ? `
                <button onclick="updateOrderStatus('${order._id || order.id}', 'preparing')" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                    <i class="fas fa-spinner mr-2"></i>Bắt đầu chuẩn bị
                </button>
            ` : ''}
            ${order.status === 'preparing' ? `
                <button onclick="updateOrderStatus('${order._id || order.id}', 'ready')" 
                        class="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium">
                    <i class="fas fa-bell mr-2"></i>Sẵn sàng phục vụ
                </button>
            ` : ''}
            ${order.status === 'ready' ? `
                <button onclick="updateOrderStatus('${order._id || order.id}', 'completed')" 
                        class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                    <i class="fas fa-check-double mr-2"></i>Hoàn thành
                </button>
            ` : ''}
            ${order.status !== 'cancelled' && order.status !== 'completed' ? `
                <button onclick="cancelOrder('${order._id || order.id}')" 
                        class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium">
                    <i class="fas fa-times mr-2"></i>Hủy đơn
                </button>
            ` : ''}
            <button onclick="printOrder('${order._id || order.id}')" 
                    class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium">
                <i class="fas fa-print mr-2"></i>In
            </button>
        </div>
    `;
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, newStatus) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update status');
        
        showNotification('Cập nhật trạng thái thành công', 'success');
        closeModal();
        await loadOrders();
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Không thể cập nhật trạng thái đơn hàng', 'error');
    }
}

/**
 * Cancel order
 */
async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'cancelled' })
        });
        
        if (!response.ok) throw new Error('Failed to cancel order');
        
        showNotification('Đã hủy đơn hàng', 'success');
        closeModal();
        await loadOrders();
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification('Không thể hủy đơn hàng', 'error');
    }
}

/**
 * Print order
 */
function printOrder(orderId) {
    showNotification('Chức năng in đơn hàng đang được phát triển', 'info');
}

/**
 * Apply filters
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchOrder')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const paymentFilter = document.getElementById('paymentFilter')?.value || '';
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    
    filteredOrders = allOrders.filter(order => {
        const orderCode = (order.orderCode || `#${(order._id || order.id).slice(-6)}`).toLowerCase();
        const customerName = (order.user?.name || order.customerName || '').toLowerCase();
        
        // Search filter
        if (searchTerm && !orderCode.includes(searchTerm) && !customerName.includes(searchTerm)) {
            return false;
        }
        
        // Status filter
        if (statusFilter && order.status !== statusFilter) {
            return false;
        }
        
        // Payment filter
        if (paymentFilter && order.paymentStatus !== paymentFilter) {
            return false;
        }
        
        // Date filter
        if (dateFrom) {
            const orderDate = new Date(order.createdAt);
            const filterDate = new Date(dateFrom);
            if (orderDate < filterDate) {
                return false;
            }
        }
        
        return true;
    });
    
    renderOrders();
    showNotification(`Tìm thấy ${filteredOrders.length} đơn hàng`, 'info');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search on Enter key
    const searchInput = document.getElementById('searchOrder');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
}

/**
 * Modal functions
 */
function openModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentOrder = null;
}

/**
 * Loading and error states
 */
function showLoadingOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-400">
                    <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                    <p>Đang tải đơn hàng...</p>
                </td>
            </tr>
        `;
    }
}

function showErrorOrders(message) {
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-red-400">
                    <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                    <p>${message}</p>
                    <button onclick="loadOrders()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-redo mr-2"></i>Thử lại
                    </button>
                </td>
            </tr>
        `;
    }
}

/**
 * Logout
 */
function handleLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Clear all auth data from both storages
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        window.location.href = '../login.html';
    }
}
