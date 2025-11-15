/**
 * Tables Management - Admin
 * Quản lý bàn và đặt chỗ đầy đủ với đồng bộ real-time
 */

let allTables = [];
let allReservations = [];
let selectedTable = null;
let currentFilter = 'today'; // today, upcoming, all

// Check permission (getAuthToken is defined in permissions.js)
const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    window.location.href = '../login.html';
}

if (!getAuthToken()) {
    alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    window.location.href = '../login.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTables();
    // loadReservations(); // No longer needed, extracted from loadTables()
    setupEventListeners();
});

function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.clear();
        window.location.href = '../login.html';
    }
}

/**
 * Load all tables
 */
async function loadTables() {
    try {
        const token = getAuthToken();
        console.log('🔑 Tables - Token:', token ? 'Found' : 'Missing');
        
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            setTimeout(() => window.location.href = '../login.html', 1500);
            return;
        }
        
        console.log('📡 Fetching tables from:', `${API_BASE_URL}/tables`);
        const response = await fetch(`${API_BASE_URL}/tables`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📊 Tables Response Status:', response.status);
        const data = await response.json();
        console.log('📊 Tables Data:', data);
        
        if (data.success) {
            // Handle both response formats: data.data or data.tables
            allTables = data.data || data.tables || [];
            console.log('✅ Loaded tables:', allTables.length);
            
            // Extract reservations from all tables
            allReservations = [];
            
            allTables.forEach(table => {
                if (table.reservations && Array.isArray(table.reservations)) {
                    table.reservations.forEach(reservation => {
                        allReservations.push({
                            ...reservation,
                            tableNumber: table.number,
                            tableId: table._id,
                            tableName: `Bàn ${table.number}`
                        });
                    });
                }
            });
            
            console.log('📋 Extracted all reservations:', allReservations.length);
            
            updateStats();
            displayTables();
            displayReservations();
        } else {
            console.error('❌ Failed to load tables:', data.message);
            showNotification(data.message || 'Không thể tải danh sách bàn', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading tables:', error);
        showNotification('Lỗi tải dữ liệu bàn: ' + error.message, 'error');
    }
}

/**
 * Load reservations for today
 */
async function loadReservations() {
    try {
        const token = getAuthToken();
        if (!token) {
            console.warn('⚠️ No token for loading reservations');
            return;
        }
        
        console.log('📡 Fetching tables for reservations...');
        const response = await fetch(`${API_BASE_URL}/tables`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        console.log('📋 Raw tables data for reservations:', data);
        
        if (data.success) {
            const tables = data.data || data.tables || [];
            const today = new Date().toISOString().split('T')[0];
            
            allReservations = [];
            tables.forEach(table => {
                console.log(`🔍 Checking table ${table.number}, has reservations:`, table.reservations?.length || 0);
                
                if (table.reservations && Array.isArray(table.reservations)) {
                    table.reservations.forEach(reservation => {
                        const reservationDate = new Date(reservation.date).toISOString().split('T')[0];
                        console.log(`  📅 Reservation date: ${reservationDate}, status: ${reservation.status}`);
                        
                        if (reservationDate >= today && reservation.status !== 'cancelled' && reservation.status !== 'completed') {
                            allReservations.push({
                                ...reservation,
                                tableNumber: table.number,
                                tableId: table._id,
                                tableName: `Bàn ${table.number}`
                            });
                        }
                    });
                }
            });
            
            console.log('✅ Total reservations loaded:', allReservations.length);
            console.log('📋 Reservations:', allReservations);
            
            allReservations.sort((a, b) => {
                const dateA = new Date(a.date + ' ' + a.time);
                const dateB = new Date(b.date + ' ' + b.time);
                return dateA - dateB;
            });
            
            displayReservations();
        }
    } catch (error) {
        console.error('❌ Error loading reservations:', error);
        displayReservations();
    }
}

/**
 * Update statistics
 */
function updateStats() {
    try {
        const available = allTables.filter(t => t.status === 'available').length;
        const occupied = allTables.filter(t => t.status === 'occupied').length;
        const reserved = allTables.filter(t => t.status === 'reserved').length;
        const total = allTables.length;
        
        console.log('📊 Stats:', { available, occupied, reserved, total });
        
        const availableEl = document.getElementById('availableCount');
        const occupiedEl = document.getElementById('occupiedCount');
        const reservedEl = document.getElementById('reservedCount');
        const totalEl = document.getElementById('totalCount');
        
        if (availableEl) availableEl.textContent = available;
        if (occupiedEl) occupiedEl.textContent = occupied;
        if (reservedEl) reservedEl.textContent = reserved;
        if (totalEl) totalEl.textContent = total;
    } catch (error) {
        console.error('❌ Error updating stats:', error);
    }
}

/**
 * Display tables grid
 */
function displayTables() {
    const grid = document.getElementById('tablesGrid');
    console.log('🎨 Displaying tables, grid element:', grid ? 'Found' : 'Not found');
    console.log('🎨 Tables to display:', allTables.length);
    
    if (!grid) {
        console.error('❌ Tables grid element not found!');
        return;
    }
    
    if (allTables.length === 0) {
        grid.innerHTML = '<p class="text-center text-gray-400 py-8 col-span-full">Chưa có bàn nào</p>';
        return;
    }
    
    try {
        grid.innerHTML = allTables.map(table => {
            const statusConfig = getTableStatusConfig(table.status);
            
            // Get upcoming reservation directly from table.reservations
            const today = new Date().toISOString().split('T')[0];
            const upcomingReservation = table.reservations?.find(r => {
                const rDate = new Date(r.date).toISOString().split('T')[0];
                return rDate === today && (r.status === 'confirmed' || r.status === 'pending');
            });
            
            console.log(`🔍 Table ${table.number} - Status: ${table.status}, Has reservation:`, !!upcomingReservation);
            if (upcomingReservation) {
                console.log(`   📅 Reservation: ${upcomingReservation.customerName} at ${upcomingReservation.time}`);
            }
        
            return `
                <div class="border-2 ${statusConfig.borderClass} ${statusConfig.bgClass} rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all" 
                     onclick="viewTableDetail('${table._id}')">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-2xl font-bold ${statusConfig.textClass}">Bàn ${table.number}</h3>
                        <i class="fas ${statusConfig.icon} text-2xl ${statusConfig.iconColor}"></i>
                    </div>
                    
                    <div class="space-y-1 text-sm mb-3">
                        <p class="${statusConfig.textClass}">
                            <i class="fas fa-users mr-2"></i>${table.capacity} chỗ
                        </p>
                        <p class="${statusConfig.textClass}">
                            <i class="fas fa-map-marker-alt mr-2"></i>
                            ${getLocationLabel(table.location)}
                        </p>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.badgeBg} ${statusConfig.badgeText}">
                            ${statusConfig.label}
                        </span>
                        ${upcomingReservation ? `
                            <span class="text-xs text-amber-600 font-medium">
                                <i class="fas fa-clock mr-1"></i>${upcomingReservation.time}
                            </span>
                        ` : ''}
                    </div>
                    
                    ${table.status === 'occupied' ? `
                        <button onclick="event.stopPropagation(); checkoutTable('${table._id}')" 
                                class="w-full mt-3 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                            <i class="fas fa-check mr-1"></i>Thanh toán
                        </button>
                    ` : table.status === 'reserved' && upcomingReservation ? `
                        <button onclick="event.stopPropagation(); checkinReservation('${table._id}', '${upcomingReservation._id}')" 
                                class="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                            <i class="fas fa-user-check mr-1"></i>Check-in
                        </button>
                    ` : table.status === 'available' ? `
                        <button onclick="event.stopPropagation(); quickOccupy('${table._id}')" 
                                class="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                            <i class="fas fa-play mr-1"></i>Bắt đầu sử dụng
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        console.log('✅ Tables displayed successfully');
    } catch (error) {
        console.error('❌ Error displaying tables:', error);
        grid.innerHTML = '<p class="text-center text-red-400 py-8 col-span-full">Lỗi hiển thị bàn</p>';
    }
}

/**
 * Display reservations list
 */
function displayReservations() {
    filterReservations(currentFilter); // Use current filter
}

/**
 * Filter reservations by date range
 */
function filterReservations(filter) {
    currentFilter = filter;
    
    // Update button styles
    document.getElementById('btnToday').className = filter === 'today' 
        ? 'px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition'
        : 'px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition';
    document.getElementById('btnUpcoming').className = filter === 'upcoming'
        ? 'px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition'
        : 'px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition';
    document.getElementById('btnAll').className = filter === 'all'
        ? 'px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition'
        : 'px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition';
    
    const container = document.getElementById('reservationsList');
    if (!container || !allReservations || allReservations.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">Không có đặt chỗ nào</div>';
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Filter reservations based on selected filter
    let filteredReservations = allReservations;
    if (filter === 'today') {
        filteredReservations = allReservations.filter(r => {
            const reservationDate = new Date(r.date).toISOString().split('T')[0];
            return reservationDate === today && r.status !== 'cancelled' && r.status !== 'completed';
        });
    } else if (filter === 'upcoming') {
        filteredReservations = allReservations.filter(r => {
            const reservationDate = new Date(r.date).toISOString().split('T')[0];
            return reservationDate >= today && r.status !== 'cancelled' && r.status !== 'completed';
        });
    }
    // 'all' shows everything
    
    if (filteredReservations.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">Không có đặt chỗ nào</div>';
        return;
    }
    
    // Render filtered reservations
    try {
        container.innerHTML = filteredReservations.map(r => {
            const isToday = new Date(r.date).toISOString().split('T')[0] === today;
            const statusConfig = getReservationStatusConfig(r.status);
            
            return `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${isToday ? 'border-l-4 border-amber-500' : ''}">
                    <div class="flex items-center flex-1">
                        <div class="w-14 h-14 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                            ${r.tableNumber}
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <p class="font-semibold text-gray-800">${r.customerName || 'N/A'}</p>
                                ${isToday ? '<span class="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">Hôm nay</span>' : ''}
                                <span class="px-2 py-0.5 ${statusConfig.bgClass} ${statusConfig.textClass} text-xs rounded-full font-medium">
                                    ${statusConfig.label}
                                </span>
                            </div>
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-phone mr-1"></i>${r.phone || 'N/A'}
                                <span class="mx-2">•</span>
                                <i class="fas fa-users mr-1"></i>${r.guests || 0} người
                            </p>
                            <p class="text-xs text-gray-500 mt-1">
                                <i class="fas fa-calendar mr-1"></i>${new Date(r.date).toLocaleDateString('vi-VN')}
                                <span class="mx-2">•</span>
                                <i class="fas fa-clock mr-1"></i>${r.time}
                            </p>
                            ${r.notes ? `<p class="text-xs text-gray-500 mt-1 italic"><i class="fas fa-sticky-note mr-1"></i>${r.notes}</p>` : ''}
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-2 ml-4">
                        ${r.status === 'pending' && isToday ? `
                            <button onclick="confirmReservation('${r.tableId}', '${r._id}')" 
                                    class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                                    title="Xác nhận">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${r.status === 'confirmed' && isToday ? `
                            <button onclick="checkinReservation('${r.tableId}', '${r._id}')" 
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                                    title="Check-in">
                                <i class="fas fa-user-check"></i>
                            </button>
                        ` : ''}
                        <button onclick="viewReservationDetail('${r.tableId}', '${r._id}')" 
                                class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                                title="Chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${r.status !== 'completed' && r.status !== 'cancelled' ? `
                            <button onclick="cancelReservation('${r.tableId}', '${r._id}')" 
                                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                                    title="Hủy">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('❌ Error filtering reservations:', error);
        container.innerHTML = '<div class="text-center text-red-400 py-8">Lỗi hiển thị danh sách đặt chỗ</div>';
    }
}

/**
 * Get table status configuration
 */
function getTableStatusConfig(status) {
    const configs = {
        available: {
            label: 'Trống',
            icon: 'fa-check-circle',
            iconColor: 'text-green-600',
            bgClass: 'bg-green-50',
            borderClass: 'border-green-400',
            textClass: 'text-green-800',
            badgeBg: 'bg-green-100',
            badgeText: 'text-green-800'
        },
        occupied: {
            label: 'Đang dùng',
            icon: 'fa-users',
            iconColor: 'text-red-600',
            bgClass: 'bg-red-50',
            borderClass: 'border-red-400',
            textClass: 'text-red-800',
            badgeBg: 'bg-red-100',
            badgeText: 'text-red-800'
        },
        reserved: {
            label: 'Đã đặt',
            icon: 'fa-bookmark',
            iconColor: 'text-yellow-600',
            bgClass: 'bg-yellow-50',
            borderClass: 'border-yellow-400',
            textClass: 'text-yellow-800',
            badgeBg: 'bg-yellow-100',
            badgeText: 'text-yellow-800'
        },
        maintenance: {
            label: 'Bảo trì',
            icon: 'fa-wrench',
            iconColor: 'text-gray-600',
            bgClass: 'bg-gray-50',
            borderClass: 'border-gray-400',
            textClass: 'text-gray-800',
            badgeBg: 'bg-gray-100',
            badgeText: 'text-gray-800'
        }
    };
    return configs[status] || configs.available;
}

/**
 * Get reservation status configuration
 */
function getReservationStatusConfig(status) {
    const configs = {
        pending: {
            label: 'Chờ xác nhận',
            bgClass: 'bg-yellow-100',
            textClass: 'text-yellow-800'
        },
        confirmed: {
            label: 'Đã xác nhận',
            bgClass: 'bg-blue-100',
            textClass: 'text-blue-800'
        },
        completed: {
            label: 'Hoàn thành',
            bgClass: 'bg-green-100',
            textClass: 'text-green-800'
        },
        cancelled: {
            label: 'Đã hủy',
            bgClass: 'bg-red-100',
            textClass: 'text-red-800'
        }
    };
    return configs[status] || configs.pending;
}

/**
 * Get location label
 */
function getLocationLabel(location) {
    const labels = {
        'indoor': 'Trong nhà',
        'outdoor': 'Ngoài trời',
        'private': 'Phòng riêng'
    };
    return labels[location] || location;
}

/**
 * Get upcoming reservation for a table
 */
function getUpcomingReservation(tableId) {
    const today = new Date().toISOString().split('T')[0];
    return allReservations.find(r => 
        r.tableId === tableId && 
        new Date(r.date).toISOString().split('T')[0] === today &&
        (r.status === 'confirmed' || r.status === 'pending')
    );
}

/**
 * View table detail
 */
async function viewTableDetail(tableId) {
    const table = allTables.find(t => t._id === tableId);
    if (!table) {
        console.error('❌ Table not found:', tableId);
        return;
    }
    
    console.log('🔍 Viewing table detail:', table);
    console.log('📋 Table reservations:', table.reservations);
    
    selectedTable = table;
    const statusConfig = getTableStatusConfig(table.status);
    
    // Get reservations directly from table object
    const tableReservations = table.reservations || [];
    console.log('📋 Total reservations for this table:', tableReservations.length);
    
    const detailHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-2xl font-bold text-gray-800">Bàn ${table.number}</h3>
                <span class="px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.badgeBg} ${statusConfig.badgeText}">
                    <i class="${statusConfig.icon} mr-2"></i>${statusConfig.label}
                </span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                    <p class="text-sm text-gray-500">Sức chứa</p>
                    <p class="text-lg font-semibold"><i class="fas fa-users mr-2"></i>${table.capacity} người</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Vị trí</p>
                    <p class="text-lg font-semibold"><i class="fas fa-map-marker-alt mr-2"></i>${getLocationLabel(table.location)}</p>
                </div>
            </div>
            
            ${tableReservations.length > 0 ? `
                <div>
                    <h4 class="font-semibold text-gray-700 mb-3">Lịch đặt chỗ</h4>
                    <div class="space-y-2 max-h-60 overflow-y-auto">
                        ${tableReservations.map(r => {
                            const rStatusConfig = getReservationStatusConfig(r.status);
                            const rDate = new Date(r.date).toISOString().split('T')[0];
                            const today = new Date().toISOString().split('T')[0];
                            const isToday = rDate === today;
                            
                            return `
                                <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div class="flex items-center justify-between mb-2">
                                        <p class="font-medium">${r.customerName || 'N/A'}</p>
                                        <span class="px-2 py-1 text-xs rounded-full ${rStatusConfig.bgClass} ${rStatusConfig.textClass}">
                                            ${rStatusConfig.label}
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-600">
                                        <i class="fas fa-calendar mr-1"></i>${new Date(r.date).toLocaleDateString('vi-VN')}
                                        <span class="mx-2">•</span>
                                        <i class="fas fa-clock mr-1"></i>${r.time}
                                        <span class="mx-2">•</span>
                                        <i class="fas fa-users mr-1"></i>${r.guests} người
                                    </p>
                                    ${r.phone ? `<p class="text-sm text-gray-500 mt-1"><i class="fas fa-phone mr-1"></i>${r.phone}</p>` : ''}
                                    ${r.notes ? `<p class="text-sm text-gray-500 mt-1 italic"><i class="fas fa-sticky-note mr-1"></i>${r.notes}</p>` : ''}
                                    
                                    ${isToday && r.status === 'confirmed' ? `
                                        <div class="mt-2 flex gap-2">
                                            <button onclick="checkinReservation('${table._id}', '${r._id}')" 
                                                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium">
                                                <i class="fas fa-user-check mr-1"></i>Check-in
                                            </button>
                                            <button onclick="cancelReservation('${table._id}', '${r._id}')" 
                                                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium">
                                                <i class="fas fa-times mr-1"></i>Hủy
                                            </button>
                                        </div>
                                    ` : isToday && r.status === 'pending' ? `
                                        <div class="mt-2 flex gap-2">
                                            <button onclick="confirmReservation('${table._id}', '${r._id}')" 
                                                    class="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium">
                                                <i class="fas fa-check mr-1"></i>Xác nhận
                                            </button>
                                            <button onclick="cancelReservation('${table._id}', '${r._id}')" 
                                                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium">
                                                <i class="fas fa-times mr-1"></i>Hủy
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : '<p class="text-gray-500 text-center py-4">Chưa có đặt chỗ nào</p>'}
            
            <div class="flex gap-2 pt-4 border-t">
                ${table.status === 'available' ? `
                    <button onclick="quickOccupy('${table._id}')" class="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-play mr-2"></i>Bắt đầu sử dụng
                    </button>
                ` : table.status === 'occupied' ? `
                    <button onclick="checkoutTable('${table._id}')" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-check mr-2"></i>Thanh toán
                    </button>
                ` : table.status === 'reserved' ? `
                    <button onclick="setTableAvailable('${table._id}')" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-undo mr-2"></i>Đặt lại trống
                    </button>
                ` : ''}
                
                <button onclick="openEditTableModal('${table._id}')" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium">
                    <i class="fas fa-edit mr-2"></i>Sửa
                </button>
                
                ${table.status === 'available' ? `
                    <button onclick="deleteTable('${table._id}')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-trash mr-2"></i>Xóa
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    showModal('Chi tiết bàn', detailHTML);
}

/**
 * Quick occupy table
 */
async function quickOccupy(tableId) {
    if (!confirm('Bắt đầu sử dụng bàn này?')) return;
    
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'occupied' })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Đã bắt đầu sử dụng bàn', 'success');
            loadTables();
            closeAllModals();
        } else {
            showNotification(data.message || 'Lỗi cập nhật trạng thái', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Lỗi cập nhật trạng thái bàn', 'error');
    }
}

/**
 * Checkout table
 */
/**
 * Checkout table (set to available after payment)
 */
async function checkoutTable(tableId) {
    if (!confirm('Thanh toán và trả bàn?')) return;
    
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'available' })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Đã thanh toán và trả bàn', 'success');
            loadTables();
            closeAllModals();
        } else {
            showNotification(data.message || 'Lỗi thanh toán', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Lỗi thanh toán', 'error');
    }
}

/**
 * Set table to available (reset reserved table)
 */
async function setTableAvailable(tableId) {
    if (!confirm('Đặt bàn này về trạng thái trống?')) return;
    
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'available' })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Đã đặt bàn về trạng thái trống', 'success');
            loadTables();
            closeAllModals();
        } else {
            showNotification(data.message || 'Lỗi cập nhật trạng thái bàn', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Lỗi cập nhật trạng thái bàn', 'error');
    }
}

/**
 * Confirm reservation
 */
async function confirmReservation(tableId, reservationId) {
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        
        // Update reservation status to confirmed (also updates table status)
        const response = await fetch(`${API_BASE_URL}/tables/${tableId}/reservations/${reservationId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'confirmed' })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Đã xác nhận đặt chỗ', 'success');
            await loadTables(); // Reload tables and reservations
        } else {
            showNotification(data.message || 'Lỗi xác nhận', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Lỗi xác nhận đặt chỗ', 'error');
    }
}

/**
 * Check-in reservation
 */
async function checkinReservation(tableId, reservationId) {
    if (!confirm('Check-in khách hàng?')) return;
    
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        
        // Update reservation status to completed (also updates table to occupied)
        const response = await fetch(`${API_BASE_URL}/tables/${tableId}/reservations/${reservationId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'completed' })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Đã check-in khách hàng', 'success');
            closeAllModals();
            await loadTables(); // Reload tables and reservations
        } else {
            showNotification(data.message || 'Lỗi check-in', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Lỗi check-in', 'error');
    }
}

/**
 * Cancel reservation
 */
async function cancelReservation(tableId, reservationId) {
    if (!confirm('Bạn có chắc muốn hủy đặt chỗ này?')) return;
    
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/tables/${tableId}/reservations/${reservationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Đã hủy đặt chỗ', 'success');
            
            const table = allTables.find(t => t._id === tableId);
            if (table && table.status === 'reserved') {
                await fetch(`${API_BASE_URL}/tables/${tableId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: 'available' })
                });
            }
            
            await loadTables(); // Reload tables and reservations
        } else if (response.status === 403) {
            showNotification('Admin/Staff có thể hủy bất kỳ đặt chỗ nào. Lỗi phân quyền.', 'error');
        } else {
            showNotification(data.message || 'Lỗi hủy đặt chỗ', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Lỗi hủy đặt chỗ', 'error');
    }
}

/**
 * View reservation detail
 */
function viewReservationDetail(tableId, reservationId) {
    const reservation = allReservations.find(r => r._id === reservationId);
    if (!reservation) return;
    
    const statusConfig = getReservationStatusConfig(reservation.status);
    
    const detailHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-xl font-bold">Đặt chỗ #${reservationId.slice(-6).toUpperCase()}</h3>
                <span class="px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bgClass} ${statusConfig.textClass}">
                    ${statusConfig.label}
                </span>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                    <p class="text-sm text-gray-500">Bàn</p>
                    <p class="text-lg font-semibold">${reservation.tableName}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Khách hàng</p>
                    <p class="font-medium">${reservation.customerName}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Số điện thoại</p>
                    <p class="font-medium">${reservation.phone}</p>
                </div>
                ${reservation.email ? `
                    <div>
                        <p class="text-sm text-gray-500">Email</p>
                        <p class="font-medium">${reservation.email}</p>
                    </div>
                ` : ''}
                <div>
                    <p class="text-sm text-gray-500">Thời gian</p>
                    <p class="font-medium">
                        ${new Date(reservation.date).toLocaleDateString('vi-VN')} lúc ${reservation.time}
                    </p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Số khách</p>
                    <p class="font-medium">${reservation.guests} người</p>
                </div>
                ${reservation.notes ? `
                    <div>
                        <p class="text-sm text-gray-500">Ghi chú</p>
                        <p class="font-medium">${reservation.notes}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="flex gap-2 pt-4 border-t">
                ${reservation.status === 'pending' ? `
                    <button onclick="confirmReservation('${tableId}', '${reservationId}')" 
                            class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-check mr-2"></i>Xác nhận
                    </button>
                ` : reservation.status === 'confirmed' ? `
                    <button onclick="checkinReservation('${tableId}', '${reservationId}')" 
                            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-user-check mr-2"></i>Check-in
                    </button>
                ` : ''}
                ${reservation.status !== 'completed' && reservation.status !== 'cancelled' ? `
                    <button onclick="cancelReservation('${tableId}', '${reservationId}')" 
                            class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-times mr-2"></i>Hủy đặt chỗ
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    showModal('Chi tiết đặt chỗ', detailHTML);
}

/**
 * Delete table
 */
async function deleteTable(tableId) {
    if (!confirm('Bạn có chắc muốn xóa bàn này?')) return;
    
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Đã xóa bàn', 'success');
            loadTables();
            closeAllModals();
        } else {
            showNotification(data.message || 'Lỗi xóa bàn', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Lỗi xóa bàn', 'error');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const tableForm = document.getElementById('tableForm');
    if (tableForm) {
        tableForm.addEventListener('submit', handleTableFormSubmit);
    }
}

/**
 * Handle table form submit
 */
async function handleTableFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('tableId').value;
    const tableData = {
        number: parseInt(document.getElementById('tableNumber').value),
        capacity: parseInt(document.getElementById('capacity').value),
        location: document.getElementById('location').value
    };
    
    // Add image if provided
    if (currentTableImage) {
        tableData.image = currentTableImage;
    }
    
    try {
        const token = getAuthToken();
        if (!token) {
            showNotification('Vui lòng đăng nhập lại', 'error');
            return;
        }
        const url = id ? `${API_BASE_URL}/tables/${id}` : `${API_BASE_URL}/tables`;
        const response = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(tableData)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification(id ? 'Cập nhật bàn thành công' : 'Thêm bàn thành công', 'success');
            closeTableModal();
            loadTables();
        } else {
            showNotification(data.message || 'Lỗi lưu bàn', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Lỗi lưu bàn', 'error');
    }
}

/**
 * Open add table modal
 */
function openAddTableModal() {
    document.getElementById('modalTitle').textContent = 'Thêm bàn mới';
    document.getElementById('tableForm').reset();
    document.getElementById('tableId').value = '';
    document.getElementById('tableModal').classList.remove('hidden');
}

/**
 * Open edit table modal
 */
function openEditTableModal(tableId) {
    const table = allTables.find(t => t._id === tableId);
    if (!table) return;
    
    document.getElementById('modalTitle').textContent = 'Sửa thông tin bàn';
    document.getElementById('tableId').value = table._id;
    document.getElementById('tableNumber').value = table.number;
    document.getElementById('capacity').value = table.capacity;
    document.getElementById('location').value = table.location;
    
    // Show current image if exists
    if (table.image) {
        currentTableImage = table.image;
        showImagePreview(getTableImageUrl(table.image));
    } else {
        removeTableImage();
    }
    
    document.getElementById('tableModal').classList.remove('hidden');
    closeAllModals();
}

/**
 * Close table modal
 */
function closeTableModal() {
    document.getElementById('tableModal').classList.add('hidden');
    removeTableImage();
    currentTableImage = null;
}

/**
 * Simple modal system
 */
function showModal(title, content) {
    let modal = document.getElementById('detailModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'detailModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center hidden';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <h3 id="detailModalTitle" class="text-2xl font-bold text-gray-800"></h3>
                    <button onclick="closeAllModals()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                <div id="detailModalContent" class="p-6"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('detailModalTitle').textContent = title;
    document.getElementById('detailModalContent').innerHTML = content;
    modal.classList.remove('hidden');
}

/**
 * Close all modals
 */
function closeAllModals() {
    const detailModal = document.getElementById('detailModal');
    if (detailModal) {
        detailModal.classList.add('hidden');
    }
}

/**
 * Handle image file upload
 */
let currentTableImage = null;

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Vui lòng chọn file hình ảnh', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Kích thước file không được vượt quá 5MB', 'error');
        return;
    }
    
    // Read file and convert to base64
    const reader = new FileReader();
    reader.onload = function(e) {
        currentTableImage = e.target.result;
        showImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

/**
 * Handle image URL input
 */
function handleImageUrlChange(event) {
    const url = event.target.value.trim();
    if (!url) return;
    
    // Validate URL format
    try {
        new URL(url);
        currentTableImage = url;
        showImagePreview(url);
    } catch (error) {
        showNotification('URL hình ảnh không hợp lệ', 'error');
    }
}

/**
 * Show image preview
 */
function showImagePreview(imageUrl) {
    const previewDiv = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const uploadOptions = document.getElementById('uploadOptions');
    
    if (previewDiv && previewImg && uploadOptions) {
        previewImg.src = imageUrl;
        previewDiv.classList.remove('hidden');
        uploadOptions.classList.add('hidden');
    }
}

/**
 * Remove table image
 */
function removeTableImage() {
    currentTableImage = null;
    
    const previewDiv = document.getElementById('imagePreview');
    const uploadOptions = document.getElementById('uploadOptions');
    const fileInput = document.getElementById('tableImageFile');
    const urlInput = document.getElementById('tableImageUrl');
    
    if (previewDiv) previewDiv.classList.add('hidden');
    if (uploadOptions) uploadOptions.classList.remove('hidden');
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
}

/**
 * Get table image for display
 */
function getTableImageUrl(image) {
    if (!image) return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80';
    
    // If it's a data URL (base64)
    if (image.startsWith('data:image')) {
        return image;
    }
    
    // If it's a full URL
    if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
    }
    
    // If it's a relative path, prepend API base URL
    if (image.startsWith('/')) {
        return `${API_BASE_URL}${image}`;
    }
    
    return image;
}
