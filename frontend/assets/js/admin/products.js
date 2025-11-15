// Admin Products Management
const API_URL = 'http://localhost:3000/api';
let allProducts = [];
let editingProductId = null;

// Utility functions
function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount || 0);
}

// Preview and compress image
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');

    if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            if (typeof window.showError === 'function') {
                window.showError('Kích thước ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB');
            }
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                // Compress image
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimensions (smaller for less data)
                const maxWidth = 600;
                const maxHeight = 600;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64 with compression (quality 0.5 for smaller size)
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);

                // Show preview
                preview.innerHTML = `<img src="${compressedBase64}" class="w-full h-full object-cover rounded-lg" alt="Preview">`;

                // Store compressed base64
                document.getElementById('productImage').value = compressedBase64;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '<i class="fas fa-image text-gray-400 text-2xl"></i>';
    }
}

const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    window.location.href = '../login.html';
}

// Check if user can edit (only admin)
const canEdit = user.role === 'admin';

function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../login.html';
    }
}

async function loadProducts() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            allProducts = data.data || data.products || [];
            // Sắp xếp mới nhất lên đầu
            allProducts.sort((a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id));
            displayProducts(allProducts);
        } else {
            throw new Error(data.message || 'Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        if (typeof window.showError === 'function') {
            window.showError('Lỗi tải sản phẩm: ' + error.message);
        }
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-400"><i class="fas fa-box-open text-3xl mb-2"></i><p>Không có sản phẩm</p></td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => {
        const isAvailable = p.isAvailable !== undefined ? p.isAvailable : p.available;
        const stock = p.stock || p.quantity || 0;
        // Only show action buttons for admin
        const actionButtons = canEdit ? `
            <button onclick="toggleProductStatus('${p._id}', ${isAvailable})" class="text-${isAvailable ? 'orange' : 'green'}-600 hover:text-${isAvailable ? 'orange' : 'green'}-800 hover:bg-${isAvailable ? 'orange' : 'green'}-50 p-2 rounded transition-colors" title="${isAvailable ? 'Ngừng bán' : 'Bán lại'}">
                <i class="fas fa-${isAvailable ? 'pause-circle' : 'play-circle'}"></i>
            </button>
            <button onclick="editProduct('${p._id}')" class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors" title="Sửa">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteProduct('${p._id}', '${p.name}')" class="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors" title="Xóa">
                <i class="fas fa-trash"></i>
            </button>
        ` : '<span class="text-gray-400 text-sm">Chỉ xem</span>';
        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                    <img src="${p.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200'}" 
                         onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200'" 
                         class="w-16 h-16 object-cover rounded-lg shadow" alt="${p.name}">
                </td>
                <td class="px-6 py-4">
                    <p class="font-semibold text-gray-800">${p.name}</p>
                    <p class="text-sm text-gray-500 line-clamp-1">${p.description || 'Không có mô tả'}</p>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium whitespace-nowrap">${p.category}</span>
                </td>
                <td class="px-6 py-4 font-semibold text-amber-600">${formatMoney(p.price)}</td>
                <td class="px-6 py-4">
                    <span class="text-lg font-bold ${stock < 10 ? 'text-red-600' : 'text-gray-800'}">${stock}</span>
                    ${stock < 10 ? '<span class="text-xs text-red-500 block">Sắp hết</span>' : ''}
                </td>
                <td class="px-6 py-4">
                    <span class="inline-block px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${isAvailable ? 'Đang bán' : 'Ngừng bán'}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center justify-end gap-2">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openAddModal() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Thêm sản phẩm mới';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productAvailable').value = 'true';
    // Reset image preview
    document.getElementById('imagePreview').innerHTML = '<i class="fas fa-image text-gray-400 text-2xl"></i>';
    document.getElementById('productModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('productModal').classList.add('hidden');
    editingProductId = null;
}

function editProduct(id) {
    const product = allProducts.find(p => p._id === id);
    if (!product) {
        console.error('Product not found:', id);
        return;
    }

    editingProductId = id;
    document.getElementById('modalTitle').textContent = 'Chỉnh sửa sản phẩm';
    document.getElementById('productId').value = id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock || product.quantity || 0;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productAvailable').value = (product.isAvailable !== undefined ? product.isAvailable : product.available) ? 'true' : 'false';

    // Show image preview
    const preview = document.getElementById('imagePreview');
    if (product.image) {
        preview.innerHTML = `<img src="${product.image}" class="w-full h-full object-cover rounded-lg" alt="Preview">`;
    } else {
        preview.innerHTML = '<i class="fas fa-image text-gray-400 text-2xl"></i>';
    }

    document.getElementById('productModal').classList.remove('hidden');
}

async function toggleProductStatus(id, currentStatus) {
    const action = currentStatus ? 'ngừng bán' : 'bán lại';

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                available: !currentStatus
            })
        });
        const data = await response.json();

        if (data.success) {
            if (typeof window.showSuccess === 'function') {
                window.showSuccess(`Đã ${action} sản phẩm`);
            }
            await loadProducts();
        } else {
            throw new Error(data.message || `Không thể ${action} sản phẩm`);
        }
    } catch (error) {
        console.error('Error toggling product status:', error);
        if (typeof window.showError === 'function') {
            window.showError(`Lỗi ${action} sản phẩm: ` + error.message);
        }
    }
}

async function deleteProduct(id, productName) {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${productName}"?\n\nHành động này không thể hoàn tác!`)) return;

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            if (typeof window.showSuccess === 'function') {
                window.showSuccess('Đã xóa sản phẩm "' + productName + '"');
            }
            await loadProducts();
        } else {
            throw new Error(data.message || 'Không thể xóa sản phẩm');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        if (typeof window.showError === 'function') {
            window.showError('Lỗi xóa sản phẩm: ' + error.message);
        }
    }
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value.trim(),
        image: document.getElementById('productImage').value.trim(),
        available: document.getElementById('productAvailable').value === 'true'
    };

    // Validation
    if (!productData.name) {
        if (typeof window.showError === 'function') {
            window.showError('Vui lòng nhập tên sản phẩm');
        }
        return;
    }

    if (productData.price <= 0) {
        if (typeof window.showError === 'function') {
            window.showError('Giá sản phẩm phải lớn hơn 0');
        }
        return;
    }

    try {
        const token = getAuthToken();
        const url = editingProductId ? `${API_URL}/products/${editingProductId}` : `${API_URL}/products`;
        const method = editingProductId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (data.success) {
            if (typeof window.showSuccess === 'function') {
                window.showSuccess(editingProductId ? 'Đã cập nhật sản phẩm "' + productData.name + '"' : 'Đã thêm sản phẩm "' + productData.name + '"');
            }
            closeModal();
            await loadProducts();
        } else {
            throw new Error(data.message || 'Không thể lưu sản phẩm');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        if (typeof window.showError === 'function') {
            window.showError('Lỗi lưu sản phẩm: ' + error.message);
        }
    }
});

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;

    const filtered = allProducts.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search) || (p.description && p.description.toLowerCase().includes(search));
        const matchCategory = !category || p.category === category;
        const isAvailable = p.isAvailable !== undefined ? p.isAvailable : p.available;
        const matchStatus = !status ||
            (status === 'true' && isAvailable) ||
            (status === 'false' && !isAvailable);
        return matchSearch && matchCategory && matchStatus;
    });

    displayProducts(filtered);
}

document.getElementById('searchInput').addEventListener('input', applyFilters);

document.addEventListener('DOMContentLoaded', loadProducts);
