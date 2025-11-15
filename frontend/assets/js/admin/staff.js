/**
 * Staff Management - Admin
 * Quản lý nhân viên và phân quyền (API_BASE_URL và getAuthToken từ api.js và permissions.js)
 */

let allStaff = [];
let editingStaffId = null;

const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
if (!user || !user.role) {
    window.location.href = '../login.html';
} else if (user.role === 'staff') {
    // Staff không được truy cập trang quản lý nhân viên
    window.location.href = 'admin-stats.html';
} else if (user.role !== 'admin') {
    window.location.href = '../login.html';
}

function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.clear();
        window.location.href = '../login.html';
    }
}

async function loadStaff() {
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
            allStaff = data.data.filter(u => u.role === 'admin' || u.role === 'staff');
            displayStaff(allStaff);
        }
    } catch (error) {
        console.error('Error loading staff:', error);
        showNotification('Lỗi tải danh sách nhân viên', 'error');
    }
}

function displayStaff(staff) {
    const tbody = document.getElementById('staffTableBody');
    if (staff.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">Không có nhân viên</td></tr>';
        return;
    }
    
    tbody.innerHTML = staff.map(s => {
        const fullName = [s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || s.username || s.email.split('@')[0];
        return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        ${fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-semibold">${fullName}</p>
                        <p class="text-sm text-gray-500">@${s.username || s.email.split('@')[0]}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">${s.email}</td>
            <td class="px-6 py-4">${s.phone || '<span class="text-gray-400">Chưa có</span>'}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-sm ${s.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                    ${s.role === 'admin' ? 'Admin' : 'Nhân viên'}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    Hoạt động
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="editStaff('${s._id}')" class="text-blue-600 hover:text-blue-800 mr-3"><i class="fas fa-edit"></i></button>
                <button onclick="deleteStaff('${s._id}', '${fullName}')" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `;
    }).join('');
}

function openAddModal() {
    editingStaffId = null;
    document.getElementById('modalTitle').textContent = 'Thêm nhân viên mới';
    document.getElementById('staffForm').reset();
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.required = true;
    }
    document.getElementById('staffModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('staffModal').classList.add('hidden');
}

function editStaff(id) {
    const staff = allStaff.find(s => s._id === id);
    if (!staff) return;
    
    editingStaffId = id;
    document.getElementById('modalTitle').textContent = 'Chỉnh sửa nhân viên';
    
    // Load fullName or combine firstName + lastName
    const fullName = staff.name || staff.username || [staff.firstName, staff.lastName].filter(Boolean).join(' ');
    document.getElementById('fullName').value = fullName;
    document.getElementById('email').value = staff.email;
    document.getElementById('phone').value = staff.phone || '';
    document.getElementById('role').value = staff.role;
    document.getElementById('password').value = '';
    document.getElementById('password').required = false;
    document.getElementById('staffModal').classList.remove('hidden');
}

async function deleteStaff(id, name) {
    if (!confirm(`Bạn có chắc muốn xóa nhân viên này?`)) return;
    
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Handle 403 Forbidden
        if (response.status === 403) {
            alert('Bạn không có quyền xóa nhân viên!');
            return;
        }
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            showNotification('Phiên đăng nhập đã hết hạn', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }
        
        const data = await response.json();
        if (data.success) {
            showNotification('Đã xóa nhân viên', 'success');
            loadStaff();
        } else {
            showNotification(data.message || 'Lỗi xóa nhân viên', 'error');
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
        showNotification('Lỗi xóa nhân viên', 'error');
    }
}

document.getElementById('staffForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    // Validate phone
    if (!/^[0-9]{10}$/.test(phone)) {
        showNotification('Số điện thoại không hợp lệ (10 chữ số)', 'error');
        return;
    }
    
    const staffData = {
        name: fullName,
        username: fullName,  // username = fullName giống đăng ký
        email: email,
        phone: phone,
        role: document.getElementById('role').value
    };
    
    const password = document.getElementById('password').value.trim();
    if (password) {
        staffData.password = password;
    }
    
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        const url = editingStaffId ? `${API_BASE_URL}/users/${editingStaffId}` : `${API_BASE_URL}/users`;
        const method = editingStaffId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(staffData)
        });
        
        // Handle 403 Forbidden
        if (response.status === 403) {
            alert('Bạn không có quyền thực hiện thao tác này!');
            return;
        }
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            showNotification('Phiên đăng nhập đã hết hạn', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }
        
        const data = await response.json();
        if (data.success) {
            showNotification(editingStaffId ? 'Đã cập nhật nhân viên' : 'Đã thêm nhân viên mới', 'success');
            closeModal();
            loadStaff();
        } else {
            showNotification(data.message || 'Lỗi lưu nhân viên', 'error');
        }
    } catch (error) {
        console.error('Error saving staff:', error);
        showNotification('Lỗi lưu nhân viên', 'error');
    }
});

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const role = document.getElementById('roleFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    const filtered = allStaff.filter(s => {
        const fullName = [s.firstName, s.lastName].filter(Boolean).join(' ').toLowerCase();
        const matchSearch = fullName.includes(search) || s.email.toLowerCase().includes(search);
        const matchRole = !role || s.role === role;
        const matchStatus = !status || (status === 'active' && s.isActive) || (status === 'inactive' && !s.isActive);
        return matchSearch && matchRole && matchStatus;
    });
    
    displayStaff(filtered);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadStaff();
    
    // Setup search filter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    // Setup role filter
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', applyFilters);
    }
    
    // Setup status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
});
