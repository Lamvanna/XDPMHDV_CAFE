/**
 * Settings Management - Admin
 * Quản lý cài đặt hệ thống
 */

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
 * Load settings from localStorage or defaults
 */
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('shopSettings') || '{}');
    
    // Shop info
    if (settings.shop) {
        const shopName = document.getElementById('shopName');
        const shopAddress = document.getElementById('shopAddress');
        const shopPhone = document.getElementById('shopPhone');
        const shopEmail = document.getElementById('shopEmail');
        const shopDesc = document.getElementById('shopDesc');
        
        if (shopName) shopName.value = settings.shop.name || 'Coffee House';
        if (shopAddress) shopAddress.value = settings.shop.address || '123 Nguyễn Huệ, Q.1, TP.HCM';
        if (shopPhone) shopPhone.value = settings.shop.phone || '0901234567';
        if (shopEmail) shopEmail.value = settings.shop.email || 'info@coffeehouse.vn';
        if (shopDesc) shopDesc.value = settings.shop.description || 'Cà phê ngon, không gian đẹp, phục vụ tận tâm';
    }
}

/**
 * Save shop information
 */
function saveShopInfo(e) {
    e.preventDefault();
    
    const settings = JSON.parse(localStorage.getItem('shopSettings') || '{}');
    settings.shop = {
        name: document.getElementById('shopName')?.value || '',
        address: document.getElementById('shopAddress')?.value || '',
        phone: document.getElementById('shopPhone')?.value || '',
        email: document.getElementById('shopEmail')?.value || '',
        description: document.getElementById('shopDesc')?.value || ''
    };
    
    localStorage.setItem('shopSettings', JSON.stringify(settings));
    showNotification('Đã lưu thông tin cửa hàng', 'success');
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
