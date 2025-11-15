// Cart Page Functionality
// Uses cartManager from cart-manager.js for state management
let cart = [];

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    renderCart();
    
    // Load applied promotion from localStorage
    const savedPromo = localStorage.getItem('appliedPromotion');
    if (savedPromo) {
        try {
            appliedPromo = JSON.parse(savedPromo);
            // Display the promotion without re-validating
            if (appliedPromo) {
                applyPromotionData(appliedPromo);
            }
        } catch (e) {
            console.error('Error loading saved promotion:', e);
            localStorage.removeItem('appliedPromotion');
        }
    }
    
    // Listen for cart updates from cartManager
    window.addEventListener('cartUpdated', function() {
        loadCart();
        renderCart();
    });
});

// Load cart from cartManager
function loadCart() {
    if (typeof cartManager !== 'undefined') {
        cart = cartManager.getCart();
    } else {
        // Fallback to localStorage
        cart = JSON.parse(localStorage.getItem('cart')) || [];
    }
}

// Save cart (delegated to cartManager)
function saveCart() {
    // cartManager handles saving automatically
    if (typeof cartManager !== 'undefined') {
        // Cart is already managed by cartManager
        cartManager.saveCart();
    } else {
        // Fallback
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    }
}

// Render cart items
function renderCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
        if (cartSummary) cartSummary.classList.add('hidden');
        cartItemsContainer.innerHTML = '';
        return;
    }
    
    if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
    if (cartSummary) cartSummary.classList.remove('hidden');
    
    // Render cart items
    cartItemsContainer.innerHTML = cart.map((item, index) => createCartItem(item, index)).join('');
    
    // Update totals
    updateCartSummary();
}

// Create cart item HTML
function createCartItem(item, index) {
    // Use item's image if available, otherwise use default
    const imageUrl = item.image || getDefaultImageForProduct(item);
    const subtotal = item.price * item.quantity;
    
    return `
        <div class="p-6 cart-item" data-id="${item.id}">
            <div class="grid grid-cols-12 gap-4 items-center">
                <!-- Product Info -->
                <div class="col-span-6 sm:col-span-5">
                    <div class="flex items-center space-x-4">
                        <img src="${imageUrl}" 
                             alt="${item.name}" 
                             class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                             onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=100&q=80'">
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-semibold text-coffee truncate">${item.name}</h3>
                            <p class="text-sm text-gray-600">${formatPrice(item.price)}</p>
                            ${item.category ? `<p class="text-xs text-gray-500">${item.category}</p>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Unit Price -->
                <div class="col-span-2 text-center hidden sm:block">
                    <span class="text-lg font-semibold text-coffee">${formatPrice(item.price)}</span>
                </div>

                <!-- Quantity -->
                <div class="col-span-2 text-center">
                    <div class="flex items-center justify-center">
                        <button class="w-8 h-8 bg-gray-100 rounded-l-lg hover:bg-gray-200 transition-colors" onclick="decreaseQuantity(${index})">
                            <i class="fas fa-minus text-xs"></i>
                        </button>
                        <span class="w-12 h-8 bg-gray-50 flex items-center justify-center border-t border-b border-gray-200 font-semibold">${item.quantity}</span>
                        <button class="w-8 h-8 bg-gray-100 rounded-r-lg hover:bg-gray-200 transition-colors" onclick="increaseQuantity(${index})">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                </div>

                <!-- Total Price -->
                <div class="col-span-2 text-center">
                    <span class="text-lg font-bold text-coffee">${formatPrice(subtotal)}</span>
                </div>

                <!-- Remove Button -->
                <div class="col-span-2 sm:col-span-1 text-center">
                    <button class="w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors" onclick="removeItem(${index})">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Get default image for product based on name/category
function getDefaultImageForProduct(item) {
    const name = (item.name || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    
    // Coffee images
    if (name.includes('cappuccino')) {
        return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=100&q=80';
    } else if (name.includes('latte')) {
        return 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=100&q=80';
    } else if (name.includes('mocha')) {
        return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=100&q=80';
    } else if (name.includes('americano')) {
        return 'https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=100&q=80';
    } else if (name.includes('espresso')) {
        return 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=100&q=80';
    }
    
    // Category-based defaults
    if (category.includes('cà phê') || category.includes('coffee')) {
        return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=100&q=80';
    } else if (category.includes('trà') || category.includes('tea')) {
        return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=100&q=80';
    } else if (category.includes('sinh tố') || category.includes('smoothie')) {
        return 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=100&q=80';
    } else if (category.includes('nước ép') || category.includes('juice')) {
        return 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=100&q=80';
    } else if (category.includes('bánh') || category.includes('cake')) {
        return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=100&q=80';
    }
    
    // Default fallback
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=100&q=80';
}

// Increase quantity
function increaseQuantity(index) {
    const item = cart[index];
    if (item && typeof cartManager !== 'undefined') {
        cartManager.increaseQuantity(item.id);
    } else {
        cart[index].quantity += 1;
        saveCart();
        renderCart();
    }
}

// Decrease quantity
function decreaseQuantity(index) {
    const item = cart[index];
    if (item && typeof cartManager !== 'undefined') {
        cartManager.decreaseQuantity(item.id);
    } else {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
            saveCart();
            renderCart();
        } else {
            removeItem(index);
        }
    }
}

// Remove item
function removeItem(index) {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        const item = cart[index];
        if (item && typeof cartManager !== 'undefined') {
            cartManager.removeFromCart(item.id);
        } else {
            cart.splice(index, 1);
            saveCart();
            renderCart();
        }
    }
}

// Update cart summary
function updateCartSummary() {
    let subtotal, shipping, total;
    
    if (typeof cartManager !== 'undefined') {
        subtotal = cartManager.getSubtotal();
        shipping = cartManager.getShippingFee();
        total = cartManager.getTotal();
    } else {
        subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Free shipping for orders over 200,000 VND
        shipping = subtotal >= 200000 ? 0 : (subtotal > 0 ? 20000 : 0);
        total = subtotal + shipping;
    }
    
    // Calculate discount if promotion is applied
    const discount = appliedPromo ? calculateDiscount(appliedPromo) : 0;
    
    // Calculate final total (no VAT)
    const finalTotal = subtotal + shipping - discount;
    
    // Update item count
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const itemCountEl = document.getElementById('itemCount');
    if (itemCountEl) {
        itemCountEl.textContent = itemCount;
    }
    
    // Update summary elements
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const discountEl = document.getElementById('discount');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) {
        if (shipping === 0) {
            shippingEl.textContent = 'Miễn phí';
            shippingEl.classList.add('text-green-600');
        } else {
            shippingEl.textContent = formatPrice(shipping);
            shippingEl.classList.remove('text-green-600');
        }
    }
    if (discountEl) discountEl.textContent = `-${formatPrice(discount)}`;
    if (totalEl) totalEl.textContent = formatPrice(finalTotal);
}

// Clear cart
function clearCart() {
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
        if (typeof cartManager !== 'undefined') {
            cartManager.clearCart();
        } else {
            cart = [];
            saveCart();
            renderCart();
        }
    }
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('Giỏ hàng của bạn đang trống!', 'warning');
        } else {
            alert('Giỏ hàng của bạn đang trống!');
        }
        return;
    }
    window.location.href = 'checkout.html';
}

// Continue shopping
function continueShopping() {
    window.location.href = 'menu.html';
}

// Go to menu
function goToMenu() {
    window.location.href = 'menu.html';
}

// Promotion management
let appliedPromo = null;

// Check for promotion code from localStorage on page load
window.addEventListener('DOMContentLoaded', function() {
    const savedPromoCode = localStorage.getItem('appliedPromoCode');
    if (savedPromoCode) {
        document.getElementById('couponCode').value = savedPromoCode;
        applyPromotion();
        localStorage.removeItem('appliedPromoCode');
    }
});

// Apply promotion
async function applyPromotion() {
    const couponInput = document.getElementById('couponCode');
    const couponCode = couponInput?.value.trim().toUpperCase();
    
    if (!couponCode) {
        showPromotionMessage('Vui lòng nhập mã khuyến mãi!', 'warning');
        return;
    }
    
    // Show loading state
    const applyBtn = event?.target;
    if (applyBtn) {
        const originalHTML = applyBtn.innerHTML;
        applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang kiểm tra...';
        applyBtn.disabled = true;
    }
    
    try {
        // Check if API_URL is defined, otherwise use default
        const apiUrl = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:3000';
        
        // Get auth token if available
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        // If no token, skip API and use mock validation directly
        if (!token) {
            console.log('⚠️ No authentication token, using mock validation');
            throw new Error('No authentication');
        }
        
        // Get product IDs from cart
        const productIds = cart.map(item => item.id || item._id || item.productId).filter(id => id);
        const subtotal = getCartSubtotal();
        
        console.log('🛒 Cart items:', cart);
        console.log('📦 Product IDs extracted:', productIds);
        console.log('💰 Order subtotal:', subtotal);
        
        const requestBody = { 
            code: couponCode,
            orderAmount: subtotal,
            orderValue: subtotal, // Backward compatibility
            productIds: productIds // Add product IDs for validation
        };
        
        console.log('📤 Sending promotion validation request:', requestBody);
        
        // Try to fetch from API with authentication
        const response = await fetch(`${apiUrl}/api/promotions/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📥 Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.promotion) {
                // Convert API response to our format
                const promotion = {
                    _id: data.promotion._id,
                    code: data.promotion.code,
                    name: data.promotion.title || data.promotion.name,
                    description: data.promotion.description,
                    discountType: data.promotion.discountType,
                    discountValue: data.promotion.discountValue,
                    maxDiscount: data.promotion.maxDiscount,
                    minOrderAmount: data.promotion.minOrderValue || data.promotion.minOrderAmount,
                    active: true
                };
                applyPromotionData(promotion);
                showPromotionMessage(`Đã áp dụng mã ${couponCode}!`, 'success');
            } else {
                showPromotionMessage(data.error || data.message || 'Mã khuyến mãi không hợp lệ!', 'error');
            }
        } else if (response.status === 400) {
            // Bad request - show specific error from API
            try {
                const data = await response.json();
                console.log('📋 400 Response from API:', data);
                // Show the specific error message
                showPromotionMessage(data.error || 'Mã không đáp ứng điều kiện!', 'warning');
                // Don't fallback to mock for 400 errors - it's a validation issue
                return;
            } catch (e) {
                console.error('Error parsing 400 response:', e);
                showPromotionMessage('Mã không đáp ứng điều kiện!', 'warning');
                return;
            }
        } else if (response.status === 401) {
            // Unauthorized - fallback to mock
            console.log('⚠️ API requires authentication, using mock validation');
            throw new Error('Unauthorized');
        } else if (response.status === 404) {
            // Not found - could be endpoint doesn't exist or promotion not found
            // Try mock validation
            console.log('⚠️ Promotion not found in API, trying mock validation');
            throw new Error('Not found');
        } else {
            throw new Error(`API error: ${response.status}`);
        }
    } catch (error) {
        console.log('⚠️ Using mock promotion validation:', error.message);
        // Fallback to mock data
        const mockPromotion = validateMockPromotion(couponCode);
        if (mockPromotion) {
            applyPromotionData(mockPromotion);
            showPromotionMessage(`Đã áp dụng mã ${couponCode}!`, 'success');
        } else {
            showPromotionMessage('Mã khuyến mãi không hợp lệ hoặc đã hết hạn!', 'error');
        }
    } finally {
        // Restore button state
        if (applyBtn) {
            applyBtn.innerHTML = '<i class="fas fa-check mr-1"></i>Áp dụng';
            applyBtn.disabled = false;
        }
    }
}

// Validate mock promotion
function validateMockPromotion(code) {
    const now = new Date();
    const subtotal = getCartSubtotal();
    
    const mockPromotions = {
        'CAFE50K': {
            _id: '1',
            code: 'CAFE50K',
            name: 'Giảm 50K cho đơn đầu',
            description: 'Giảm 50.000đ cho đơn hàng từ 200.000đ',
            discountType: 'fixed',
            discountValue: 50000,
            minOrderAmount: 200000,
            active: true
        },
        'MORNING30': {
            _id: '2',
            code: 'MORNING30',
            name: 'Giảm 30% buổi sáng',
            description: 'Giảm 30% cho đơn hàng (tối đa 100K)',
            discountType: 'percentage',
            discountValue: 30,
            maxDiscount: 100000,
            minOrderAmount: 100000,
            active: true
        },
        'WEEKEND20': {
            _id: '3',
            code: 'WEEKEND20',
            name: 'Giảm 20% cuối tuần',
            description: 'Giảm 20% cho đơn hàng (tối đa 50K)',
            discountType: 'percentage',
            discountValue: 20,
            maxDiscount: 50000,
            active: true
        }
    };
    
    const promo = mockPromotions[code];
    if (!promo || !promo.active) return null;
    
    // Check minimum order amount
    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
        showPromotionMessage(`Đơn hàng tối thiểu ${formatPrice(promo.minOrderAmount)} để sử dụng mã này!`, 'warning');
        return null;
    }
    
    return promo;
}

// Apply promotion data
function applyPromotionData(promotion) {
    appliedPromo = promotion;
    
    // Save to localStorage for checkout page
    localStorage.setItem('appliedPromotion', JSON.stringify(promotion));
    
    // Show applied promotion display
    const appliedDiv = document.getElementById('appliedPromotion');
    const inputDiv = document.getElementById('promotionInput');
    const discountDiv = document.getElementById('discountAmount');
    
    if (appliedDiv) {
        document.getElementById('appliedPromoName').textContent = promotion.name;
        document.getElementById('appliedPromoDesc').textContent = promotion.description;
        document.getElementById('appliedPromoCode').textContent = promotion.code;
        
        const discountValue = calculateDiscount(promotion);
        document.getElementById('appliedPromoValue').textContent = `-${formatPrice(discountValue)}`;
        
        appliedDiv.classList.remove('hidden');
    }
    
    if (inputDiv) inputDiv.classList.add('hidden');
    if (discountDiv) discountDiv.classList.remove('hidden');
    
    // Update cart summary
    updateCartSummary();
    
    // Clear input
    const couponInput = document.getElementById('couponCode');
    if (couponInput) couponInput.value = '';
}

// Remove promotion
function removePromotion() {
    appliedPromo = null;
    
    // Remove from localStorage
    localStorage.removeItem('appliedPromotion');
    
    const appliedDiv = document.getElementById('appliedPromotion');
    const inputDiv = document.getElementById('promotionInput');
    const discountDiv = document.getElementById('discountAmount');
    
    if (appliedDiv) appliedDiv.classList.add('hidden');
    if (inputDiv) inputDiv.classList.remove('hidden');
    if (discountDiv) discountDiv.classList.add('hidden');
    
    updateCartSummary();
    showPromotionMessage('Đã hủy mã khuyến mãi', 'info');
}

// Calculate discount amount
function calculateDiscount(promotion) {
    const subtotal = getCartSubtotal();
    let discount = 0;
    
    if (promotion.discountType === 'percentage') {
        discount = Math.round(subtotal * promotion.discountValue / 100);
        if (promotion.maxDiscount) {
            discount = Math.min(discount, promotion.maxDiscount);
        }
    } else if (promotion.discountType === 'fixed') {
        discount = promotion.discountValue;
    }
    
    return Math.min(discount, subtotal); // Discount can't exceed subtotal
}

// Get cart subtotal
function getCartSubtotal() {
    if (typeof cartManager !== 'undefined') {
        return cartManager.getSubtotal();
    }
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Show promotion message
function showPromotionMessage(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `fixed top-24 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-xl z-50 animate-fade-in`;
    toast.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${icons[type]} text-2xl"></i>
            <span class="font-semibold">${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Legacy function for backward compatibility
function applyCoupon() {
    applyPromotion();
}

// Note: updateCartCount, addToCart, and removeFromCart are now handled by 
// cart-manager.js and available globally. These functions are kept here
// only if they need to be called directly from the cart page.

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.quantity * (item.price || 0)), 0);
}

// Initialize cart count
if (typeof updateCartCount === 'function') {
    updateCartCount();
}
