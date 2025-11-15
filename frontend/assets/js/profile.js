// Profile Page Functionality
console.log('Profile page loaded');

let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing profile page...');
    
    // Check authentication
    if (!checkAuth()) {
        alert('Vui lòng đăng nhập!');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Load user data
    loadUserProfile();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('Profile page initialized');
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    // For testing: If no token, redirect to login
    if (!token) {
        console.log('No token found - should login');
        // For now, create mock data for testing
        const mockUser = {
            name: 'Nguyen Van A',
            email: 'admin@coffee.com',
            phone: '0123456789',
            address: '123 Duong ABC, Quan 1, TP.HCM',
            birthday: '1990-01-01',
            gender: 'male'
        };
        localStorage.setItem('user', JSON.stringify(mockUser));
        console.log('Created mock user for testing');
        return true;
    }
    
    return true;
}

// Load user profile
async function loadUserProfile() {
    try {
        // 1. Try localStorage first (fastest, no API call)
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        
        if (userStr) {
            try {
                currentUser = JSON.parse(userStr);
                
                // Validate has required fields
                if (currentUser && (currentUser.email || currentUser.username)) {
                    // Ensure name exists - use username if name is not set
                    if (!currentUser.name && currentUser.username) {
                        currentUser.name = currentUser.username;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    }
                    
                    console.log('✅ User loaded from localStorage:', currentUser.name || currentUser.username);
                    
                    // Display profile with local data
                    if (currentUser) {
                        displayUserProfile();
                        loadUserStats();
                    }
                    return;
                }
            } catch (parseError) {
                console.log('⚠️ Could not parse user from storage:', parseError.message);
            }
        }
        
        // 2. No valid local data, try API
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (token && token !== 'mock-token') {
            console.log('🔄 Fetching user profile from API...');
            
            const response = await fetch('http://localhost:3000/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                
                // Ensure name exists - use username if name is not set
                if (!currentUser.name && currentUser.username) {
                    currentUser.name = currentUser.username;
                }
                
                localStorage.setItem('user', JSON.stringify(currentUser));
                console.log('✅ User loaded from API:', currentUser.name || currentUser.username);
            } else {
                if (response.status === 401) {
                    console.log('⚠️ Token expired (401). Please login again.');
                    localStorage.removeItem('authToken');
                    sessionStorage.removeItem('authToken');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`API error: ${response.status}`);
            }
        } else {
            console.log('⚠️ No valid token, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        console.log('❌ Error loading profile:', error.message);
        showNotification('Không thể tải thông tin!', 'error');
        return;
    }
    
    if (currentUser) {
        displayUserProfile();
        loadUserStats();
    } else {
        showNotification('Không thể tải thông tin!', 'error');
    }
}

// Load user statistics
async function loadUserStats() {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (token && token !== 'mock-token') {
            const response = await fetch('http://localhost:3000/api/users/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                updateStatsDisplay(stats);
                return;
            }
        }
    } catch (error) {
        console.log('Stats API error, using defaults');
    }
    
    // Default stats for testing
    updateStatsDisplay({
        orders: 0,
        reservations: 0,
        points: 0
    });
}

// Update stats display
function updateStatsDisplay(stats) {
    const statOrders = document.getElementById('statOrders');
    const statReservations = document.getElementById('statReservations');
    const statPoints = document.getElementById('statPoints');
    
    if (statOrders) statOrders.textContent = stats.orders || 0;
    if (statReservations) statReservations.textContent = stats.reservations || 0;
    if (statPoints) statPoints.textContent = stats.points || 0;
}

// Display user profile
function displayUserProfile() {
    // Get display name: prioritize name, fallback to username
    const displayName = currentUser.name || currentUser.username || 'User';
    
    // Update sidebar name and avatar
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarAvatar = document.getElementById('userAvatar');
    
    if (sidebarName) {
        sidebarName.textContent = displayName;
    }
    
    if (sidebarAvatar) {
        if (currentUser.avatar) {
            sidebarAvatar.src = currentUser.avatar;
        } else {
            sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6F4E37&color=fff&size=200`;
        }
    }
    
    // Update header username (top right)
    const headerUsername = document.querySelector('.user-menu .font-medium');
    if (headerUsername) {
        headerUsername.textContent = displayName;
    }
    
    // Update header avatar
    const headerAvatar = document.querySelector('.user-menu img');
    if (headerAvatar) {
        if (currentUser.avatar) {
            headerAvatar.src = currentUser.avatar;
        } else {
            headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6F4E37&color=fff&size=80`;
        }
    }
    
    // Update form fields - use name or username
    document.getElementById('profileName').value = displayName;
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileAddress').value = currentUser.address || '';
    document.getElementById('profileBirthday').value = currentUser.birthday || '';
    
    if (currentUser.gender) {
        const genderRadio = document.querySelector(`input[name="gender"][value="${currentUser.gender}"]`);
        if (genderRadio) genderRadio.checked = true;
    }
    
    console.log('Profile displayed for:', displayName);
}

// Setup event listeners
function setupEventListeners() {
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', enableEditMode);
    }
    
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelEdit);
    }
    
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
    
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarChange);
    }
}

// Enable edit mode
function enableEditMode() {
    const inputs = document.querySelectorAll('#profileSection input:not([type="radio"]), #profileSection textarea');
    inputs.forEach(input => {
        input.removeAttribute('disabled');
        input.classList.remove('bg-gray-50');
        input.classList.add('bg-white');
    });
    
    const radios = document.querySelectorAll('#profileSection input[type="radio"]');
    radios.forEach(radio => {
        radio.removeAttribute('disabled');
    });
    
    document.getElementById('editProfileBtn').classList.add('hidden');
    document.getElementById('saveProfileBtn').classList.remove('hidden');
    document.getElementById('cancelEditBtn').classList.remove('hidden');
}

// Cancel edit
function cancelEdit() {
    const inputs = document.querySelectorAll('#profileSection input:not([type="radio"]), #profileSection textarea');
    inputs.forEach(input => {
        input.setAttribute('disabled', '');
        input.classList.remove('bg-white');
        input.classList.add('bg-gray-50');
    });
    
    const radios = document.querySelectorAll('#profileSection input[type="radio"]');
    radios.forEach(radio => {
        radio.setAttribute('disabled', '');
    });
    
    document.getElementById('editProfileBtn').classList.remove('hidden');
    document.getElementById('saveProfileBtn').classList.add('hidden');
    document.getElementById('cancelEditBtn').classList.add('hidden');
    
    displayUserProfile();
}

// Save profile
async function saveProfile() {
    const updatedData = {
        name: document.getElementById('profileName').value.trim(),
        username: document.getElementById('profileName').value.trim(), // Sync username with name
        email: document.getElementById('profileEmail').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        address: document.getElementById('profileAddress').value.trim(),
        birthday: document.getElementById('profileBirthday').value,
        gender: document.querySelector('input[name="gender"]:checked')?.value
    };
    
    // Include avatar if it exists
    if (currentUser.avatar) {
        updatedData.avatar = currentUser.avatar;
    }
    
    if (!updatedData.name) {
        showNotification('Vui lòng nhập họ tên!', 'warning');
        return;
    }
    
    if (!updatedData.email) {
        showNotification('Vui lòng nhập email!', 'warning');
        return;
    }
    
    if (!updatedData.phone) {
        showNotification('Vui lòng nhập số điện thoại!', 'warning');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (token && token !== 'mock-token') {
            const response = await fetch('http://localhost:3000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(currentUser));
                showNotification('Cập nhật thành công!', 'success');
            } else {
                throw new Error('API failed');
            }
        } else {
            throw new Error('No valid token');
        }
    } catch (error) {
        console.log('Updating localStorage fallback');
        currentUser = { ...currentUser, ...updatedData };
        localStorage.setItem('user', JSON.stringify(currentUser));
        showNotification('Cập nhật thành công!', 'success');
    }
    
    displayUserProfile();
    cancelEdit();
}

// Handle password change
async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('Mật khẩu mới không khớp!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Mật khẩu phải có ít nhất 6 ký tự!', 'warning');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        const response = await fetch('http://localhost:3000/api/users/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        if (response.ok) {
            showNotification('Đổi mật khẩu thành công!', 'success');
            e.target.reset();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Đổi mật khẩu thất bại!', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showNotification('Có lỗi xảy ra!', 'error');
    }
}

// Change avatar
function changeAvatar() {
    document.getElementById('avatarInput').click();
}

// Handle avatar change
async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Vui lòng chọn file ảnh!', 'warning');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Ảnh không được vượt quá 5MB!', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const base64Image = event.target.result;
        
        // Update all avatar displays
        const avatarImg = document.getElementById('userAvatar');
        if (avatarImg) {
            avatarImg.src = base64Image;
        }
        
        const headerAvatar = document.querySelector('.user-menu img');
        if (headerAvatar) {
            headerAvatar.src = base64Image;
        }
        
        // Save to currentUser object (will be saved when clicking Save button)
        currentUser.avatar = base64Image;
        
        // Also save immediately to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showNotification('Ảnh đại diện đã được chọn! Nhấn Save để lưu thay đổi.', 'success');
    };
    reader.readAsDataURL(file);
}

// Show section
function showSection(sectionId) {
    document.querySelectorAll('[id$="Section"]').forEach(section => {
        section.classList.add('hidden');
    });
    
    const section = document.getElementById(sectionId + 'Section');
    if (section) {
        section.classList.remove('hidden');
    }
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active', 'bg-coffee', 'text-white');
    });
    
    const menuItem = document.querySelector(`a[href="#${sectionId}"]`);
    if (menuItem) {
        menuItem.classList.add('active', 'bg-coffee', 'text-white');
    }
}

// Show notification
function showNotification(message, type) {
    type = type || 'info';
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'error' ? 'bg-red-500' : 
                   type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
    
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${bgColor} text-white transform translate-x-full transition-transform duration-300`;
    notification.innerHTML = `<span>${message}</span>`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = input.nextElementSibling;
    if (!button) return;
    
    const icon = button.querySelector('i');
    if (!icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Toggle user menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// Logout function
function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        
        showNotification('Đã đăng xuất thành công!', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Expose functions to window
window.showSection = showSection;
window.changeAvatar = changeAvatar;
window.togglePassword = togglePassword;
window.toggleUserMenu = toggleUserMenu;
window.toggleMobileMenu = toggleMobileMenu;
window.logout = logout;
window.viewMyContact = viewMyContact;
window.openContactDetailModal = openContactDetailModal;
window.closeContactDetailModal = closeContactDetailModal;
window.openNewContactModal = openNewContactModal;
window.closeNewContactModal = closeNewContactModal;

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');
    
    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

// ==================== CONTACTS FUNCTIONALITY ====================

let currentContacts = [];
let currentViewingContact = null;

// Load user's contacts when contacts section is shown
const originalShowSection = showSection;
showSection = function(sectionId) {
    originalShowSection(sectionId);
    if (sectionId === 'contacts') {
        loadMyContacts();
    }
};

// Load user's contacts
async function loadMyContacts() {
    const loading = document.getElementById('contactsLoading');
    const empty = document.getElementById('contactsEmpty');
    const list = document.getElementById('contactsList');
    
    if (!loading || !empty || !list) return;
    
    loading.classList.remove('hidden');
    empty.classList.add('hidden');
    list.classList.add('hidden');
    
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 
                      sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
        
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        const response = await fetch('http://localhost:3000/api/contacts/my-messages', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load contacts');
        }
        
        const data = await response.json();
        currentContacts = data.contacts || [];
        
        loading.classList.add('hidden');
        
        if (currentContacts.length === 0) {
            empty.classList.remove('hidden');
        } else {
            list.classList.remove('hidden');
            displayMyContacts();
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        loading.classList.add('hidden');
        empty.classList.remove('hidden');
        showNotification('Không thể tải tin nhắn', 'error');
    }
}

// Display user's contacts
function displayMyContacts() {
    const list = document.getElementById('contactsList');
    if (!list) return;
    
    list.innerHTML = currentContacts.map(contact => {
        const statusColors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            'resolved': 'bg-green-100 text-green-800',
            'closed': 'bg-gray-100 text-gray-800'
        };
        
        const statusTexts = {
            'pending': 'Chờ xử lý',
            'in-progress': 'Đang xử lý',
            'resolved': 'Đã giải quyết',
            'closed': 'Đã đóng'
        };
        
        const statusClass = statusColors[contact.status] || statusColors['pending'];
        const statusText = statusTexts[contact.status] || contact.status;
        
        const replyCount = contact.replies ? contact.replies.length : 0;
        const lastReplyTime = replyCount > 0 ? 
            new Date(contact.replies[replyCount - 1].repliedAt).toLocaleString('vi-VN') : 
            new Date(contact.createdAt).toLocaleString('vi-VN');
        
        const hasNewReply = replyCount > 0 && contact.status !== 'closed';
        
        return `
            <div onclick="viewMyContact('${contact._id}')" 
                 class="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer bg-white">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <h3 class="font-bold text-coffee text-lg mb-1">${contact.subject}</h3>
                        <p class="text-sm text-gray-500">
                            <i class="far fa-clock mr-1"></i>${lastReplyTime}
                        </p>
                    </div>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusClass}">
                        ${statusText}
                    </span>
                </div>
                
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${contact.message}</p>
                
                <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center space-x-4 text-gray-500">
                        <span>
                            <i class="fas fa-reply mr-1"></i>${replyCount} phản hồi
                        </span>
                    </div>
                    ${hasNewReply ? '<span class="text-coffee font-semibold animate-pulse"><i class="fas fa-bell mr-1"></i>Có phản hồi mới</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// View contact detail
async function viewMyContact(contactId) {
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 
                      sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
        
        const response = await fetch(`http://localhost:3000/api/contacts/${contactId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load contact detail');
        }
        
        const data = await response.json();
        currentViewingContact = data.contact;
        
        displayContactDetail(currentViewingContact);
        openContactDetailModal();
        
    } catch (error) {
        console.error('Error viewing contact:', error);
        showNotification('Không thể tải chi tiết tin nhắn', 'error');
    }
}

// Display contact detail in modal
function displayContactDetail(contact) {
    // Subject and date
    document.getElementById('modalContactSubject').textContent = contact.subject;
    document.getElementById('modalContactDate').textContent = 
        new Date(contact.createdAt).toLocaleString('vi-VN');
    
    // Original message
    document.getElementById('originalMessageTime').textContent = 
        new Date(contact.createdAt).toLocaleString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    document.getElementById('originalMessageContent').textContent = contact.message;
    
    // Status badge
    const statusBadge = document.getElementById('contactStatusBadge');
    const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        'resolved': 'bg-green-100 text-green-800',
        'closed': 'bg-gray-100 text-gray-800'
    };
    const statusTexts = {
        'pending': 'Chờ xử lý',
        'in-progress': 'Đang xử lý',
        'resolved': 'Đã giải quyết',
        'closed': 'Đã đóng'
    };
    statusBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[contact.status]}`;
    statusBadge.textContent = statusTexts[contact.status];
    
    // Replies
    const repliesContainer = document.getElementById('contactReplies');
    if (contact.replies && contact.replies.length > 0) {
        repliesContainer.innerHTML = contact.replies.map(reply => {
            const isAdmin = reply.repliedBy && (reply.repliedBy.role === 'admin' || reply.repliedBy.role === 'staff');
            // Tin nhắn của user (bạn) ở bên PHẢI, tin nhắn admin ở bên TRÁI
            const isUser = !isAdmin;
            return `
                <div class="flex items-start space-x-3 sm:space-x-4 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}">
                    <div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 ${isAdmin ? 'bg-gradient-to-br from-amber-500 to-coffee' : 'bg-coffee'} rounded-full flex items-center justify-center text-white font-semibold shadow-lg text-sm sm:text-base">
                        <i class="fas ${isAdmin ? 'fa-user-shield' : 'fa-user'}"></i>
                    </div>
                    <div class="flex-1 max-w-md min-w-0">
                        <div class="${isUser ? 'bg-coffee text-white rounded-2xl rounded-tr-none' : 'bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl rounded-tl-none'} p-3 sm:p-4 shadow-md">
                            <div class="flex items-center justify-between mb-2 gap-2">
                                <span class="font-semibold ${isUser ? 'text-cream' : 'text-coffee'} text-sm sm:text-base truncate">
                                    ${reply.repliedBy ? reply.repliedBy.name || reply.repliedBy.username : 'Bạn'}
                                </span>
                                <span class="text-xs ${isUser ? 'text-cream' : 'text-gray-500'} flex-shrink-0">
                                    ${new Date(reply.repliedAt).toLocaleString('vi-VN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        day: '2-digit',
                                        month: '2-digit'
                                    })}
                                </span>
                            </div>
                            <p class="${isUser ? 'text-white' : 'text-gray-700'} text-sm sm:text-base break-words">${reply.message}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        repliesContainer.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="fas fa-inbox text-3xl sm:text-4xl mb-2 block"></i><p class="text-sm sm:text-base">Chưa có phản hồi</p></div>';
    }
}

// Open/close contact detail modal
function openContactDetailModal() {
    const modal = document.getElementById('contactDetailModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function closeContactDetailModal() {
    const modal = document.getElementById('contactDetailModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
        currentViewingContact = null;
        document.getElementById('replyMessage').value = '';
    }
}

// Send follow-up message
document.addEventListener('DOMContentLoaded', function() {
    const replyForm = document.getElementById('replyForm');
    if (replyForm) {
        replyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentViewingContact) return;
            
            const message = document.getElementById('replyMessage').value.trim();
            if (!message) {
                showNotification('Vui lòng nhập tin nhắn', 'warning');
                return;
            }
            
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 
                              sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
                
                const response = await fetch(`http://localhost:3000/api/contacts/${currentViewingContact._id}/reply`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ message })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to send message');
                }
                
                showNotification('Đã gửi tin nhắn thành công', 'success');
                document.getElementById('replyMessage').value = '';
                
                // Reload contact detail
                await viewMyContact(currentViewingContact._id);
                
            } catch (error) {
                console.error('Error sending message:', error);
                showNotification('Không thể gửi tin nhắn', 'error');
            }
        });
    }
});

// Open/close new contact modal
function openNewContactModal() {
    const modal = document.getElementById('newContactModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function closeNewContactModal() {
    const modal = document.getElementById('newContactModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
        document.getElementById('newContactSubject').value = '';
        document.getElementById('newContactMessage').value = '';
    }
}

// Send new contact message
document.addEventListener('DOMContentLoaded', function() {
    const newContactForm = document.getElementById('newContactForm');
    if (newContactForm) {
        newContactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const subject = document.getElementById('newContactSubject').value.trim();
            const message = document.getElementById('newContactMessage').value.trim();
            
            if (!subject || !message) {
                showNotification('Vui lòng điền đầy đủ thông tin', 'warning');
                return;
            }
            
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 
                              sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
                
                const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
                
                const response = await fetch('http://localhost:3000/api/contacts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: user.name || user.username,
                        email: user.email,
                        phone: user.phone || '',
                        subject,
                        message
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to send contact');
                }
                
                showNotification('Đã gửi tin nhắn thành công', 'success');
                closeNewContactModal();
                
                // Reload contacts list
                loadMyContacts();
                
            } catch (error) {
                console.error('Error sending contact:', error);
                showNotification('Không thể gửi tin nhắn', 'error');
            }
        });
    }
});
