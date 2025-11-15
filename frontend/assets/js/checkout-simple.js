// Simple Checkout JavaScript - Easy to debug
console.log('✅ Checkout script loaded');

let cart = [];
let orderData = {
    subtotal: 0,
    deliveryFee: 20000,
    discount: 0,
    total: 0,
    promotion: null
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Page loaded, initializing checkout...');

    // Step 1: Check login
    if (!checkLogin()) {
        console.log('❌ Not logged in, redirecting...');
        alert('Vui lòng đăng nhập để tiếp tục!');
        window.location.href = 'login.html';
        return;
    }
    console.log('✅ User is logged in');

    // Step 2: Load cart
    loadCart();
    console.log('📦 Cart loaded:', cart);

    // Step 3: Check if cart is empty
    if (cart.length === 0) {
        console.log('❌ Cart is empty, redirecting...');
        alert('Giỏ hàng trống! Vui lòng thêm sản phẩm.');
        window.location.href = 'cart.html';
        return;
    }
    console.log('✅ Cart has', cart.length, 'items');

    // Step 4: Display cart
    displayCart();

    // Step 5: Calculate totals (must be before loadPromotion)
    calculateTotals();

    // Step 6: Load promotion (after subtotal is calculated)
    loadPromotion();

    // Step 7: Recalculate total with discount
    calculateFinalTotal();

    // Step 8: Pre-fill user info
    prefillUserInfo();

    // Step 9: Setup button
    setupButton();

    console.log('✅ Checkout initialized successfully');
});

// Check if user is logged in
function checkLogin() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return !!token;
}

// Load cart from localStorage
function loadCart() {
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            cart = JSON.parse(cartData);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }
}

// Display cart items
function displayCart() {
    const cartSummary = document.getElementById('cartSummary');
    if (!cartSummary) {
        console.error('❌ cartSummary element not found!');
        return;
    }

    let html = '';
    cart.forEach(item => {
        const image = item.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=60&q=80';
        const itemTotal = item.price * item.quantity;

        html += `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img src="${image}" 
                     alt="${item.name}" 
                     class="w-16 h-16 object-cover rounded-lg"
                     onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=60&q=80'">
                <div class="flex-1">
                    <h3 class="font-semibold text-sm">${item.name}</h3>
                    <p class="text-xs text-gray-600">${formatPrice(item.price)} x ${item.quantity}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-semibold text-coffee">${formatPrice(itemTotal)}</p>
                </div>
            </div>
        `;
    });

    cartSummary.innerHTML = html;
    console.log('✅ Cart displayed');
}

// Load promotion from localStorage
function loadPromotion() {
    try {
        const promoStr = localStorage.getItem('appliedPromotion');
        if (promoStr) {
            const promo = JSON.parse(promoStr);
            orderData.promotion = promo;

            // Calculate discount based on CURRENT subtotal
            if (promo.discountType === 'percentage') {
                orderData.discount = Math.round((orderData.subtotal * promo.discountValue) / 100);
                if (promo.maxDiscount && orderData.discount > promo.maxDiscount) {
                    orderData.discount = promo.maxDiscount;
                }
            } else {
                orderData.discount = promo.discountValue;
            }

            console.log('🎟️ Promotion loaded:', promo);
            console.log('💰 Discount calculated on subtotal', orderData.subtotal, '=', orderData.discount);
        }
    } catch (error) {
        console.error('Error loading promotion:', error);
    }
}

// Calculate final total with discount
function calculateFinalTotal() {
    orderData.total = orderData.subtotal + orderData.deliveryFee - orderData.discount;
    console.log('💰 Final total calculated:', orderData);
    updateTotalsDisplay();
}

// Calculate totals
function calculateTotals() {
    // Calculate subtotal
    orderData.subtotal = 0;
    cart.forEach(item => {
        orderData.subtotal += item.price * item.quantity;
    });

    // Free shipping if over 200k
    if (orderData.subtotal >= 200000) {
        orderData.deliveryFee = 0;
    } else {
        orderData.deliveryFee = 20000;
    }

    // Calculate total (without discount first)
    orderData.total = orderData.subtotal + orderData.deliveryFee;

    console.log('💰 Base totals calculated (before discount):', orderData);

    // Don't update display yet - will update after loading promotion
}

// Update totals display
function updateTotalsDisplay() {
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');

    if (subtotalEl) {
        subtotalEl.textContent = formatPrice(orderData.subtotal);
    }

    if (shippingEl) {
        if (orderData.deliveryFee === 0) {
            shippingEl.textContent = 'Miễn phí';
            shippingEl.classList.add('text-green-600');
        } else {
            shippingEl.textContent = formatPrice(orderData.deliveryFee);
        }
    }

    // Display discount if applied
    if (orderData.discount > 0 && orderData.promotion) {
        displayDiscount();
    }

    if (totalEl) {
        totalEl.textContent = formatPrice(orderData.total);
    }

    console.log('✅ Totals display updated');
}

// Display discount row
function displayDiscount() {
    const subtotalEl = document.getElementById('subtotal');
    if (!subtotalEl) return;

    const summaryContainer = subtotalEl.closest('.space-y-2');
    if (!summaryContainer) return;

    // Check if discount row already exists
    let discountRow = summaryContainer.querySelector('.discount-row');

    if (!discountRow) {
        discountRow = document.createElement('div');
        discountRow.className = 'flex justify-between text-green-600 discount-row';
        discountRow.innerHTML = `
            <span>Giảm giá <span class="text-xs font-normal">(${orderData.promotion.code})</span></span>
            <span class="font-semibold">-${formatPrice(orderData.discount)}</span>
        `;

        const totalRow = summaryContainer.querySelector('.text-coffee.border-t');
        if (totalRow) {
            summaryContainer.insertBefore(discountRow, totalRow);
        }
    }
}

// Pre-fill user information
function prefillUserInfo() {
    try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);

            if (user.name && document.getElementById('fullName')) {
                document.getElementById('fullName').value = user.name;
            }
            if (user.phone && document.getElementById('phone')) {
                document.getElementById('phone').value = user.phone;
            }
            if (user.email && document.getElementById('email')) {
                document.getElementById('email').value = user.email;
            }
            if (user.address && document.getElementById('address')) {
                document.getElementById('address').value = user.address;
            }

            console.log('✅ User info pre-filled');
        }
    } catch (error) {
        console.error('Error pre-filling user info:', error);
    }
}

// Setup button click handler
function setupButton() {
    const button = document.getElementById('placeOrderBtn');
    if (!button) {
        console.error('❌ Button not found!');
        return;
    }

    button.addEventListener('click', function () {
        console.log('🖱️ Button clicked!');
        placeOrder();
    });

    console.log('✅ Button setup complete');
}

// Main function to place order
async function placeOrder() {
    console.log('📝 Starting order placement...');

    // Get form values
    const fullName = document.getElementById('fullName')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const address = document.getElementById('address')?.value.trim();
    const notes = document.getElementById('notes')?.value.trim() || '';

    // Get payment method
    const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentRadio ? paymentRadio.value : 'cod';

    console.log('📋 Form data:', { fullName, phone, address, paymentMethod });

    // Validate
    if (!fullName || !phone || !address) {
        alert('Vui lòng điền đầy đủ thông tin!');
        console.log('❌ Validation failed');
        return;
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone)) {
        alert('Số điện thoại không hợp lệ! (10-11 số)');
        console.log('❌ Phone validation failed');
        return;
    }

    console.log('✅ Validation passed');

    // Show loading
    const button = document.getElementById('placeOrderBtn');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...';
    button.disabled = true;

    try {
        // Prepare order data
        const orderItems = cart.map(item => ({
            product: item.id,
            quantity: item.quantity,
            price: item.price
        }));

        const orderPayload = {
            items: orderItems,
            total: orderData.total,
            orderType: 'delivery',
            notes: notes,
            paymentMethod: paymentMethod === 'cod' ? 'cash' : 'online',
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
            customerName: fullName,
            customerPhone: phone,
            deliveryAddress: address,
            deliveryFee: orderData.deliveryFee,
            discount: orderData.discount,
            promotionCode: orderData.promotion ? orderData.promotion.code : null
        };

        console.log('📤 Sending order to API:', orderPayload);

        // Send to API
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || sessionStorage.getItem('authToken'))
            },
            body: JSON.stringify(orderPayload)
        });

        const result = await response.json();
        console.log('📥 API response:', result);

        if (response.ok && result.success) {
            console.log('✅ Order created successfully!');

            // Clear cart
            localStorage.removeItem('cart');

            // Show success
            const orderNumber = '#CH' + result.order._id.slice(-6).toUpperCase();
            alert('Đặt hàng thành công!\nMã đơn hàng: ' + orderNumber);

            // Redirect
            window.location.href = 'my-orders.html';
        } else {
            throw new Error(result.error || 'Không thể tạo đơn hàng');
        }

    } catch (error) {
        console.error('❌ Error placing order:', error);
        alert('Có lỗi xảy ra: ' + error.message);

        // Reset button
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Format price helper
function formatPrice(price) {
    if (typeof price !== 'number') {
        price = parseFloat(price) || 0;
    }
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Make placeOrder available globally
window.placeOrder = placeOrder;

console.log('✅ All functions loaded');
