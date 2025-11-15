// Order data
let orderData = {
    subtotal: 0,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    total: 0,
    promotion: null
};

// Update delivery fee based on selected method
function updateDeliveryFee() {
    const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
    if (!selectedDelivery) return;
    
    const deliveryValue = selectedDelivery.value;
    let fee = 0;
    let feeText = 'Miễn phí';
    
    if (deliveryValue === 'express') {
        fee = 25000;
        feeText = formatPrice(fee);
    }
    
    orderData.deliveryFee = fee;
    
    // Update shipping element
    const shippingEl = document.getElementById('shipping');
    if (shippingEl) {
        shippingEl.textContent = fee > 0 ? feeText : 'Miễn phí';
    }
    
    updateOrderTotal();
}

// Update order total
function updateOrderTotal() {
    orderData.total = orderData.subtotal + orderData.deliveryFee - orderData.discount;
    
    // Update total element
    const totalEl = document.getElementById('total');
    if (totalEl) {
        totalEl.textContent = formatPrice(orderData.total);
    }
}

// Form validation
function validateForm() {
    const requiredFields = ['fullName', 'phone', 'address'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        
        // Remove existing error styling
        field.classList.remove('border-red-500', 'ring-red-500');
        
        if (!value) {
            field.classList.add('border-red-500', 'ring-red-500');
            isValid = false;
        }
    });
    
    // Phone validation
    const phone = document.getElementById('phone').value.trim();
    const phoneRegex = /^[0-9]{10,11}$/;
    if (phone && !phoneRegex.test(phone)) {
        document.getElementById('phone').classList.add('border-red-500', 'ring-red-500');
        showNotification('Số điện thoại không hợp lệ!', 'error');
        isValid = false;
    }
    
    // Email validation (if provided)
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        document.getElementById('email').classList.add('border-red-500', 'ring-red-500');
        showNotification('Email không hợp lệ!', 'error');
        isValid = false;
    }
    
    if (!isValid) {
        showNotification('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
    }
    
    return isValid;
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // Check if user is logged in
    if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
        showNotification('Vui lòng đăng nhập để đặt hàng!', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...';
    submitBtn.disabled = true;
    
    try {
        // Get cart from localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            throw new Error('Giỏ hàng trống');
        }
        
        // Get form data
        const fullName = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();
        const notes = document.getElementById('notes').value.trim();
        const deliveryMethod = document.querySelector('input[name="delivery"]:checked').value;
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        // Prepare order items
        const items = cart.map(item => ({
            product: item.id,
            quantity: item.quantity,
            price: item.price
        }));
        
        // Calculate total with discount
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = deliveryMethod === 'express' ? 25000 : 0;
        const discount = orderData.discount || 0;
        const total = subtotal + deliveryFee - discount;
        
        // Prepare order data
        const orderPayload = {
            items: items,
            total: total,
            subtotal: subtotal,
            discount: discount,
            orderType: deliveryMethod === 'standard' || deliveryMethod === 'express' ? 'delivery' : 'takeaway',
            customerName: fullName,
            customerPhone: phone,
            deliveryAddress: address,
            notes: notes || '',
            paymentMethod: paymentMethod === 'credit-card' ? 'card' : paymentMethod === 'momo' || paymentMethod === 'bank-transfer' ? 'online' : 'cash',
            paymentStatus: 'pending'
        };
        
        // Add promotion code if applied
        if (orderData.promotion && orderData.promotion.code) {
            orderPayload.promotionCode = orderData.promotion.code;
        }
        
        // Create order via API
        const result = await createOrder(orderPayload);
        
        if (result && result.success) {
            // Clear cart and promotion
            localStorage.removeItem('cart');
            localStorage.removeItem('appliedPromotion');
            
            // Generate order number display
            const orderNumber = '#CH' + result.order._id.slice(-6).toUpperCase();
            const orderNumberEl = document.getElementById('orderNumber');
            if (orderNumberEl) {
                orderNumberEl.textContent = orderNumber;
            }
            
            // Show success modal
            const successModal = document.getElementById('successModal');
            if (successModal) {
                successModal.classList.remove('hidden');
            } else {
                showNotification('Đặt hàng thành công!', 'success');
                setTimeout(() => {
                    window.location.href = 'my-orders.html';
                }, 1500);
            }
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        } else {
            throw new Error('Không thể tạo đơn hàng');
        }
        
    } catch (error) {
        console.error('Order creation error:', error);
        showNotification(error.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!', 'error');
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Go back to cart
function goBackToCart() {
    window.location.href = '/cart';
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
}

// Go to home page
function goToHome() {
    window.location.href = '/';
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'info' ? 'bg-blue-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'info' ? 'info' : type === 'error' ? 'exclamation' : 'bell'}-circle"></i>
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
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Load and display cart items
function loadCartItems() {
    console.log('🔄 Loading cart items...');
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    console.log('🛒 Cart from localStorage:', cart);
    
    if (cart.length === 0) {
        // Redirect to cart if empty
        showNotification('Giỏ hàng trống!', 'error');
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 1500);
        return;
    }
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Load promotion from localStorage (if applied in cart)
    const appliedPromo = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    let discount = 0;
    
    console.log('🎟️ Loaded promotion from localStorage:', appliedPromo);
    
    if (appliedPromo) {
        orderData.promotion = appliedPromo;
        // Calculate discount
        if (appliedPromo.discountType === 'percentage') {
            discount = Math.round((subtotal * appliedPromo.discountValue) / 100);
            if (appliedPromo.maxDiscount && discount > appliedPromo.maxDiscount) {
                discount = appliedPromo.maxDiscount;
            }
        } else {
            discount = appliedPromo.discountValue;
        }
        console.log('💰 Calculated discount:', discount);
    }
    
    orderData.subtotal = subtotal;
    orderData.discount = discount;
    
    console.log('📊 Order data:', { subtotal, discount, deliveryFee: orderData.deliveryFee, total: orderData.total });
    
    // Update summary section
    const subtotalEl = document.getElementById('subtotal');
    if (subtotalEl) {
        subtotalEl.textContent = formatPrice(subtotal);
    }
    
    // Show discount if applied
    if (discount > 0) {
        displayDiscount(discount, appliedPromo.code);
    }
    
    updateOrderTotal();
    
    // Display cart items if container exists
    const cartItemsContainer = document.querySelector('.cart-items-container');
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img src="${item.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=60&q=80'}" 
                     alt="${item.name}" 
                     class="w-12 h-12 object-cover rounded-lg"
                     onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=60&q=80'">
                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-900 text-sm truncate">${item.name}</h3>
                    <p class="text-xs text-gray-600">${item.size ? `Size: ${item.size}` : ''}</p>
                    <div class="flex items-center justify-between mt-1">
                        <span class="text-xs text-gray-600">x${item.quantity}</span>
                        <span class="text-sm font-semibold text-coffee">${formatPrice(item.price * item.quantity)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Display discount in summary
function displayDiscount(discount, promoCode) {
    // Find the summary container
    const subtotalEl = document.getElementById('subtotal');
    if (!subtotalEl) return;
    
    // Get the parent container (the one with space-y-2 class)
    const summaryContainer = subtotalEl.closest('.space-y-2');
    if (!summaryContainer) return;
    
    // Check if discount row already exists
    let discountRow = summaryContainer.querySelector('.discount-row');
    
    if (!discountRow) {
        // Create discount row
        discountRow = document.createElement('div');
        discountRow.className = 'flex justify-between text-green-600 discount-row';
        discountRow.innerHTML = `
            <span>Giảm giá <span class="text-xs font-normal">(${promoCode})</span></span>
            <span class="discount-amount font-semibold">-${formatPrice(discount)}</span>
        `;
        
        // Find the total row (has border-t and text-coffee classes)
        const totalRow = summaryContainer.querySelector('.text-coffee.border-t');
        if (totalRow) {
            // Insert discount row before total row
            summaryContainer.insertBefore(discountRow, totalRow);
        }
    } else {
        // Update existing discount amount
        const discountAmountEl = discountRow.querySelector('.discount-amount');
        if (discountAmountEl) {
            discountAmountEl.textContent = `-${formatPrice(discount)}`;
        }
    }
}

// Format price helper
function formatPrice(price) {
    // Check if price is valid
    if (typeof price !== 'number' || isNaN(price)) {
        return '0₫';
    }
    return price.toLocaleString('vi-VN') + '₫';
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Checkout page loaded - initializing...');
    
    // Load cart items and calculate totals
    loadCartItems();
    
    // Pre-fill user info if logged in
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (user) {
            if (user.name) document.getElementById('fullName').value = user.name;
            if (user.phone) document.getElementById('phone').value = user.phone;
            if (user.email) document.getElementById('email').value = user.email;
            if (user.address) document.getElementById('address').value = user.address;
        }
    }
    
    // Add event listeners for delivery options
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', updateDeliveryFee);
    });
    
    // Add event listeners for payment options
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // Handle payment method change if needed
        });
    });
    
    // Add form submit handler
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Add click handlers for option containers
    document.querySelectorAll('.delivery-option, .payment-option').forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                
                if (radio.name === 'delivery') {
                    updateDeliveryFee();
                }
            }
        });
    });
    
    // Remove error styling on input
    document.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('input', function() {
            this.classList.remove('border-red-500', 'ring-red-500');
        });
    });
});
