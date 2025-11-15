// Admin Promotions Management
const API_URL = 'http://localhost:3000/api';
let allPromotions = [];
let editingId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Permission check is handled by permissions.js
    loadPromotions();
    setupEventListeners();
});

// Logout
function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        window.location.href = '../login.html';
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('promotionForm').addEventListener('submit', handleSubmit);
}

// Load all promotions
async function loadPromotions() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/promotions?includeExpired=true`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allPromotions = data.promotions;
            updateStats();
            renderPromotions(allPromotions);
        }
    } catch (error) {
        console.error('Error loading promotions:', error);
        alert('Lỗi khi tải dữ liệu khuyến mãi!');
    }
}

// Update statistics
function updateStats() {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const total = allPromotions.length;
    const active = allPromotions.filter(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return p.isActive && start <= now && end >= now;
    }).length;
    
    const expiring = allPromotions.filter(p => {
        const end = new Date(p.endDate);
        return p.isActive && end > now && end <= sevenDaysLater;
    }).length;
    
    const expired = allPromotions.filter(p => {
        const end = new Date(p.endDate);
        return end < now;
    }).length;
    
    document.getElementById('totalPromotions').textContent = total;
    document.getElementById('activePromotions').textContent = active;
    document.getElementById('expiringPromotions').textContent = expiring;
    document.getElementById('expiredPromotions').textContent = expired;
}

// Render promotions table
function renderPromotions(promotions) {
    const tbody = document.getElementById('promotionsTableBody');
    
    if (promotions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>Chưa có khuyến mãi nào</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = promotions.map(promo => {
        const status = getPromotionStatus(promo);
        const discountText = promo.discountType === 'percentage' 
            ? `${promo.discountValue}%` 
            : `${formatMoney(promo.discountValue)}`;
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div>
                        <div class="font-semibold text-gray-900">${promo.title}</div>
                        <div class="text-sm text-gray-500">${promo.description || 'Không có mô tả'}</div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    ${promo.code ? `<code class="px-2 py-1 bg-gray-100 rounded text-sm font-mono">${promo.code}</code>` : '<span class="text-gray-400">-</span>'}
                </td>
                <td class="px-6 py-4">
                    <div>
                        <div class="font-semibold text-amber-600">${discountText}</div>
                        ${promo.maxDiscount ? `<div class="text-xs text-gray-500">Tối đa: ${formatMoney(promo.maxDiscount)}</div>` : ''}
                        ${promo.minOrderValue > 0 ? `<div class="text-xs text-gray-500">Đơn tối thiểu: ${formatMoney(promo.minOrderValue)}</div>` : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm">
                        <div><i class="far fa-calendar-alt text-gray-400 mr-1"></i>${formatDate(promo.startDate)}</div>
                        <div><i class="far fa-calendar-alt text-gray-400 mr-1"></i>${formatDate(promo.endDate)}</div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    ${status.badge}
                </td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        <button onclick="editPromotion('${promo._id}')" class="text-blue-600 hover:text-blue-800" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleActive('${promo._id}', ${!promo.isActive})" class="text-${promo.isActive ? 'orange' : 'green'}-600 hover:text-${promo.isActive ? 'orange' : 'green'}-800" title="${promo.isActive ? 'Tắt' : 'Bật'}">
                            <i class="fas fa-${promo.isActive ? 'pause' : 'play'}-circle"></i>
                        </button>
                        <button onclick="deletePromotion('${promo._id}')" class="text-red-600 hover:text-red-800" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Get promotion status
function getPromotionStatus(promo) {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    
    if (!promo.isActive) {
        return {
            badge: '<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800"><i class="fas fa-pause-circle mr-1"></i>Tạm dừng</span>',
            status: 'inactive'
        };
    }
    
    if (end < now) {
        return {
            badge: '<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800"><i class="fas fa-times-circle mr-1"></i>Đã hết hạn</span>',
            status: 'expired'
        };
    }
    
    if (start > now) {
        return {
            badge: '<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"><i class="fas fa-clock mr-1"></i>Sắp diễn ra</span>',
            status: 'upcoming'
        };
    }
    
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (end <= sevenDaysLater) {
        return {
            badge: '<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800"><i class="fas fa-exclamation-triangle mr-1"></i>Sắp hết hạn</span>',
            status: 'expiring'
        };
    }
    
    return {
        badge: '<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"><i class="fas fa-check-circle mr-1"></i>Đang hoạt động</span>',
        status: 'active'
    };
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    let filtered = allPromotions;
    
    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchTerm) ||
            (p.code && p.code.toLowerCase().includes(searchTerm)) ||
            (p.description && p.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Status filter
    if (statusFilter) {
        filtered = filtered.filter(p => {
            const status = getPromotionStatus(p).status;
            return status === statusFilter;
        });
    }
    
    // Type filter
    if (typeFilter) {
        filtered = filtered.filter(p => p.discountType === typeFilter);
    }
    
    renderPromotions(filtered);
}

// Toggle discount type fields
function toggleDiscountFields() {
    const type = document.getElementById('discountType').value;
    const maxDiscountField = document.getElementById('maxDiscountField');
    
    if (type === 'percentage') {
        maxDiscountField.style.display = 'block';
    } else {
        maxDiscountField.style.display = 'none';
        document.getElementById('maxDiscount').value = '';
    }
}

// Open add modal
function openAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Tạo khuyến mãi mới';
    document.getElementById('promotionForm').reset();
    document.getElementById('isActive').checked = true;
    
    // Set default dates
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    document.getElementById('startDate').value = formatDateTimeLocal(now);
    document.getElementById('endDate').value = formatDateTimeLocal(nextWeek);
    
    toggleDiscountFields();
    document.getElementById('promotionModal').classList.remove('hidden');
}

// Edit promotion
async function editPromotion(id) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/promotions/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const promo = data.promotion;
            editingId = id;
            
            document.getElementById('modalTitle').textContent = 'Sửa khuyến mãi';
            document.getElementById('promotionId').value = id;
            document.getElementById('title').value = promo.title;
            document.getElementById('description').value = promo.description || '';
            document.getElementById('discountType').value = promo.discountType;
            document.getElementById('discountValue').value = promo.discountValue;
            document.getElementById('code').value = promo.code || '';
            document.getElementById('maxDiscount').value = promo.maxDiscount || '';
            document.getElementById('minOrderValue').value = promo.minOrderValue || 0;
            document.getElementById('usageLimit').value = promo.usageLimit || '';
            document.getElementById('startDate').value = formatDateTimeLocal(new Date(promo.startDate));
            document.getElementById('endDate').value = formatDateTimeLocal(new Date(promo.endDate));
            document.getElementById('isActive').checked = promo.isActive;
            
            toggleDiscountFields();
            document.getElementById('promotionModal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading promotion:', error);
        alert('Lỗi khi tải thông tin khuyến mãi!');
    }
}

// Handle form submit
async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        discountType: document.getElementById('discountType').value,
        discountValue: parseFloat(document.getElementById('discountValue').value),
        code: document.getElementById('code').value.toUpperCase() || undefined,
        maxDiscount: document.getElementById('maxDiscount').value ? parseFloat(document.getElementById('maxDiscount').value) : undefined,
        minOrderValue: parseFloat(document.getElementById('minOrderValue').value) || 0,
        usageLimit: document.getElementById('usageLimit').value ? parseInt(document.getElementById('usageLimit').value) : undefined,
        startDate: new Date(document.getElementById('startDate').value),
        endDate: new Date(document.getElementById('endDate').value),
        isActive: document.getElementById('isActive').checked
    };
    
    // Validation
    if (formData.startDate >= formData.endDate) {
        alert('Ngày kết thúc phải sau ngày bắt đầu!');
        return;
    }
    
    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
        alert('Giảm giá phần trăm không được vượt quá 100%!');
        return;
    }
    
    try {
        const token = getAuthToken();
        const url = editingId 
            ? `${API_URL}/promotions/${editingId}`
            : `${API_URL}/promotions`;
        
        const response = await fetch(url, {
            method: editingId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(editingId ? 'Cập nhật khuyến mãi thành công!' : 'Tạo khuyến mãi thành công!');
            closeModal();
            loadPromotions();
        } else {
            alert(data.error || 'Có lỗi xảy ra!');
        }
    } catch (error) {
        console.error('Error saving promotion:', error);
        alert('Lỗi khi lưu khuyến mãi!');
    }
}

// Toggle active status
async function toggleActive(id, isActive) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/promotions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isActive })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadPromotions();
        } else {
            alert(data.error || 'Có lỗi xảy ra!');
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        alert('Lỗi khi thay đổi trạng thái!');
    }
}

// Delete promotion
async function deletePromotion(id) {
    if (!confirm('Bạn có chắc muốn xóa khuyến mãi này?')) return;
    
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/promotions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Xóa khuyến mãi thành công!');
            loadPromotions();
        } else {
            alert(data.error || 'Có lỗi xảy ra!');
        }
    } catch (error) {
        console.error('Error deleting promotion:', error);
        alert('Lỗi khi xóa khuyến mãi!');
    }
}

// Close modal
function closeModal() {
    document.getElementById('promotionModal').classList.add('hidden');
    editingId = null;
}

// Utility functions
function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
