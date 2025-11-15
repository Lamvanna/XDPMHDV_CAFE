/**
 * Settings Management - Admin
 * Quản lý cài đặt hệ thống
 */

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-toast fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 flex items-center space-x-3';
    
    // Set color based on type
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
        warning: 'bg-yellow-500 text-white'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    notification.className += ' ' + (colors[type] || colors.info);
    
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info} text-xl"></i>
        <span class="font-medium">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.style.transform = 'translateX(0)', 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
if (!user || !user.role) {
    window.location.href = '../login.html';
} else if (user.role === 'staff') {
    // Staff không được truy cập trang cài đặt
    window.location.href = 'admin-stats.html';
} else if (user.role !== 'admin') {
    window.location.href = '../login.html';
}

function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../login.html';
    }
}

/**
 * Show specific settings section
 */
function showSection(section) {
    const sections = ['shop', 'hours', 'payment', 'notification', 'backup'];

    sections.forEach(s => {
        const sectionEl = document.getElementById(s + 'Section');
        const btnEl = document.getElementById('btn' + s.charAt(0).toUpperCase() + s.slice(1));

        if (sectionEl) sectionEl.classList.add('hidden');
        if (btnEl) {
            btnEl.classList.remove('bg-amber-100', 'text-amber-800', 'font-medium');
            btnEl.classList.add('hover:bg-gray-100');
        }
    });

    const targetSection = document.getElementById(section + 'Section');
    const targetBtn = document.getElementById('btn' + section.charAt(0).toUpperCase() + section.slice(1));

    if (targetSection) targetSection.classList.remove('hidden');
    if (targetBtn) {
        targetBtn.classList.add('bg-amber-100', 'text-amber-800', 'font-medium');
        targetBtn.classList.remove('hover:bg-gray-100');
    }
}

/**
 * Preview logo
 */
function previewLogo() {
    const logoUrl = document.getElementById('shopLogo')?.value;
    const logoPreview = document.getElementById('logoPreview');
    
    if (!logoUrl) {
        showNotification('Vui lòng nhập URL logo', 'warning');
        return;
    }
    
    if (logoPreview) {
        logoPreview.innerHTML = `<img src="${logoUrl}" alt="Logo Preview" class="w-full h-full object-contain" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-exclamation-triangle text-4xl text-red-500\\'></i><p class=\\'text-xs text-red-500 mt-1\\'>Lỗi tải ảnh</p>'">`;
    }
}

/**
 * Upload logo file
 */
async function uploadLogoFile(file) {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (!file) {
        showNotification('Vui lòng chọn file', 'warning');
        return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, SVG, WebP)', 'error');
        return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File quá lớn. Kích thước tối đa 5MB', 'error');
        return;
    }
    
    // Show loading
    showNotification('Đang upload logo...', 'info');
    
    try {
        const formData = new FormData();
        formData.append('logo', file);
        
        const response = await fetch('http://localhost:3000/api/upload/logo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update input with new URL
            const shopLogo = document.getElementById('shopLogo');
            if (shopLogo) {
                shopLogo.value = data.logoUrl;
            }
            
            // Preview the uploaded logo
            const logoPreview = document.getElementById('logoPreview');
            if (logoPreview) {
                logoPreview.innerHTML = `<img src="${data.logoUrl}" alt="Logo" class="w-full h-full object-contain">`;
            }
            
            showNotification('Upload logo thành công! Nhớ click "Lưu thay đổi"', 'success');
        } else {
            showNotification('Lỗi: ' + (data.error || 'Upload thất bại'), 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Lỗi kết nối server', 'error');
    }
}

/**
 * Load settings from API
 */
async function loadSettings() {
    try {
        const response = await fetch('http://localhost:3000/api/settings');
        const data = await response.json();

        if (data.success && data.settings) {
            const { shop } = data.settings;

            const shopLogo = document.getElementById('shopLogo');
            const shopName = document.getElementById('shopName');
            const shopAddress = document.getElementById('shopAddress');
            const shopPhone = document.getElementById('shopPhone');
            const shopEmail = document.getElementById('shopEmail');
            const shopWebsite = document.getElementById('shopWebsite');
            const shopFacebook = document.getElementById('shopFacebook');
            const shopDesc = document.getElementById('shopDesc');

            if (shopLogo) {
                shopLogo.value = shop.logo || '';
                if (shop.logo) {
                    // Auto preview logo if exists
                    const logoPreview = document.getElementById('logoPreview');
                    if (logoPreview) {
                        logoPreview.innerHTML = `<img src="${shop.logo}" alt="Logo" class="w-full h-full object-contain">`;
                    }
                }
            }
            if (shopName) shopName.value = shop.name || 'Coffee House';
            if (shopAddress) shopAddress.value = shop.address || '123 Nguyễn Huệ, Q.1, TP.HCM';
            if (shopPhone) shopPhone.value = shop.phone || '0901234567';
            if (shopEmail) shopEmail.value = shop.email || 'info@coffeehouse.vn';
            if (shopWebsite) shopWebsite.value = shop.website || 'https://coffeehouse.vn';
            if (shopFacebook) shopFacebook.value = shop.facebook || 'https://facebook.com/coffeehouse';
            if (shopDesc) shopDesc.value = shop.description || 'Cà phê ngon, không gian đẹp, phục vụ tận tâm';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

/**
 * Save shop information
 */
async function saveShopInfo(e) {
    e.preventDefault();

    console.log('💾 Saving shop info...');

    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    console.log('🔑 Token:', token ? 'Found' : 'Not found');

    const settingsData = {
        shop: {
            logo: document.getElementById('shopLogo')?.value || '',
            name: document.getElementById('shopName')?.value || '',
            address: document.getElementById('shopAddress')?.value || '',
            phone: document.getElementById('shopPhone')?.value || '',
            email: document.getElementById('shopEmail')?.value || '',
            website: document.getElementById('shopWebsite')?.value || '',
            facebook: document.getElementById('shopFacebook')?.value || '',
            description: document.getElementById('shopDesc')?.value || ''
        }
    };

    console.log('📤 Sending data:', settingsData);

    try {
        const response = await fetch('http://localhost:3000/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settingsData)
        });

        console.log('📥 Response status:', response.status);

        const data = await response.json();
        console.log('📥 Response data:', data);

        if (data.success) {
            showNotification('Đã lưu thông tin cửa hàng', 'success');
            console.log('✅ Settings saved successfully');
        } else {
            showNotification('Lỗi: ' + (data.error || 'Không thể lưu'), 'error');
            console.error('❌ Save failed:', data);
        }
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        showNotification('Lỗi kết nối server', 'error');
    }
}

/**
 * Save operating hours
 */
function saveOperatingHours(e) {
    e.preventDefault();
    showNotification('Đã lưu giờ mở cửa', 'success');
}

/**
 * Save payment methods
 */
function savePaymentMethods() {
    showNotification('Đã lưu phương thức thanh toán', 'success');
}

/**
 * Save notification settings
 */
function saveNotificationSettings() {
    showNotification('Đã lưu cài đặt thông báo', 'success');
}

/**
 * Backup data
 */
async function backupData() {
    try {
        showNotification('Đang sao lưu dữ liệu...', 'info');

        // Simulate backup process
        await new Promise(resolve => setTimeout(resolve, 2000));

        const backupDate = new Date().toLocaleString('vi-VN');
        localStorage.setItem('lastBackup', backupDate);

        // Update last backup display
        const lastBackupEl = document.querySelector('#backupSection .text-2xl');
        if (lastBackupEl) {
            lastBackupEl.textContent = backupDate;
        }

        showNotification('Sao lưu dữ liệu thành công', 'success');
    } catch (error) {
        console.error('Backup error:', error);
        showNotification('Lỗi sao lưu dữ liệu', 'error');
    }
}

/**
 * Save backup settings
 */
function saveBackupSettings() {
    const scheduleSelect = document.querySelector('#backupSection select');
    if (scheduleSelect) {
        localStorage.setItem('backupSchedule', scheduleSelect.value);
        showNotification('Đã lưu cài đặt sao lưu', 'success');
    }
}

/**
 * Initialize settings page
 */
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // Handle file input change
    const logoFileInput = document.getElementById('logoFile');
    if (logoFileInput) {
        logoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadLogoFile(file);
            }
        });
    }

    // Setup section navigation buttons
    const sectionButtons = document.querySelectorAll('[data-section]');
    sectionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            if (section) showSection(section);
        });
    });

    // Shop form
    const shopForm = document.getElementById('shopForm');
    if (shopForm) {
        shopForm.addEventListener('submit', saveShopInfo);
    }

    // Hours form
    const hoursForm = document.getElementById('hoursForm');
    if (hoursForm) {
        hoursForm.addEventListener('submit', saveOperatingHours);
    }

    // Payment methods save button
    const paymentBtn = document.querySelector('#paymentSection button');
    if (paymentBtn) {
        paymentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            savePaymentMethods();
        });
    }

    // Notification settings save button
    const notifBtn = document.querySelector('#notificationSection button');
    if (notifBtn) {
        notifBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveNotificationSettings();
        });
    }

    // Backup buttons
    const backupNowBtn = document.querySelector('#backupSection .bg-green-600');
    if (backupNowBtn) {
        backupNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            backupData();
        });
    }

    const backupSettingsBtn = document.querySelector('#backupSection .bg-amber-600');
    if (backupSettingsBtn) {
        backupSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveBackupSettings();
        });
    }

    // Load last backup date
    const lastBackup = localStorage.getItem('lastBackup');
    if (lastBackup) {
        const lastBackupEl = document.querySelector('#backupSection .text-2xl');
        if (lastBackupEl) {
            lastBackupEl.textContent = lastBackup;
        }
    }

    // Load backup schedule
    const backupSchedule = localStorage.getItem('backupSchedule');
    if (backupSchedule) {
        const scheduleSelect = document.querySelector('#backupSection select');
        if (scheduleSelect) {
            scheduleSelect.value = backupSchedule;
        }
    }
});
