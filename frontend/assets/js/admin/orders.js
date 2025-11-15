const API_URL = 'http://localhost:3000/api';
let allOrders = [];

const user = JSON.parse(localStorage.getItem('user') || '{}');
if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    window.location.href = '../login.html';
}

function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.clear();
        window.location.href = '../login.html';
    }
}

async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            allOrders = data.data;
            updateStats();
            displayOrders(allOrders);
        }
    } catch (error) {
        showNotification('Lỗi tải đơn hàng', 'error');
    }
}

function updateStats() {
    document.getElementById('pendingCount').textContent = allOrders.filter(o => o.status === 'pending').length;
    document.getElementById('processingCount').textContent = allOrders.filter(o => o.status === 'processing').length;
    document.getElementById('completedCount').textContent = allOrders.filter(o => o.status === 'completed').length;
    document.getElementById('cancelledCount').textContent = allOrders.filter(o => o.status === 'cancelled').length;
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-400">Không có đơn hàng</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        const statusText = {
            pending: 'Chờ xử lý',
            processing: 'Đang xử lý',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy'
        };
        const paymentColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800'
        };
        const paymentText = {
            pending: 'Chờ thanh toán',
            paid: 'Đã thanh toán',
            failed: 'Thất bại'
        };
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 font-mono text-sm">#${order._id.slice(-6)}</td>
                <td class="px-6 py-4">
                    <p class="font-semibold">${order.userId?.fullName || 'Khách'}</p>
                    <p class="text-sm text-gray-500">${order.userId?.email || ''}</p>
                </td>
                <td class="px-6 py-4">${order.items?.length || 0} món</td>
                <td class="px-6 py-4 font-semibold text-amber-600">${formatCurrency(order.totalAmount)}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-sm ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}">
                        ${statusText[order.status] || order.status}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-sm ${paymentColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'}">
                        ${paymentText[order.paymentStatus] || order.paymentStatus}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="viewOrder('${order._id}')" class="text-blue-600 hover:text-blue-800 mr-3" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function viewOrder(id) {
    const order = allOrders.find(o => o._id === id);
    if (!order) return;
    
    document.getElementById('detailOrderId').textContent = `#${order._id.slice(-6)}`;
    document.getElementById('detailCustomer').textContent = order.userId?.fullName || 'Khách';
    document.getElementById('detailEmail').textContent = order.userId?.email || 'N/A';
    document.getElementById('detailPhone').textContent = order.userId?.phone || 'N/A';
    document.getElementById('detailDate').textContent = new Date(order.createdAt).toLocaleString('vi-VN');
    document.getElementById('detailStatus').value = order.status;
    document.getElementById('currentOrderId').value = order._id;
    
    const itemsList = document.getElementById('detailItems');
    itemsList.innerHTML = order.items.map(item => `
        <div class="flex justify-between py-2 border-b">
            <div>
                <p class="font-medium">${item.productId?.name || 'Sản phẩm'}</p>
                <p class="text-sm text-gray-500">Số lượng: ${item.quantity}</p>
            </div>
            <p class="font-semibold">${formatCurrency(item.price * item.quantity)}</p>
        </div>
    `).join('');
    
    document.getElementById('detailSubtotal').textContent = formatCurrency(order.totalAmount / 1.1);
    document.getElementById('detailTax').textContent = formatCurrency(order.totalAmount * 0.1 / 1.1);
    document.getElementById('detailTotal').textContent = formatCurrency(order.totalAmount);
    
    document.getElementById('orderDetailModal').classList.remove('hidden');
}

function closeOrderModal() {
    document.getElementById('orderDetailModal').classList.add('hidden');
}

async function updateOrderStatus() {
    const orderId = document.getElementById('currentOrderId').value;
    const newStatus = document.getElementById('detailStatus').value;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Đã cập nhật trạng thái đơn hàng', 'success');
            closeOrderModal();
            loadOrders();
        } else {
            showNotification(data.message || 'Lỗi cập nhật', 'error');
        }
    } catch (error) {
        showNotification('Lỗi cập nhật trạng thái', 'error');
    }
}

function applyFilters() {
    const searchId = document.getElementById('searchOrderId').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const payment = document.getElementById('paymentFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    const filtered = allOrders.filter(order => {
        const matchId = !searchId || order._id.toLowerCase().includes(searchId);
        const matchStatus = !status || order.status === status;
        const matchPayment = !payment || order.paymentStatus === payment;
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        const matchDateFrom = !dateFrom || orderDate >= dateFrom;
        const matchDateTo = !dateTo || orderDate <= dateTo;
        
        return matchId && matchStatus && matchPayment && matchDateFrom && matchDateTo;
    });
    
    displayOrders(filtered);
}

document.getElementById('searchOrderId').addEventListener('input', applyFilters);

document.addEventListener('DOMContentLoaded', loadOrders);
