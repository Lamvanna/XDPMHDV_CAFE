// Orders page JavaScript - Enhanced version with full features
let userOrders = [];
let filteredOrders = [];
let currentFilter = "all";
let currentOrderDetail = null;

// Initialize page
document.addEventListener("DOMContentLoaded", async function() {
    console.log('🚀 Initializing orders page...');
    
    // Check authentication
    const user = getCurrentUser();
    if (!user) {
        alert("Vui lòng đăng nhập để xem đơn hàng");
        window.location.href = "login.html";
        return;
    }
    
    // Load orders
    await loadUserOrders();
    
    // Initialize filters
    initializeFilters();
    
    console.log('✅ Orders page initialized');
});

// Load user orders
async function loadUserOrders() {
    try {
        showLoadingState();
        
        const user = getCurrentUser();
        const userId = user._id || user.id;
        
        console.log('📦 Loading orders for user:', userId);
        
        // Fetch orders from API
        const orders = await fetchOrders(userId);
        
        console.log('📥 Raw orders data:', orders);
        if (orders.length > 0) {
            console.log('📝 First order structure:', orders[0]);
            if (orders[0].items && orders[0].items.length > 0) {
                console.log('🛒 First item structure:', orders[0].items[0]);
            }
        }
        
        // Sort by date (newest first)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        userOrders = orders;
        filteredOrders = [...userOrders];
        
        console.log('✅ Loaded orders:', orders.length);
        
        // Render orders
        renderOrders();
        
        // Update statistics
        updateStatistics();
        
    } catch (error) {
        console.error("❌ Error loading orders:", error);
        showErrorState(error.message);
    }
}

// Initialize filter buttons
function initializeFilters() {
    const filterButtons = document.querySelectorAll("[data-filter]");
    
    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            const filter = button.getAttribute("data-filter");
            applyFilter(filter);
            
            // Update button styles
            filterButtons.forEach(btn => {
                btn.classList.remove("active", "bg-coffee", "text-white");
                btn.classList.add("bg-gray-200", "text-gray-700");
            });
            
            button.classList.remove("bg-gray-200", "text-gray-700");
            button.classList.add("active", "bg-coffee", "text-white");
        });
    });
}

// Apply filter
function applyFilter(filter) {
    currentFilter = filter;
    
    if (filter === "all") {
        filteredOrders = [...userOrders];
    } else {
        filteredOrders = userOrders.filter(o => 
            o.status && o.status.toLowerCase() === filter
        );
    }
    
    renderOrders();
}

// Render orders list
function renderOrders() {
    const container = document.getElementById("ordersList");
    const loading = document.getElementById("loading");
    const noOrders = document.getElementById("noOrders");
    
    if (!container) return;
    
    // Hide loading
    if (loading) loading.classList.add("hidden");
    
    // Check if empty
    if (filteredOrders.length === 0) {
        if (noOrders) noOrders.classList.remove("hidden");
        container.innerHTML = '';
        return;
    }
    
    // Hide no orders message
    if (noOrders) noOrders.classList.add("hidden");
    
    // Render order cards
    container.innerHTML = filteredOrders.map(order => createOrderCard(order)).join("");
}

// Create order card HTML with product image
function createOrderCard(order) {
    const status = order.status || "pending";
    const statusConfig = getOrderStatusConfig(status);
    const total = calculateOrderTotal(order);
    const orderDate = formatDateTime(order.createdAt);
    const orderId = order._id ? order._id.substring(0, 8).toUpperCase() : "N/A";
    
    // Get first product image
    let productImage = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80';
    let additionalProductsCount = 0;
    
    if (order.items && order.items.length > 0) {
        const firstItem = order.items[0];
        console.log('🖼️ First item for order', orderId, ':', firstItem);
        
        let rawImage = null;
        
        // Check multiple possible lo
        // cations for image
        if (firstItem.product && firstItem.product.image) {
            rawImage = firstItem.product.image;
            console.log('✅ Found image in product:', rawImage);
        } else if (firstItem.productId && firstItem.productId.image) {
            rawImage = firstItem.productId.image;
            console.log('✅ Found image in productId:', rawImage);
        } else if (firstItem.image) {
            rawImage = firstItem.image;
            console.log('✅ Found image in item:', rawImage);
        } else {
            console.log('❌ No image found in item. Keys:', Object.keys(firstItem));
        }
        
        // Process image path
        if (rawImage) {
            if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
                productImage = rawImage;
            } else if (rawImage.startsWith('/uploads/')) {
                productImage = `http://localhost:3000${rawImage}`;
            } else if (rawImage.startsWith('uploads/')) {
                productImage = `http://localhost:3000/${rawImage}`;
            } else if (rawImage.startsWith('/')) {
                productImage = `http://localhost:3000${rawImage}`;
            } else {
                productImage = rawImage;
            }
            console.log('📸 Final image URL:', productImage);
        }
        
        additionalProductsCount = order.items.length - 1;
    }
    
    return `
        <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 ${statusConfig.borderColor} cursor-pointer" 
             onclick="viewOrderDetail('${order._id}')">
            <div class="flex flex-col md:flex-row">
                <!-- Product Image -->
                <div class="md:w-32 h-32 flex-shrink-0 bg-gray-100 relative">
                    <img src="${productImage}" 
                         alt="Product" 
                         class="w-full h-full object-cover"
                         onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80'">
                    ${additionalProductsCount > 0 ? `
                        <div class="absolute bottom-2 right-2 bg-coffee text-white text-xs px-2 py-1 rounded-full font-semibold">
                            +${additionalProductsCount}
                        </div>
                    ` : ''}
                </div>
                
                <!-- Order Info -->
                <div class="flex-1 p-4">
                    <div class="flex flex-col md:flex-row md:items-start md:justify-between">
                        <!-- Left Side -->
                        <div class="flex-1 mb-3 md:mb-0">
                            <div class="flex items-center space-x-3 mb-2">
                                <span class="${statusConfig.badgeClass} px-3 py-1 rounded-full text-xs font-semibold">
                                    ${statusConfig.icon} ${statusConfig.label}
                                </span>
                            </div>
                            
                            <h3 class="text-xl font-bold text-coffee mb-1">
                                <i class="fas fa-receipt mr-2"></i>#${orderId}
                            </h3>
                            
                            <p class="text-sm text-gray-600 mb-2">
                                <i class="fas fa-calendar-alt mr-2"></i>${orderDate}
                            </p>
                            
                            <p class="text-sm text-gray-600">
                                <i class="fas fa-box mr-2"></i>${order.items ? order.items.length : 0} sản phẩm
                            </p>
                        </div>
                        
                        <!-- Right Side -->
                        <div class="text-left md:text-right">
                            <div class="text-2xl font-bold text-coffee mb-2">${formatPrice(total)}</div>
                            
                            <div class="flex md:flex-col gap-2">
                                ${status === "pending" ? `
                                    <button onclick="event.stopPropagation(); cancelOrder('${order._id}')" 
                                            class="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors">
                                        <i class="fas fa-times mr-1"></i>Hủy
                                    </button>
                                ` : ''}
                                
                                <button onclick="event.stopPropagation(); viewOrderDetail('${order._id}')" 
                                        class="px-4 py-2 bg-coffee text-white rounded-lg text-sm font-semibold hover:bg-coffee-dark transition-colors">
                                    <i class="fas fa-eye mr-1"></i>Chi tiết
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Get order status configuration
function getOrderStatusConfig(status) {
    const configs = {
        pending: {
            label: "Chờ xác nhận",
            icon: '<i class="fas fa-clock"></i>',
            badgeClass: "bg-yellow-100 text-yellow-700 border border-yellow-300",
            borderColor: "border-yellow-400"
        },
        confirmed: {
            label: "Đã xác nhận",
            icon: '<i class="fas fa-check"></i>',
            badgeClass: "bg-blue-100 text-blue-700 border border-blue-300",
            borderColor: "border-blue-400"
        },
        preparing: {
            label: "Đang chuẩn bị",
            icon: '<i class="fas fa-blender"></i>',
            badgeClass: "bg-purple-100 text-purple-700 border border-purple-300",
            borderColor: "border-purple-400"
        },
        delivering: {
            label: "Đang giao",
            icon: '<i class="fas fa-shipping-fast"></i>',
            badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-300",
            borderColor: "border-indigo-400"
        },
        completed: {
            label: "Hoàn thành",
            icon: '<i class="fas fa-check-double"></i>',
            badgeClass: "bg-green-100 text-green-700 border border-green-300",
            borderColor: "border-green-400"
        },
        cancelled: {
            label: "Đã hủy",
            icon: '<i class="fas fa-times"></i>',
            badgeClass: "bg-red-100 text-red-700 border border-red-300",
            borderColor: "border-red-400"
        }
    };
    
    return configs[status] || configs.pending;
}

// Calculate order total
function calculateOrderTotal(order) {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// View order detail in modal
function viewOrderDetail(orderId) {
    const order = userOrders.find(o => o._id === orderId);
    if (!order) {
        alert('Không tìm thấy đơn hàng');
        return;
    }
    
    currentOrderDetail = order;
    
    // Populate modal
    const modal = document.getElementById('orderDetailModal');
    const orderIdEl = document.getElementById('modalOrderId');
    const orderDateEl = document.getElementById('modalOrderDate');
    const orderStatusEl = document.getElementById('modalOrderStatus');
    const productsListEl = document.getElementById('modalProductsList');
    const subtotalEl = document.getElementById('modalSubtotal');
    const shippingFeeEl = document.getElementById('modalShippingFee');
    const discountEl = document.getElementById('modalDiscount');
    const totalEl = document.getElementById('modalTotal');
    const customerNameEl = document.getElementById('modalCustomerName');
    const customerPhoneEl = document.getElementById('modalCustomerPhone');
    const deliveryAddressEl = document.getElementById('modalDeliveryAddress');
    const notesEl = document.getElementById('modalNotes');
    const cancelBtnEl = document.getElementById('modalCancelBtn');
    
    // Set order ID and date
    if (orderIdEl) orderIdEl.textContent = `Đơn hàng #${order._id.substring(0, 8).toUpperCase()}`;
    if (orderDateEl) orderDateEl.textContent = `Ngày đặt: ${formatDateTime(order.createdAt)}`;
    
    // Set status
    const statusConfig = getOrderStatusConfig(order.status);
    if (orderStatusEl) {
        orderStatusEl.className = `px-4 py-2 rounded-full text-sm font-semibold inline-block ${statusConfig.badgeClass}`;
        orderStatusEl.innerHTML = `${statusConfig.icon} ${statusConfig.label}`;
    }
    
    // Set products list
    if (productsListEl && order.items) {
        productsListEl.innerHTML = order.items.map(item => {
            // Get product name from multiple possible locations
            const productName = (item.product && item.product.name) || 
                               (item.productId && item.productId.name) || 
                               item.name || 
                               'Sản phẩm';
            
            let rawImage = null;
            
            // Check multiple possible locations for image
            if (item.product && item.product.image) {
                rawImage = item.product.image;
            } else if (item.productId && item.productId.image) {
                rawImage = item.productId.image;
            } else if (item.image) {
                rawImage = item.image;
            }
            
            let productImage = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80';
            
            // Process image path
            if (rawImage) {
                if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
                    productImage = rawImage;
                } else if (rawImage.startsWith('/uploads/')) {
                    productImage = `http://localhost:3000${rawImage}`;
                } else if (rawImage.startsWith('uploads/')) {
                    productImage = `http://localhost:3000/${rawImage}`;
                } else if (rawImage.startsWith('/')) {
                    productImage = `http://localhost:3000${rawImage}`;
                } else {
                    productImage = rawImage;
                }
            }
            
            return `
                <div class="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg">
                    <img src="${productImage}" 
                         alt="${productName}" 
                         class="w-16 h-16 object-cover rounded-lg"
                         onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80'">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800">${productName}</h4>
                        <p class="text-sm text-gray-600">Số lượng: ${item.quantity}</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-coffee">${formatPrice(item.price * item.quantity)}</div>
                        <div class="text-xs text-gray-500">${formatPrice(item.price)}/sp</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Calculate totals
    const subtotal = calculateOrderTotal(order);
    const shippingFee = order.shippingFee || 0;
    const discount = order.discount || 0;
    const total = subtotal + shippingFee - discount;
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingFeeEl) shippingFeeEl.textContent = formatPrice(shippingFee);
    if (discountEl) discountEl.textContent = `-${formatPrice(discount)}`;
    if (totalEl) totalEl.textContent = formatPrice(total);
    
    // Set delivery info
    const user = getCurrentUser();
    const orderUser = order.user || user;
    
    // Use order fields if available, fallback to parsing notes or user info
    let customerName = order.customerName || '';
    let customerPhone = order.customerPhone || '';
    let deliveryAddress = order.deliveryAddress || '';
    let orderNotes = '';
    
    // If no customerName, try parsing from notes (for old orders)
    if (!customerName && order.notes && order.notes.includes(' - ')) {
        const notesParts = order.notes.split('\n');
        const firstLine = notesParts[0];
        const infoParts = firstLine.split(' - ');
        
        if (infoParts.length >= 3) {
            customerName = infoParts[0].trim();
            customerPhone = infoParts[1].trim();
            deliveryAddress = infoParts[2].trim();
            
            // Remaining lines are actual notes
            if (notesParts.length > 1) {
                orderNotes = notesParts.slice(1).join('\n').trim();
            }
        } else {
            orderNotes = order.notes;
        }
    } else {
        orderNotes = order.notes || '';
    }
    
    // Fallback to user info if still empty
    if (!customerName) {
        customerName = orderUser.name || orderUser.username || user.name || user.username || 'Khách hàng';
    }
    if (!customerPhone) {
        customerPhone = orderUser.phone || user.phone || '--';
    }
    
    // Determine delivery address if not set
    if (!deliveryAddress) {
        if (order.orderType === 'takeaway') {
            deliveryAddress = 'Lấy tại quán';
        } else if (order.orderType === 'dine-in') {
            deliveryAddress = 'Dùng tại chỗ';
            if (order.table) {
                const tableInfo = order.table.number || order.table;
                deliveryAddress += ` - Bàn ${tableInfo}`;
            }
        } else if (order.orderType === 'delivery') {
            // For delivery, try to get address from user profile
            deliveryAddress = orderUser.address || user.address || 'Địa chỉ: Chưa cập nhật trong hồ sơ';
        } else {
            deliveryAddress = 'Lấy tại quán';
        }
    }
    
    // Final notes fallback
    if (!orderNotes || orderNotes.trim() === '') {
        orderNotes = 'Không có ghi chú';
    }
    
    if (customerNameEl) customerNameEl.textContent = customerName;
    if (customerPhoneEl) customerPhoneEl.textContent = customerPhone;
    if (deliveryAddressEl) deliveryAddressEl.textContent = deliveryAddress;
    if (notesEl) notesEl.textContent = orderNotes;
    
    // Show/hide cancel button
    if (cancelBtnEl) {
        if (order.status === 'pending' || order.status === 'confirmed') {
            cancelBtnEl.classList.remove('hidden');
        } else {
            cancelBtnEl.classList.add('hidden');
        }
    }
    
    // Show modal
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

// Close order detail modal
function closeOrderDetail() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    currentOrderDetail = null;
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    
    try {
        const token = getAuthToken();
        if (!token) {
            alert('Vui lòng đăng nhập lại');
            window.location.href = 'login.html';
            return;
        }
        
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: "cancelled" })
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || result.message || "Không thể hủy đơn hàng");
        }
        
        showNotification("Hủy đơn hàng thành công!", "success");
        
        // Reload orders to update UI
        await loadUserOrders();
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification(error.message || "Có lỗi xảy ra khi hủy đơn hàng", "error");
    }
}

// Cancel order from modal
function cancelOrderFromModal() {
    if (!currentOrderDetail || !currentOrderDetail._id) {
        showNotification('Không tìm thấy thông tin đơn hàng', 'error');
        return;
    }
    
    const orderId = currentOrderDetail._id; // Save ID before closing modal
    closeOrderDetail();
    cancelOrder(orderId);
}

// Reorder from modal
function reorderFromModal() {
    if (!currentOrderDetail) {
        showNotification('Không tìm thấy thông tin đơn hàng', 'error');
        return;
    }
    
    console.log('🔄 Reordering from:', currentOrderDetail);
    
    // Add all items to cart
    if (currentOrderDetail.items && currentOrderDetail.items.length > 0) {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        let addedCount = 0;
        let skippedCount = 0;
        
        currentOrderDetail.items.forEach(item => {
            // Get product info from multiple possible locations
            const product = item.product || item.productId || {};
            const productId = product._id || product.id;
            const productName = product.name || item.name || 'Sản phẩm';
            const productPrice = item.price || product.price || 0;
            const productImage = product.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80';
            const quantity = item.quantity || 1;
            
            console.log('📦 Item data:', { 
                productId, 
                productName, 
                productPrice, 
                quantity,
                hasProduct: !!product,
                productKeys: Object.keys(product)
            });
            
            if (productId) {
                // Check if item already exists in cart
                const existingIndex = cart.findIndex(c => c.id === productId);
                
                if (existingIndex >= 0) {
                    // Update quantity
                    cart[existingIndex].quantity += quantity;
                } else {
                    // Add new item
                    cart.push({
                        id: productId,
                        name: productName,
                        price: productPrice,
                        quantity: quantity,
                        image: productImage
                    });
                }
                addedCount++;
            } else {
                console.warn('⚠️ Skipped item - no product ID:', item);
                skippedCount++;
            }
        });
        
        // Save cart
        localStorage.setItem('cart', JSON.stringify(cart));
        
        console.log('✅ Cart updated:', { addedCount, skippedCount, cartLength: cart.length });
        
        if (addedCount > 0) {
            closeOrderDetail();
            showNotification(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng!`, 'success');
            
            if (skippedCount > 0) {
                setTimeout(() => {
                    showNotification(`${skippedCount} sản phẩm không còn tồn tại`, 'info');
                }, 500);
            }
            
            // Redirect to cart after a short delay
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 1500);
        } else {
            showNotification('Không có sản phẩm hợp lệ để đặt lại', 'error');
        }
    } else {
        showNotification('Không có sản phẩm để đặt lại', 'error');
    }
}

// Update statistics
function updateStatistics() {
    const total = userOrders.length;
    const pending = userOrders.filter(o => o.status === "pending").length;
    const completed = userOrders.filter(o => o.status === "completed").length;
    const totalSpent = userOrders
        .filter(o => o.status === "completed")
        .reduce((sum, o) => sum + calculateOrderTotal(o), 0);
    
    const totalOrdersEl = document.getElementById("totalOrders");
    const pendingOrdersEl = document.getElementById("pendingOrders");
    const completedOrdersEl = document.getElementById("completedOrders");
    const totalSpentEl = document.getElementById("totalSpent");
    
    if (totalOrdersEl) totalOrdersEl.textContent = total;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pending;
    if (completedOrdersEl) completedOrdersEl.textContent = completed;
    if (totalSpentEl) totalSpentEl.textContent = formatPrice(totalSpent);
}

// Show loading state
function showLoadingState() {
    const el = document.getElementById("loading");
    if (el) el.classList.remove("hidden");
}

// Show error state
function showErrorState(msg) {
    const loading = document.getElementById("loading");
    const container = document.getElementById("ordersList");
    
    if (loading) loading.classList.add("hidden");
    
    if (container) {
        container.innerHTML = `
            <div class="text-center py-16 bg-white rounded-lg shadow-md">
                <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
                <h3 class="text-2xl font-bold text-gray-700 mb-2">Có lỗi xảy ra</h3>
                <p class="text-gray-600 mb-6">${msg}</p>
                <button onclick="location.reload()" class="bg-coffee text-white px-6 py-3 rounded-lg font-semibold hover:bg-coffee-dark transition-colors">
                    <i class="fas fa-redo mr-2"></i>Thử lại
                </button>
            </div>
        `;
    }
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
    }).format(price);
}

// Format date time
function formatDateTime(dateStr) {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('orderDetailModal');
    if (modal && event.target === modal) {
        closeOrderDetail();
    }
});

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        type === 'info' ? 'bg-blue-500 text-white' : 
        'bg-gray-500 text-white'
    }`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'info' ? 'info-circle' : 'bell';
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
