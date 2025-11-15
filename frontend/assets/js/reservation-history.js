// Reservation History JavaScript - Enhanced Version
let allReservations = [];
let currentFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing reservation history page...');
    
    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load reservations
    await loadReservations();
    
    console.log('✅ Reservation history page initialized');
});

// Load user's reservations
async function loadReservations() {
    const loadingEl = document.getElementById('loading');
    const listEl = document.getElementById('reservationsList');
    const noReservationsEl = document.getElementById('noReservations');
    const statsSection = document.getElementById('statsSection');
    
    try {
        console.log('📥 Loading reservations...');
        
        const response = await fetchAPI('/tables/user/reservations');
        
        if (!response.success) {
            throw new Error(response.error || 'Failed to load reservations');
        }
        
        allReservations = response.reservations || [];
        
        // Hide loading
        if (loadingEl) loadingEl.classList.add('hidden');
        
        if (allReservations.length === 0) {
            if (noReservationsEl) noReservationsEl.classList.remove('hidden');
            if (listEl) listEl.classList.add('hidden');
            if (statsSection) statsSection.classList.add('hidden');
            return;
        }
        
        // Show statistics
        if (statsSection) {
            statsSection.classList.remove('hidden');
            updateStatistics();
        }
        
        // Show and render list
        if (listEl) {
            listEl.classList.remove('hidden');
            renderReservations();
        }
        
        console.log('✅ Loaded', allReservations.length, 'reservations');
    } catch (error) {
        console.error('❌ Error loading reservations:', error);
        if (loadingEl) loadingEl.classList.add('hidden');
        if (noReservationsEl) {
            noReservationsEl.classList.remove('hidden');
            noReservationsEl.innerHTML = `
                <i class="fas fa-exclamation-circle text-7xl text-red-300 mb-6"></i>
                <p class="text-red-600 text-xl mb-2">Không thể tải lịch sử đặt bàn</p>
                <p class="text-gray-500 mb-6">${error.message}</p>
                <button onclick="location.reload()" class="bg-coffee text-white px-8 py-3 rounded-lg font-semibold hover:bg-coffee-dark transition-colors">
                    <i class="fas fa-redo mr-2"></i>Thử lại
                </button>
            `;
        }
    }
}

// Update statistics
function updateStatistics() {
    const total = allReservations.length;
    const pending = allReservations.filter(r => r.status === 'pending').length;
    const confirmed = allReservations.filter(r => r.status === 'confirmed').length;
    const completed = allReservations.filter(r => r.status === 'completed').length;
    
    const totalEl = document.getElementById('totalReservations');
    const pendingEl = document.getElementById('pendingCount');
    const confirmedEl = document.getElementById('confirmedCount');
    const completedEl = document.getElementById('completedCount');
    
    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (confirmedEl) confirmedEl.textContent = confirmed;
    if (completedEl) completedEl.textContent = completed;
}

// Filter reservations
function filterReservations(filter) {
    currentFilter = filter;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Re-render list
    renderReservations();
}

// Render reservations list
function renderReservations() {
    const listEl = document.getElementById('reservationsList');
    if (!listEl) return;
    
    // Filter reservations
    const filtered = currentFilter === 'all' 
        ? allReservations 
        : allReservations.filter(r => r.status === currentFilter);
    
    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-12 bg-white rounded-2xl shadow-md">
                <i class="fas fa-filter text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-600 text-lg">Không có đơn đặt bàn nào với bộ lọc này</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = filtered.map(reservation => {
        const statusInfo = getStatusInfo(reservation.status);
        const tableImage = getTableImage(reservation.tableImage);
        const reservationDate = new Date(reservation.date);
        const isUpcoming = reservationDate > new Date();
        
        // Get table ID - could be in different places depending on API response
        const tableId = reservation.tableId || reservation.table?._id || reservation.table?.id || '';
        
        return `
            <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer transform hover:scale-[1.02]" 
                 onclick="showReservationDetail('${tableId}', '${reservation._id}')">
                <div class="flex flex-col md:flex-row">
                    <!-- Table Image -->
                    <div class="md:w-48 h-48 md:h-auto">
                        <img src="${tableImage}" 
                             alt="Table ${reservation.tableNumber}" 
                             class="w-full h-full object-cover"
                             onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80'">
                    </div>
                    
                    <!-- Reservation Info -->
                    <div class="flex-1 p-6">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <h3 class="text-2xl font-bold text-coffee mb-2">
                                    <i class="fas fa-chair mr-2"></i>Bàn số ${reservation.tableNumber}
                                </h3>
                                <p class="text-gray-600">
                                    <i class="fas fa-map-marker-alt mr-2"></i>${reservation.tableLocation || 'Khu vực chính'}
                                </p>
                            </div>
                            <span class="px-4 py-2 rounded-full text-sm font-semibold ${statusInfo.bgClass} ${statusInfo.textClass}">
                                <i class="fas ${statusInfo.icon} mr-1"></i>${statusInfo.text}
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div class="flex items-center text-gray-700">
                                <i class="fas fa-calendar text-coffee mr-2"></i>
                                <span>${formatDate(reservation.date)}</span>
                            </div>
                            <div class="flex items-center text-gray-700">
                                <i class="fas fa-clock text-coffee mr-2"></i>
                                <span>${reservation.time}</span>
                            </div>
                            <div class="flex items-center text-gray-700">
                                <i class="fas fa-users text-coffee mr-2"></i>
                                <span>${reservation.guests} người</span>
                            </div>
                            <div class="flex items-center text-gray-700">
                                <i class="fas fa-hourglass-half text-coffee mr-2"></i>
                                <span>${reservation.duration || 120} phút</span>
                            </div>
                        </div>
                        
                        ${reservation.notes ? `
                            <div class="bg-gray-50 rounded-lg p-3 mb-4">
                                <p class="text-sm text-gray-600">
                                    <i class="fas fa-sticky-note text-coffee mr-2"></i>
                                    ${reservation.notes}
                                </p>
                            </div>
                        ` : ''}
                        
                        <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div class="text-sm text-gray-500">
                                <i class="fas fa-user mr-2"></i>${reservation.customerName}
                                <span class="mx-2">•</span>
                                <i class="fas fa-phone mr-2"></i>${reservation.phone}
                            </div>
                            <button class="text-coffee hover:text-coffee-dark font-semibold">
                                Xem chi tiết <i class="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Show reservation detail modal
async function showReservationDetail(tableId, reservationId) {
    console.log('🔍 Opening reservation detail:', { tableId, reservationId });
    
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    if (!modal || !modalContent) {
        console.error('❌ Modal elements not found');
        return;
    }
    
    // Show modal with loading
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modalContent.innerHTML = `
        <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-coffee mb-4"></i>
            <p class="text-gray-600">Đang tải thông tin...</p>
        </div>
    `;
    
    try {
        console.log('📡 Fetching reservation detail from API...');
        const response = await fetchAPI(`/tables/${tableId}/reservations/${reservationId}`);
        console.log('📥 API Response:', response);
        
        if (!response.success) {
            throw new Error(response.error || 'Failed to load reservation detail');
        }
        
        const reservation = response.reservation;
        const table = reservation.table;
        const statusInfo = getStatusInfo(reservation.status);
        const tableImage = getTableImage(table.image);
        
        modalContent.innerHTML = `
            <div class="space-y-6">
                <!-- Table Image & Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div class="rounded-xl overflow-hidden shadow-lg">
                            <img src="${tableImage}" 
                                 alt="Table ${table.number}" 
                                 class="w-full h-64 object-cover"
                                 onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'">
                        </div>
                        
                        <!-- Table Diagram -->
                        <div class="bg-gray-50 rounded-xl p-6">
                            <h3 class="font-bold text-gray-800 mb-4">
                                <i class="fas fa-map-marked-alt mr-2"></i>Sơ đồ vị trí bàn
                            </h3>
                            <div class="relative bg-white rounded-lg p-8 border-2 border-dashed border-gray-300">
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <div class="text-center">
                                        <div class="w-20 h-20 bg-coffee rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span class="text-white text-2xl font-bold">${table.number}</span>
                                        </div>
                                        <p class="text-sm text-gray-600">${table.location || 'Khu vực chính'}</p>
                                        <p class="text-xs text-gray-500 mt-1">Sức chứa: ${table.capacity} người</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <!-- Status Badge -->
                        <div class="text-center">
                            <span class="inline-block px-6 py-3 rounded-full text-lg font-bold ${statusInfo.bgClass} ${statusInfo.textClass}">
                                <i class="fas ${statusInfo.icon} mr-2"></i>${statusInfo.text}
                            </span>
                        </div>
                        
                        <!-- Customer Info -->
                        <div class="bg-gradient-to-br from-coffee to-coffee-dark text-white rounded-xl p-6">
                            <h3 class="font-bold text-lg mb-4">
                                <i class="fas fa-user-circle mr-2"></i>Thông tin khách hàng
                            </h3>
                            <div class="space-y-3">
                                <div class="flex items-center">
                                    <i class="fas fa-user w-6"></i>
                                    <span>${reservation.customerName}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-phone w-6"></i>
                                    <span>${reservation.phone}</span>
                                </div>
                                ${reservation.email ? `
                                    <div class="flex items-center">
                                        <i class="fas fa-envelope w-6"></i>
                                        <span>${reservation.email}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Reservation Details -->
                        <div class="bg-blue-50 rounded-xl p-6">
                            <h3 class="font-bold text-gray-800 mb-4">
                                <i class="fas fa-info-circle mr-2"></i>Chi tiết đặt bàn
                            </h3>
                            <div class="space-y-3 text-gray-700">
                                <div class="flex items-center justify-between">
                                    <span class="flex items-center">
                                        <i class="fas fa-calendar text-blue-600 w-6"></i>
                                        Ngày đặt
                                    </span>
                                    <span class="font-semibold">${formatDate(reservation.date)}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="flex items-center">
                                        <i class="fas fa-clock text-blue-600 w-6"></i>
                                        Giờ
                                    </span>
                                    <span class="font-semibold">${reservation.time}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="flex items-center">
                                        <i class="fas fa-users text-blue-600 w-6"></i>
                                        Số người
                                    </span>
                                    <span class="font-semibold">${reservation.guests} người</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="flex items-center">
                                        <i class="fas fa-hourglass-half text-blue-600 w-6"></i>
                                        Thời gian
                                    </span>
                                    <span class="font-semibold">${reservation.duration || 120} phút</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Special Notes -->
                        ${reservation.notes ? `
                            <div class="bg-yellow-50 rounded-xl p-6">
                                <h3 class="font-bold text-gray-800 mb-3">
                                    <i class="fas fa-sticky-note mr-2"></i>Yêu cầu đặc biệt
                                </h3>
                                <p class="text-gray-700">${reservation.notes}</p>
                            </div>
                        ` : ''}
                        
                        <!-- Reservation Timeline -->
                        <div class="bg-white rounded-xl p-6 border-2 border-gray-200">
                            <h3 class="font-bold text-gray-800 mb-6">
                                <i class="fas fa-timeline mr-2"></i>Lịch sử trạng thái
                            </h3>
                            <div class="relative">
                                <!-- Timeline Line -->
                                <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                
                                <!-- Timeline Items -->
                                <div class="space-y-6">
                                    <!-- Created -->
                                    <div class="relative flex items-start">
                                        <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center z-10">
                                            <i class="fas fa-plus text-white text-xs"></i>
                                        </div>
                                        <div class="ml-4 flex-1">
                                            <p class="font-semibold text-gray-800">Đặt bàn thành công</p>
                                            <p class="text-sm text-gray-500">${formatDate(reservation.createdAt || reservation.date)}</p>
                                        </div>
                                    </div>
                                    
                                    ${reservation.status === 'confirmed' || reservation.status === 'completed' ? `
                                        <!-- Confirmed -->
                                        <div class="relative flex items-start">
                                            <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
                                                <i class="fas fa-check text-white text-xs"></i>
                                            </div>
                                            <div class="ml-4 flex-1">
                                                <p class="font-semibold text-gray-800">Đã xác nhận</p>
                                                <p class="text-sm text-gray-500">Quán đã xác nhận đặt bàn</p>
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${reservation.status === 'completed' ? `
                                        <!-- Completed -->
                                        <div class="relative flex items-start">
                                            <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center z-10">
                                                <i class="fas fa-check-double text-white text-xs"></i>
                                            </div>
                                            <div class="ml-4 flex-1">
                                                <p class="font-semibold text-gray-800">Hoàn thành</p>
                                                <p class="text-sm text-gray-500">Cảm ơn bạn đã sử dụng dịch vụ</p>
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${reservation.status === 'cancelled' ? `
                                        <!-- Cancelled -->
                                        <div class="relative flex items-start">
                                            <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center z-10">
                                                <i class="fas fa-times text-white text-xs"></i>
                                            </div>
                                            <div class="ml-4 flex-1">
                                                <p class="font-semibold text-gray-800">Đã hủy</p>
                                                <p class="text-sm text-gray-500">Đặt bàn đã được hủy</p>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="grid grid-cols-2 gap-3 mb-6">
                    <button onclick="printReservation('${reservationId}')" 
                            class="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-print"></i>
                        <span class="text-sm font-semibold">In phiếu</span>
                    </button>
                    
                    <button onclick="downloadReservation('${reservationId}')" 
                            class="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors">
                        <i class="fas fa-download"></i>
                        <span class="text-sm font-semibold">Tải xuống</span>
                    </button>
                    
                    <button onclick="shareReservation('${reservationId}')" 
                            class="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors">
                        <i class="fas fa-share-alt"></i>
                        <span class="text-sm font-semibold">Chia sẻ</span>
                    </button>
                    
                    ${reservation.status === 'completed' && !reservation.rating ? `
                        <button onclick="showRatingModal('${reservationId}')" 
                                class="flex items-center justify-center gap-2 bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition-colors">
                            <i class="fas fa-star"></i>
                            <span class="text-sm font-semibold">Đánh giá</span>
                        </button>
                    ` : reservation.rating ? `
                        <button disabled
                                class="flex items-center justify-center gap-2 bg-gray-300 text-gray-600 py-3 rounded-lg cursor-not-allowed">
                            <i class="fas fa-star"></i>
                            <span class="text-sm font-semibold">Đã đánh giá</span>
                        </button>
                    ` : ''}
                </div>
                
                <!-- Action Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                    ${reservation.status === 'pending' || reservation.status === 'confirmed' ? `
                        <button onclick="cancelReservation('${tableId}', '${reservationId}')" 
                                class="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                            <i class="fas fa-times-circle mr-2"></i>Hủy đặt bàn
                        </button>
                    ` : ''}
                    <button onclick="closeDetailModal()" 
                            class="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        <i class="fas fa-times mr-2"></i>Đóng
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading reservation detail:', error);
        modalContent.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
                <p class="text-red-600 text-xl mb-2">Không thể tải thông tin</p>
                <p class="text-gray-500 mb-6">${error.message}</p>
                <button onclick="closeDetailModal()" class="bg-coffee text-white px-6 py-3 rounded-lg font-semibold hover:bg-coffee-dark transition-colors">
                    Đóng
                </button>
            </div>
        `;
    }
}

// Close detail modal
function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Cancel reservation
async function cancelReservation(tableId, reservationId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đặt bàn này không?')) {
        return;
    }
    
    try {
        console.log('🚫 Cancelling reservation:', { tableId, reservationId });
        
        const response = await fetchAPI(`/tables/${tableId}/reservations/${reservationId}`, {
            method: 'DELETE'
        });
        
        if (!response.success) {
            throw new Error(response.error || 'Failed to cancel reservation');
        }
        
        showNotification('Đã hủy đặt bàn thành công', 'success');
        
        // Update local data instead of reloading
        const reservation = allReservations.find(r => r._id === reservationId);
        if (reservation) {
            reservation.status = 'cancelled';
        }
        
        // Close modal and re-render
        closeDetailModal();
        
        // Update statistics and re-render list
        updateStatistics();
        renderReservations();
        
    } catch (error) {
        console.error('❌ Error cancelling reservation:', error);
        showNotification('Không thể hủy đặt bàn: ' + error.message, 'error');
    }
}

// Get status info
function getStatusInfo(status) {
    const statusMap = {
        'pending': {
            text: 'Chờ xác nhận',
            icon: 'fa-clock',
            bgClass: 'bg-yellow-100',
            textClass: 'text-yellow-800'
        },
        'confirmed': {
            text: 'Đã xác nhận',
            icon: 'fa-check-circle',
            bgClass: 'bg-green-100',
            textClass: 'text-green-800'
        },
        'completed': {
            text: 'Hoàn thành',
            icon: 'fa-check-double',
            bgClass: 'bg-purple-100',
            textClass: 'text-purple-800'
        },
        'cancelled': {
            text: 'Đã hủy',
            icon: 'fa-times-circle',
            bgClass: 'bg-red-100',
            textClass: 'text-red-800'
        }
    };
    
    return statusMap[status] || statusMap['pending'];
}

// Get table image
function getTableImage(image) {
    if (!image) {
        return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80';
    }
    
    if (image.startsWith('http')) {
        return image;
    }
    
    return `http://localhost:3000${image}`;
}

// Print reservation
function printReservation(reservationId) {
    const reservation = allReservations.find(r => r._id === reservationId);
    if (!reservation) return;
    
    const table = reservation.table;
    const statusInfo = getStatusInfo(reservation.status);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Phiếu đặt bàn - ${reservation._id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #6F4E37; padding-bottom: 20px; margin-bottom: 20px; }
                .header h1 { color: #6F4E37; margin: 0; }
                .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                .section h2 { color: #6F4E37; margin-top: 0; }
                .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
                .label { font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>☕ COFFEE HOUSE</h1>
                <p>Premium Coffee Experience</p>
                <h2>PHIẾU ĐẶT BÀN</h2>
            </div>
            
            <div class="section">
                <h2>Thông tin bàn</h2>
                <div class="info-row">
                    <span class="label">Bàn số:</span>
                    <span>Bàn ${table.number}</span>
                </div>
                <div class="info-row">
                    <span class="label">Vị trí:</span>
                    <span>${table.location || 'Khu vực chính'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Sức chứa:</span>
                    <span>${table.capacity} người</span>
                </div>
            </div>
            
            <div class="section">
                <h2>Thông tin khách hàng</h2>
                <div class="info-row">
                    <span class="label">Họ tên:</span>
                    <span>${reservation.customerName}</span>
                </div>
                <div class="info-row">
                    <span class="label">Điện thoại:</span>
                    <span>${reservation.phone}</span>
                </div>
                ${reservation.email ? `
                    <div class="info-row">
                        <span class="label">Email:</span>
                        <span>${reservation.email}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="section">
                <h2>Chi tiết đặt bàn</h2>
                <div class="info-row">
                    <span class="label">Ngày:</span>
                    <span>${formatDate(reservation.date)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Giờ:</span>
                    <span>${reservation.time}</span>
                </div>
                <div class="info-row">
                    <span class="label">Số người:</span>
                    <span>${reservation.guests} người</span>
                </div>
                <div class="info-row">
                    <span class="label">Thời gian:</span>
                    <span>${reservation.duration || 120} phút</span>
                </div>
                <div class="info-row">
                    <span class="label">Trạng thái:</span>
                    <span>${statusInfo.text}</span>
                </div>
                ${reservation.notes ? `
                    <div style="margin-top: 15px;">
                        <div class="label">Yêu cầu đặc biệt:</div>
                        <p style="margin: 5px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">${reservation.notes}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="footer">
                <p>Coffee House - 123 Đường ABC, TP.HCM</p>
                <p>☎️ 0123 456 789 | 📧 info@coffeehouse.vn</p>
                <p>Cảm ơn bạn đã sử dụng dịch vụ!</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Download reservation
function downloadReservation(reservationId) {
    const reservation = allReservations.find(r => r._id === reservationId);
    if (!reservation) return;
    
    const table = reservation.table;
    const statusInfo = getStatusInfo(reservation.status);
    
    const content = `═══════════════════════════════════════
        ☕ COFFEE HOUSE
    Premium Coffee Experience
═══════════════════════════════════════

            PHIẾU ĐẶT BÀN

═══════════════════════════════════════
THÔNG TIN BÀN
═══════════════════════════════════════

Bàn số: Bàn ${table.number}
Vị trí: ${table.location || 'Khu vực chính'}
Sức chứa: ${table.capacity} người

═══════════════════════════════════════
THÔNG TIN KHÁCH HÀNG
═══════════════════════════════════════

Họ tên: ${reservation.customerName}
Điện thoại: ${reservation.phone}
${reservation.email ? `Email: ${reservation.email}\n` : ''}
═══════════════════════════════════════
CHI TIẾT ĐẶT BÀN
═══════════════════════════════════════

Ngày: ${formatDate(reservation.date)}
Giờ: ${reservation.time}
Số người: ${reservation.guests} người
Thời gian: ${reservation.duration || 120} phút
Trạng thái: ${statusInfo.text}
${reservation.notes ? `\nYêu cầu đặc biệt:\n${reservation.notes}\n` : ''}
═══════════════════════════════════════

Coffee House
123 Đường ABC, TP.HCM
☎️ 0123 456 789 | 📧 info@coffeehouse.vn

Cảm ơn bạn đã sử dụng dịch vụ!

═══════════════════════════════════════`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dat-ban-${reservation._id}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showNotification('Đã tải xuống thông tin đặt bàn!', 'success');
}

// Share reservation
function shareReservation(reservationId) {
    const reservation = allReservations.find(r => r._id === reservationId);
    if (!reservation) return;
    
    const table = reservation.table;
    const shareText = `☕ Đặt bàn tại Coffee House

🪑 Bàn số: ${table.number}
📅 Ngày: ${formatDate(reservation.date)}
⏰ Giờ: ${reservation.time}
👥 Số người: ${reservation.guests} người
📍 Vị trí: ${table.location || 'Khu vực chính'}

Coffee House - Premium Coffee Experience
☎️ 0123 456 789`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Thông tin đặt bàn - Coffee House',
            text: shareText
        }).then(() => {
            showNotification('Đã chia sẻ thành công!', 'success');
        }).catch(() => {
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Đã sao chép thông tin vào clipboard!', 'success');
    } catch (err) {
        showNotification('Không thể sao chép. Vui lòng thử lại.', 'error');
    }
    
    document.body.removeChild(textarea);
}

// Show rating modal
function showRatingModal(reservationId) {
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    if (!modal || !modalContent) return;
    
    modalContent.innerHTML = `
        <div class="text-center max-w-lg mx-auto">
            <div class="mb-6">
                <i class="fas fa-star text-6xl text-yellow-500 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Đánh giá dịch vụ</h2>
                <p class="text-gray-600">Hãy cho chúng tôi biết trải nghiệm của bạn</p>
            </div>
            
            <div class="mb-6">
                <p class="text-gray-700 mb-3 font-semibold">Chất lượng dịch vụ</p>
                <div class="flex justify-center gap-3" id="ratingStars">
                    ${[1, 2, 3, 4, 5].map(star => `
                        <button onclick="selectRating(${star})" 
                                class="rating-star text-4xl transition-all hover:scale-110"
                                data-rating="${star}">
                            <i class="far fa-star text-gray-300"></i>
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div class="mb-6">
                <label class="block text-left text-gray-700 mb-2 font-semibold">Nhận xét của bạn</label>
                <textarea id="ratingComment" 
                          rows="4" 
                          class="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-coffee focus:outline-none"
                          placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ, không gian, món ăn..."></textarea>
            </div>
            
            <div class="flex gap-3">
                <button onclick="closeDetailModal()" 
                        class="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                    Hủy
                </button>
                <button onclick="submitRating('${reservationId}')" 
                        class="flex-1 bg-coffee text-white py-3 rounded-lg font-semibold hover:bg-coffee-dark transition-colors">
                    Gửi đánh giá
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Global rating variable
let selectedRating = 0;

// Select rating
function selectRating(rating) {
    selectedRating = rating;
    
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        const icon = star.querySelector('i');
        if (index < rating) {
            icon.classList.remove('far', 'text-gray-300');
            icon.classList.add('fas', 'text-yellow-500');
        } else {
            icon.classList.remove('fas', 'text-yellow-500');
            icon.classList.add('far', 'text-gray-300');
        }
    });
}

// Submit rating
async function submitRating(reservationId) {
    if (selectedRating === 0) {
        showNotification('Vui lòng chọn số sao đánh giá', 'error');
        return;
    }
    
    const comment = document.getElementById('ratingComment')?.value || '';
    
    try {
        showNotification(`Cảm ơn bạn đã đánh giá ${selectedRating} sao!`, 'success');
        closeDetailModal();
        
        const reservation = allReservations.find(r => r._id === reservationId);
        if (reservation) {
            reservation.rating = selectedRating;
            reservation.ratingComment = comment;
            renderReservations();
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        showNotification('Không thể gửi đánh giá. Vui lòng thử lại.', 'error');
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('vi-VN', options);
}

// Show notification
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    alert(message);
}