/**
 * Inventory Management - Admin
 * Quản lý kho hàng và tồn kho (sử dụng API_BASE_URL và getAuthToken từ api.js và permissions.js)
 */

let allProducts = [];

const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    window.location.href = '../login.html';
}

function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../login.html';
    }
}

async function loadInventory() {
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }
        const response = await fetch(`${API_BASE_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            allProducts = data.data || data.products || [];
            updateStats();
            displayInventory(allProducts);
        } else {
            showNotification(data.message || 'Lỗi tải dữ liệu', 'error');
            allProducts = [];
            updateStats();
            displayInventory(allProducts);
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
        showNotification('Lỗi tải dữ liệu kho', 'error');
        allProducts = [];
        updateStats();
        displayInventory(allProducts);
    }
}

function updateStats() {
    const products = allProducts || [];
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('highStock').textContent = products.filter(p => p.stock > 50).length;
    document.getElementById('lowStock').textContent = products.filter(p => p.stock > 0 && p.stock < 10).length;
    document.getElementById('outOfStock').textContent = products.filter(p => p.stock === 0).length;
}

function displayInventory(products) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">Không có sản phẩm</td></tr>';
        return;
    }
    tbody.innerHTML = products.map(p => {
        let stockStatus = '';
        let stockColor = '';
        if (p.stock === 0) {
            stockStatus = 'Hết hàng';
            stockColor = 'bg-red-100 text-red-800';
        } else if (p.stock < 10) {
            stockStatus = 'Sắp hết';
            stockColor = 'bg-yellow-100 text-yellow-800';
        } else {
            stockStatus = 'Còn hàng';
            stockColor = 'bg-green-100 text-green-800';
        }

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4"><div class="flex items-center"><img src="${p.image || '../assets/images/default-product.jpg'}" class="w-12 h-12 rounded mr-3"><p class="font-semibold">${p.name}</p></div></td>
                <td class="px-6 py-4"><span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">${p.category}</span></td>
                <td class="px-6 py-4"><span class="text-2xl font-bold ${p.stock < 10 ? 'text-red-600' : 'text-gray-800'}">${p.stock}</span></td>
                <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-sm ${stockColor}">${stockStatus}</span></td>
                <td class="px-6 py-4 text-right">
                    <button onclick="openStockModal('${p._id}')" class="text-amber-600 hover:text-amber-800 mr-3" title="Cập nhật tồn kho"><i class="fas fa-edit"></i></button>
                    <a href="admin-products.html" class="text-blue-600 hover:text-blue-800" title="Chỉnh sửa sản phẩm"><i class="fas fa-cog"></i></a>
                </td>
            </tr>
        `;
    }).join('');
}

function openStockModal(id) {
    const product = allProducts.find(p => p._id === id);
    if (!product) return;
    document.getElementById('productId').value = product._id;
    document.getElementById('productName').textContent = product.name;
    document.getElementById('currentStock').value = product.stock;
    document.getElementById('stockChange').value = '';
    document.getElementById('stockNote').value = '';
    document.getElementById('updateStockModal').classList.remove('hidden');
}

function closeStockModal() {
    document.getElementById('updateStockModal').classList.add('hidden');
}

document.getElementById('stockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const currentStock = parseInt(document.getElementById('currentStock').value);
    const change = parseInt(document.getElementById('stockChange').value);
    const newStock = currentStock + change;

    if (newStock < 0) {
        showNotification('Tồn kho không thể âm', 'error');
        return;
    }

    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ stock: newStock })
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Cập nhật tồn kho thành công', 'success');
            closeStockModal();
            loadInventory();
        } else {
            showNotification(data.message || 'Lỗi cập nhật', 'error');
        }
    } catch (error) {
        console.error('Error updating stock:', error);
        showNotification('Lỗi cập nhật tồn kho', 'error');
    }
});

function applyFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const stockFilter = document.getElementById('stockFilter')?.value || '';

    const filtered = (allProducts || []).filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search);
        const matchCategory = !category || p.category === category;
        let matchStock = true;
        if (stockFilter === 'high') matchStock = p.stock > 50;
        else if (stockFilter === 'low') matchStock = p.stock > 0 && p.stock < 10;
        else if (stockFilter === 'out') matchStock = p.stock === 0;
        return matchSearch && matchCategory && matchStock;
    });

    displayInventory(filtered);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
});
