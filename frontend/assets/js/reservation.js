// Reservation page JavaScript
let availableTables = [];
let selectedTable = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing reservation page...');
    
    // Pre-fill user info if logged in
    prefillUserInfo();
    
    // Set minimum date to today
    setMinDate();
    
    // Load available tables
    await loadTables();
    
    // Setup form submission
    setupFormHandler();
    
    // Setup date/time change listeners to reload tables
    setupDateTimeListeners();
    
    console.log('✅ Reservation page initialized');
});

// Setup date and time change listeners
function setupDateTimeListeners() {
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    
    if (dateInput) {
        dateInput.addEventListener('change', async function() {
            console.log('📅 Date changed, reloading tables...');
            selectedTable = null; // Reset selection
            await loadTables();
        });
    }
    
    if (timeInput) {
        timeInput.addEventListener('change', async function() {
            console.log('🕒 Time changed, reloading tables...');
            selectedTable = null; // Reset selection
            await loadTables();
        });
    }
}

// Prefill user info from localStorage
function prefillUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const nameInput = document.getElementById('customerName');
        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');
        
        if (nameInput && user.name) nameInput.value = user.name;
        if (phoneInput && user.phone) phoneInput.value = user.phone;
        if (emailInput && user.email) emailInput.value = user.email;
    }
}

// Set minimum date to today
function setMinDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        dateInput.value = today; // Set default to today
    }
}

// Load available tables from API
async function loadTables() {
    const loadingEl = document.getElementById('tablesLoading');
    const listEl = document.getElementById('tablesList');
    const emptyEl = document.getElementById('tablesEmpty');
    
    try {
        console.log('📥 Loading tables...');
        const tables = await fetchTables();
        console.log('Tables:', tables);
        
        // Get selected date and time
        const selectedDate = document.getElementById('date')?.value;
        const selectedTime = document.getElementById('time')?.value;
        
        console.log('🔍 Filtering tables for:', { selectedDate, selectedTime });
        
        // Filter available tables based on status and reservations
        availableTables = tables.filter(table => {
            // Check basic availability
            if (table.status !== 'available' && table.status !== 'Trống') {
                console.log(`❌ Table ${table.number} not available (status: ${table.status})`);
                return false;
            }
            
            // Only check time conflicts if BOTH date AND time are selected
            if (!selectedDate || !selectedTime) {
                console.log(`✅ Table ${table.number} available (no date/time filter)`);
                return true;
            }
            
            // Check for reservation conflicts
            if (table.reservations && table.reservations.length > 0) {
                const hasConflict = table.reservations.some(reservation => {
                    // Only check confirmed or pending reservations
                    if (reservation.status !== 'confirmed' && reservation.status !== 'pending') {
                        return false;
                    }
                    
                    // Check if same date
                    const reservationDate = new Date(reservation.date).toISOString().split('T')[0];
                    if (reservationDate !== selectedDate) {
                        return false;
                    }
                    
                    // Check time conflict (within 2 hours)
                    const reservationTime = reservation.time;
                    const conflict = isTimeConflict(selectedTime, reservationTime);
                    
                    if (conflict) {
                        console.log(`⚠️ Table ${table.number} has conflict at ${reservationTime} (selected: ${selectedTime})`);
                    }
                    
                    return conflict;
                });
                
                if (hasConflict) {
                    console.log(`❌ Table ${table.number} blocked due to time conflict`);
                    return false;
                }
            }
            
            console.log(`✅ Table ${table.number} available for selected time`);
            return true;
        });
        
        // Hide loading
        if (loadingEl) loadingEl.classList.add('hidden');
        
        if (availableTables.length === 0) {
            if (emptyEl) emptyEl.classList.remove('hidden');
            if (selectedDate && selectedTime) {
                emptyEl.innerHTML = `
                    <i class="fas fa-calendar-times text-3xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">Không có bàn trống vào thời gian này</p>
                    <p class="text-sm text-gray-400 mt-2">Vui lòng chọn thời gian khác</p>
                `;
            }
            return;
        }
        
        // Show and render tables
        if (listEl) {
            listEl.classList.remove('hidden');
            renderTablesList();
        }
        
        console.log('✅ Tables loaded:', availableTables.length);
    } catch (error) {
        console.error('❌ Error loading tables:', error);
        if (loadingEl) loadingEl.classList.add('hidden');
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.innerHTML = `
                <i class="fas fa-exclamation-circle text-3xl text-red-300 mb-3"></i>
                <p class="text-red-500">Không thể tải danh sách bàn</p>
            `;
        }
    }
}

// Check if two time slots conflict (within 2 hours)
function isTimeConflict(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    
    const diff = Math.abs(minutes1 - minutes2);
    
    // Consider conflict if within 2 hours (120 minutes)
    return diff < 120;
}

// Render tables list
function renderTablesList() {
    const listEl = document.getElementById('tablesList');
    if (!listEl) return;
    
    listEl.innerHTML = availableTables.map(table => {
        const tableId = table._id || table.id;
        const isSelected = selectedTable && (selectedTable._id === tableId || selectedTable.id === tableId);
        const tableImage = getTableImage(table.image);
        
        return `
            <div onclick="selectTable('${tableId}')" 
                 class="group relative p-4 border-2 ${isSelected ? 'border-coffee bg-coffee bg-opacity-10' : 'border-gray-200'} rounded-xl cursor-pointer hover:border-coffee hover:shadow-lg transition-all">
                <!-- Table Image Preview -->
                <div class="mb-3 rounded-lg overflow-hidden h-32">
                    <img src="${tableImage}" 
                         alt="Table ${table.number}" 
                         class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                         onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80'">
                </div>
                
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <div class="w-10 h-10 bg-coffee rounded-full flex items-center justify-center">
                                <span class="text-white font-bold">${table.number}</span>
                            </div>
                            <div>
                                <h4 class="font-bold text-coffee text-lg">Bàn ${table.number}</h4>
                                <p class="text-xs text-gray-500">${table.location || 'Khu vực chính'}</p>
                            </div>
                        </div>
                        
                        <div class="space-y-1 text-sm">
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-users w-5 text-coffee"></i>
                                <span>Sức chứa: ${table.capacity} người</span>
                            </div>
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-map-marker-alt w-5 text-coffee"></i>
                                <span>${table.location || 'Trong nhà'}</span>
                            </div>
                            ${table.description ? `
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-info-circle w-5 text-coffee"></i>
                                    <span class="text-xs">${table.description}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="ml-2">
                        ${isSelected ? 
                            '<div class="w-8 h-8 bg-coffee rounded-full flex items-center justify-center"><i class="fas fa-check text-white"></i></div>' : 
                            '<div class="w-8 h-8 border-2 border-gray-300 rounded-full group-hover:border-coffee transition-colors"></div>'
                        }
                    </div>
                </div>
                
                ${isSelected ? `
                    <div class="mt-3 pt-3 border-t border-coffee border-opacity-30">
                        <div class="flex items-center justify-center text-coffee font-semibold text-sm">
                            <i class="fas fa-check-circle mr-2"></i>Bàn đã chọn
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Get table image
function getTableImage(image) {
    if (!image) {
        return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80';
    }
    
    // If base64 data URL
    if (image.startsWith('data:image/')) {
        return image;
    }
    
    // If external URL
    if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
    }
    
    // If relative path
    return `http://localhost:3000${image}`;
}

// Select table
function selectTable(tableId) {
    selectedTable = availableTables.find(t => 
        (t._id && t._id === tableId) || (t.id && t.id === tableId)
    );
    
    console.log('Selected table:', selectedTable);
    
    // Update UI
    renderTablesList();
    
    // Update hidden input
    const tableIdInput = document.getElementById('tableId');
    if (tableIdInput) {
        tableIdInput.value = tableId;
    }
    
    // Show selected table info with enhanced details
    showSelectedTableInfo();
}

// Show enhanced selected table info
function showSelectedTableInfo() {
    const infoEl = document.getElementById('selectedTableInfo');
    const textEl = document.getElementById('selectedTableText');
    
    if (!infoEl || !selectedTable) return;
    
    const tableImage = getTableImage(selectedTable.image);
    
    infoEl.innerHTML = `
        <div class="bg-gradient-to-br from-coffee to-coffee-dark text-white rounded-xl p-4 shadow-lg">
            <div class="flex items-center space-x-3 mb-3">
                <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <i class="fas fa-check-circle text-2xl"></i>
                </div>
                <div>
                    <p class="text-sm opacity-90">Bàn đã chọn</p>
                    <h3 class="font-bold text-xl">Bàn số ${selectedTable.number}</h3>
                </div>
            </div>
            
            <div class="bg-white bg-opacity-10 rounded-lg p-3 space-y-2 text-sm">
                <div class="flex items-center justify-between">
                    <span class="opacity-90">Sức chứa:</span>
                    <span class="font-semibold">${selectedTable.capacity} người</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="opacity-90">Vị trí:</span>
                    <span class="font-semibold">${selectedTable.location || 'Khu vực chính'}</span>
                </div>
            </div>
            
            <button onclick="clearTableSelection()" class="mt-3 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                <i class="fas fa-times mr-2"></i>Chọn bàn khác
            </button>
        </div>
    `;
    
    infoEl.classList.remove('hidden');
}

// Clear table selection
function clearTableSelection() {
    selectedTable = null;
    const tableIdInput = document.getElementById('tableId');
    if (tableIdInput) {
        tableIdInput.value = '';
    }
    
    const infoEl = document.getElementById('selectedTableInfo');
    if (infoEl) {
        infoEl.classList.add('hidden');
    }
    
    renderTablesList();
}

// Search tables
function searchTables(query) {
    if (!query.trim()) {
        renderTablesList();
        return;
    }
    
    const listEl = document.getElementById('tablesList');
    if (!listEl) return;
    
    const filtered = availableTables.filter(table => {
        const searchStr = `${table.number} ${table.location} ${table.capacity}`.toLowerCase();
        return searchStr.includes(query.toLowerCase());
    });
    
    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-search text-3xl text-gray-300 mb-3"></i>
                <p class="text-gray-500">Không tìm thấy bàn phù hợp</p>
            </div>
        `;
        return;
    }
    
    // Temporarily replace availableTables for rendering
    const originalTables = [...availableTables];
    availableTables = filtered;
    renderTablesList();
    availableTables = originalTables;
}

// Filter tables by capacity
function filterTablesByCapacity(minCapacity) {
    if (!minCapacity) {
        renderTablesList();
        return;
    }
    
    const listEl = document.getElementById('tablesList');
    if (!listEl) return;
    
    const capacity = parseInt(minCapacity);
    const filtered = availableTables.filter(table => table.capacity >= capacity);
    
    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-filter text-3xl text-gray-300 mb-3"></i>
                <p class="text-gray-500">Không có bàn phù hợp</p>
            </div>
        `;
        return;
    }
    
    const originalTables = [...availableTables];
    availableTables = filtered;
    renderTablesList();
    availableTables = originalTables;
}

// Setup form handler
function setupFormHandler() {
    const form = document.getElementById('reservationForm');
    if (form) {
        form.addEventListener('submit', handleReservationSubmit);
    }
}

// Handle reservation submission
async function handleReservationSubmit(e) {
    e.preventDefault();
    
    console.log('📤 Submitting reservation...');
    
    // Check if user is logged in
    const user = getCurrentUser();
    const token = getAuthToken();
    
    if (!user || !token) {
        showAlert('Vui lòng đăng nhập để đặt bàn!', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Check if table is selected
    if (!selectedTable) {
        showAlert('Vui lòng chọn bàn!', 'error');
        return;
    }
    
    // Get form data
    const customerName = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const guests = document.getElementById('guests').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const notes = document.getElementById('notes').value.trim();
    
    // Validation
    if (!customerName || !phone || !guests || !date || !time) {
        showAlert('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
        return;
    }
    
    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...';
    
    try {
        // Prepare reservation data
        const reservationData = {
            customerName,
            phone,
            email: email || user.email,
            guests: parseInt(guests),
            date,
            time,
            notes,
            status: 'pending'
        };
        
        console.log('Reservation data:', reservationData);
        
        // Call API to create reservation
        const tableId = selectedTable._id || selectedTable.id;
        const result = await createReservation(tableId, reservationData);
        
        console.log('Reservation result:', result);
        
        if (result.success) {
            showAlert('Đặt bàn thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.', 'success');
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'reservation-history.html';
            }, 2000);
        } else {
            throw new Error(result.error || 'Đặt bàn thất bại');
        }
    } catch (error) {
        console.error('❌ Error creating reservation:', error);
        showAlert('Không thể đặt bàn: ' + error.message, 'error');
        
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertEl = document.getElementById('alertMessage');
    if (!alertEl) return;
    
    alertEl.className = `p-4 rounded-lg mb-6 ${
        type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' :
        type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' :
        'bg-blue-100 text-blue-700 border border-blue-300'
    }`;
    
    alertEl.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    alertEl.classList.remove('hidden');
    
    // Scroll to top to show alert
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto hide after 5 seconds for non-success messages
    if (type !== 'success') {
        setTimeout(() => {
            alertEl.classList.add('hidden');
        }, 5000);
    }
}

// Show success message
function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in';
    message.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-check-circle text-2xl"></i>
            <div>
                <p class="font-semibold">Đặt bàn thành công!</p>
                <p class="text-sm">Chúng tôi sẽ xác nhận trong giây lát</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.classList.add('animate-fade-out');
        setTimeout(() => message.remove(), 300);
    }, 4000);
}

// Show error
function showError(message) {
    const tablesContainer = document.getElementById('tablesContainer');
    if (tablesContainer) {
        tablesContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-circle text-6xl text-red-400 mb-4"></i>
                <p class="text-xl text-gray-700 mb-2">${message}</p>
                <button onclick="location.reload()" class="mt-4 bg-coffee text-white px-6 py-2 rounded-full hover:bg-coffee-dark transition-colors">
                    <i class="fas fa-redo mr-2"></i>Thử lại
                </button>
            </div>
        `;
    }
}

// Filter tables by capacity
function filterByCapacity(minCapacity) {
    const filteredTables = availableTables.filter(table => table.capacity >= minCapacity);
    
    const tablesContainer = document.getElementById('tablesContainer');
    if (tablesContainer && filteredTables.length > 0) {
        tablesContainer.innerHTML = filteredTables.map(table => createTableCard(table)).join('');
    } else if (tablesContainer) {
        tablesContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-info-circle text-6xl text-gray-300 mb-4"></i>
                <p class="text-xl text-gray-500">Không tìm thấy bàn phù hợp</p>
            </div>
        `;
    }
}
