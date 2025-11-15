// Promotion page JavaScript - Enhanced Version
let allPromotions = [];
let filteredPromotions = [];
let currentFilter = 'all';

// Load promotions from API
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🎁 Initializing promotions page...');
    await loadPromotions();
});

// Load promotions from API
async function loadPromotions() {
    const loading = document.getElementById('loading');
    const container = document.getElementById('promotionsList');
    const noPromotions = document.getElementById('noPromotions');

    try {
        console.log('📥 Loading promotions...');

        if (loading) loading.classList.remove('hidden');
        if (container) container.classList.add('hidden');
        if (noPromotions) noPromotions.classList.add('hidden');

        const promotions = await fetchPromotions();

        console.log('✅ Loaded promotions:', promotions);

        allPromotions = promotions || [];
        filteredPromotions = [...allPromotions];

        if (loading) loading.classList.add('hidden');

        if (allPromotions.length === 0) {
            if (noPromotions) noPromotions.classList.remove('hidden');
            if (container) container.classList.add('hidden');
            return;
        }

        if (container) container.classList.remove('hidden');

        // Update statistics
        updateStatistics();

        // Display promotions
        displayPromotions(filteredPromotions);

    } catch (error) {
        console.error('❌ Error loading promotions:', error);
        if (loading) loading.classList.add('hidden');
        showError('Không thể tải danh sách khuyến mãi');
    }
}

// Update statistics
function updateStatistics() {
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    const active = allPromotions.filter(p => p.active && new Date(p.endDate) >= now).length;
    const total = allPromotions.length;
    const expiring = allPromotions.filter(p => {
        const endDate = new Date(p.endDate);
        return p.active && endDate >= now && (endDate - now) <= threeDays;
    }).length;

    let maxDiscount = 0;
    allPromotions.forEach(p => {
        if (p.discountType === 'percentage' && p.discountValue > maxDiscount) {
            maxDiscount = p.discountValue;
        }
    });

    const activeEl = document.getElementById('activeCount');
    const totalEl = document.getElementById('totalCount');
    const expiringEl = document.getElementById('expiringCount');
    const maxDiscountEl = document.getElementById('maxDiscount');

    if (activeEl) activeEl.textContent = active;
    if (totalEl) totalEl.textContent = total;
    if (expiringEl) expiringEl.textContent = expiring;
    if (maxDiscountEl) maxDiscountEl.textContent = maxDiscount > 0 ? `${maxDiscount}%` : '0%';
}

// Display promotions
function displayPromotions(promotions) {
    const container = document.getElementById('promotionsList');

    if (!container) return;

    if (!promotions || promotions.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 bg-white rounded-xl shadow-md">
                <i class="fas fa-filter text-6xl text-gray-300 mb-4"></i>
                <p class="text-xl text-gray-600">Không tìm thấy khuyến mãi phù hợp</p>
            </div>
        `;
        return;
    }

    container.innerHTML = promotions.map(promo => createPromotionCard(promo)).join('');
}

// Create promotion card
function createPromotionCard(promo) {
    const now = new Date();
    const isExpired = new Date(promo.endDate) < now;
    const isOutOfUsage = promo.usageLimit && promo.usageCount >= promo.usageLimit;
    const isActive = promo.active !== false &&
        new Date(promo.startDate) <= now &&
        !isExpired &&
        !isOutOfUsage;

    const isExpiring = isActive && isExpiringSoon(promo.endDate);

    const discountText = promo.discountType === 'percentage'
        ? `${promo.discountValue}%`
        : `${formatCurrency(promo.discountValue)}`;

    let statusClass, statusText;
    if (isOutOfUsage) {
        statusClass = 'bg-red-100 text-red-800';
        statusText = 'Hết lượt';
    } else if (isExpired) {
        statusClass = 'bg-gray-100 text-gray-800';
        statusText = 'Hết hạn';
    } else if (isActive) {
        statusClass = 'bg-green-100 text-green-800';
        statusText = 'Đang áp dụng';
    } else {
        statusClass = 'bg-gray-100 text-gray-800';
        statusText = 'Không khả dụng';
    }

    const expiringBadge = isExpiring ? `
        <span class="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
            <i class="fas fa-clock mr-1"></i>Sắp hết hạn
        </span>
    ` : '';

    return `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 ${!isActive ? 'opacity-60' : ''}">
            <div class="relative bg-gradient-to-r ${isActive ? 'from-yellow-400 to-orange-500' : 'from-gray-400 to-gray-500'} p-6">
                ${expiringBadge}
                <div class="text-center text-white">
                    <div class="text-5xl font-bold mb-2">${discountText}</div>
                    <div class="text-lg font-semibold uppercase tracking-wider">OFF</div>
                </div>
            </div>
            
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-3">${promo.name}</h3>
                <p class="text-gray-600 mb-4 line-clamp-2">${promo.description || 'Không có mô tả'}</p>
                
                <div class="space-y-2 mb-4">
                    <div class="flex items-center text-sm text-gray-700">
                        <i class="fas fa-calendar-alt w-5 mr-2 text-blue-500"></i>
                        <span>Từ ${formatDate(promo.startDate)} đến ${formatDate(promo.endDate)}</span>
                    </div>
                    
                    ${promo.minOrderAmount ? `
                    <div class="flex items-center text-sm text-gray-700">
                        <i class="fas fa-shopping-cart w-5 mr-2 text-green-500"></i>
                        <span>Đơn tối thiểu: ${formatCurrency(promo.minOrderAmount)}</span>
                    </div>
                    ` : ''}
                    
                    ${promo.maxDiscount && promo.discountType === 'percentage' ? `
                    <div class="flex items-center text-sm text-gray-700">
                        <i class="fas fa-tag w-5 mr-2 text-red-500"></i>
                        <span>Giảm tối đa: ${formatCurrency(promo.maxDiscount)}</span>
                    </div>
                    ` : ''}
                    
                    ${promo.usageLimit ? `
                    <div class="flex items-center text-sm ${isOutOfUsage ? 'text-red-600 font-semibold' : 'text-gray-700'}">
                        <i class="fas fa-users w-5 mr-2 ${isOutOfUsage ? 'text-red-500' : 'text-purple-500'}"></i>
                        <span>Đã dùng: ${promo.usageCount || 0}/${promo.usageLimit} ${isOutOfUsage ? '(Hết lượt)' : ''}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="flex items-center justify-between mb-4">
                    <span class="px-3 py-1 ${statusClass} rounded-full text-sm font-semibold">
                        ${statusText}
                    </span>
                    ${isExpiring ? `
                    <span class="text-sm text-red-600 font-semibold">
                        <i class="fas fa-hourglass-half mr-1"></i>
                        ${getTimeRemaining(promo.endDate)}
                    </span>
                    ` : ''}
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <p class="text-xs text-gray-600 mb-1">Mã khuyến mãi:</p>
                            <p class="text-lg font-bold text-gray-800 font-mono tracking-wider">${promo.code}</p>
                        </div>
                        <button onclick="copyCode('${promo.code}')" 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center space-x-2">
                            <i class="fas fa-copy"></i>
                            <span>Sao chép</span>
                        </button>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="showPromotionDetail('${promo._id}')" 
                            class="flex-1 bg-white border-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50 px-4 py-2 rounded-lg font-semibold transition duration-200">
                        <i class="fas fa-info-circle mr-2"></i>Chi tiết
                    </button>
                    <button onclick="applyPromotion('${promo.code}')" 
                            class="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${!isActive ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart mr-2"></i>Áp dụng
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Check if promotion is expiring soon (within 3 days)
function isExpiringSoon(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return end > now && (end - now) <= threeDays;
}

// Get time remaining
function getTimeRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return 'Đã hết hạn';

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) return `Còn ${days} ngày`;
    if (hours > 0) return `Còn ${hours} giờ`;
    return 'Sắp hết hạn';
}

// Search promotions
function searchPromotions(query) {
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
        filteredPromotions = [...allPromotions];
    } else {
        filteredPromotions = allPromotions.filter(promo =>
            promo.code.toLowerCase().includes(searchTerm) ||
            promo.name.toLowerCase().includes(searchTerm) ||
            (promo.description && promo.description.toLowerCase().includes(searchTerm))
        );
    }

    // Apply current filter
    applyCurrentFilter();
}

// Filter promotions
function filterPromotions(type) {
    currentFilter = type;

    // Update button states
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${type}"]`)?.classList.add('active');

    applyCurrentFilter();
}

// Apply current filter to filtered promotions
function applyCurrentFilter() {
    const now = new Date();
    let results = [...filteredPromotions];

    switch (currentFilter) {
        case 'active':
            results = results.filter(p =>
                p.active && new Date(p.endDate) >= now
            );
            break;
        case 'expired':
            results = results.filter(p =>
                !p.active || new Date(p.endDate) < now
            );
            break;
        case 'high-discount':
            results = results.filter(p => {
                if (p.discountType === 'percentage') {
                    return p.discountValue >= 30;
                } else {
                    return p.discountValue >= 50000;
                }
            });
            break;
        case 'all':
        default:
            // Show all filtered promotions
            break;
    }

    displayPromotions(results);
}

// Show promotion detail modal
function showPromotionDetail(promoId) {
    const promo = allPromotions.find(p => p._id === promoId);
    if (!promo) return;

    const isActive = promo.active && new Date(promo.endDate) >= new Date();

    const modalContent = `
        <div class="mb-6">
            <h2 class="text-3xl font-bold text-gray-800 mb-2">${promo.name}</h2>
            <span class="px-4 py-2 ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} rounded-full text-sm font-semibold">
                ${isActive ? 'Đang áp dụng' : 'Hết hạn'}
            </span>
        </div>
        
        <div class="bg-gradient-to-r ${isActive ? 'from-yellow-400 to-orange-500' : 'from-gray-400 to-gray-500'} rounded-xl p-8 text-center text-white mb-6">
            <div class="text-6xl font-bold mb-2">
                ${promo.discountType === 'percentage' ? `${promo.discountValue}%` : formatCurrency(promo.discountValue)}
            </div>
            <div class="text-2xl font-semibold uppercase tracking-wider">GIẢM GIÁ</div>
        </div>
        
        <div class="space-y-4 mb-6">
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-semibold text-gray-700 mb-2"><i class="fas fa-align-left mr-2 text-blue-500"></i>Mô tả</h3>
                <p class="text-gray-600">${promo.description || 'Không có mô tả chi tiết'}</p>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-semibold text-gray-700 mb-2"><i class="fas fa-calendar-alt mr-2 text-green-500"></i>Thời gian áp dụng</h3>
                <p class="text-gray-600">Từ ${formatDate(promo.startDate)} đến ${formatDate(promo.endDate)}</p>
                ${isExpiringSoon(promo.endDate) ? `
                <p class="text-red-600 font-semibold mt-2">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    ${getTimeRemaining(promo.endDate)}
                </p>
                ` : ''}
            </div>
            
            ${promo.minOrderAmount ? `
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-semibold text-gray-700 mb-2"><i class="fas fa-shopping-cart mr-2 text-purple-500"></i>Đơn hàng tối thiểu</h3>
                <p class="text-gray-600">${formatCurrency(promo.minOrderAmount)}</p>
            </div>
            ` : ''}
            
            ${promo.maxDiscount && promo.discountType === 'percentage' ? `
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-semibold text-gray-700 mb-2"><i class="fas fa-tag mr-2 text-red-500"></i>Giảm giá tối đa</h3>
                <p class="text-gray-600">${formatCurrency(promo.maxDiscount)}</p>
            </div>
            ` : ''}
            
            <div class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                <h3 class="font-semibold text-gray-700 mb-3"><i class="fas fa-ticket-alt mr-2 text-yellow-600"></i>Mã khuyến mãi</h3>
                <div class="flex items-center justify-between">
                    <span class="text-2xl font-bold text-gray-800 font-mono tracking-wider">${promo.code}</span>
                    <button onclick="copyCode('${promo.code}')" 
                            class="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200">
                        <i class="fas fa-copy mr-2"></i>Sao chép
                    </button>
                </div>
            </div>
        </div>
        
        <div class="flex gap-3">
            <button onclick="closePromotionModal()" 
                    class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition duration-200">
                Đóng
            </button>
            <button onclick="applyPromotion('${promo.code}')" 
                    class="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${!isActive ? 'disabled' : ''}>
                <i class="fas fa-shopping-cart mr-2"></i>Áp dụng ngay
            </button>
        </div>
    `;

    document.getElementById('modalContent').innerHTML = modalContent;
    document.getElementById('promotionModal').classList.remove('hidden');
}

// Close promotion modal
function closePromotionModal() {
    document.getElementById('promotionModal').classList.add('hidden');
}

// Copy promotion code
function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showSuccess(`Đã sao chép mã: ${code}`);
    }).catch(err => {
        console.error('❌ Copy failed:', err);
        showError('Không thể sao chép mã');
    });
}

// Apply promotion
function applyPromotion(code) {
    // Save code to localStorage and redirect to cart
    localStorage.setItem('appliedPromoCode', code);
    showSuccess(`Đã áp dụng mã: ${code}`);

    setTimeout(() => {
        window.location.href = '/cart.html';
    }, 1000);
}

// Helper functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in';
    toast.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-check-circle text-2xl"></i>
            <span class="font-semibold">${message}</span>
        </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in';
    toast.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-exclamation-circle text-2xl"></i>
            <span class="font-semibold">${message}</span>
        </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Fetch promotions from API
async function fetchPromotions() {
    try {
        // Check if API_URL is defined, otherwise use default
        const apiUrl = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:3000';

        // Use /active endpoint for public access (no authentication required)
        const response = await fetch(`${apiUrl}/api/promotions/active`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // If unauthorized or other error, fallback to mock data
        if (!response.ok) {
            console.log(`⚠️ API returned ${response.status}, using mock data`);
            return getMockPromotions();
        }

        const data = await response.json();
        return data.promotions || data;
    } catch (error) {
        console.log('⚠️ API not available, using mock data:', error.message);

        // Return mock data for development
        return getMockPromotions();
    }
}

// Mock promotions for development
function getMockPromotions() {
    return [
        {
            _id: '1',
            code: 'CAFE50K',
            name: 'Giảm 50K cho đơn đầu',
            description: 'Giảm 50.000đ cho đơn hàng đầu tiên từ 200.000đ',
            discountType: 'fixed',
            discountValue: 50000,
            minOrderAmount: 200000,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            active: true
        },
        {
            _id: '2',
            code: 'MORNING30',
            name: 'Giảm 30% buổi sáng',
            description: 'Giảm 30% cho đơn hàng từ 6h-10h sáng',
            discountType: 'percentage',
            discountValue: 30,
            maxDiscount: 100000,
            minOrderAmount: 100000,
            startDate: new Date('2024-01-01'),
            endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            active: true
        },
        {
            _id: '3',
            code: 'WEEKEND20',
            name: 'Giảm 20% cuối tuần',
            description: 'Giảm 20% cho đơn hàng cuối tuần',
            discountType: 'percentage',
            discountValue: 20,
            maxDiscount: 50000,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            active: true
        },
        {
            _id: '4',
            code: 'OLDCODE',
            name: 'Mã đã hết hạn',
            description: 'Chương trình khuyến mãi đã kết thúc',
            discountType: 'percentage',
            discountValue: 15,
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            active: false
        }
    ];
}
