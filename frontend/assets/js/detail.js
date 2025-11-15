let currentProduct = null;
let currentPrice = 0;
let quantity = 1;
let selectedSize = 'small';
let selectedIce = 'normal';
let selectedSugar = 'normal';
let selectedToppings = [];

// Initialize detail page
document.addEventListener('DOMContentLoaded', async function() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        await loadProductDetail(productId);
    } else {
        showNotification('Không tìm thấy sản phẩm', 'error');
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 2000);
    }
});

// Load product details from API
async function loadProductDetail(productId) {
    try {
        currentProduct = await fetchProduct(productId);
        
        if (!currentProduct) {
            throw new Error('Product not found');
        }
        
        // Hide loading, show product detail container
        const loadingEl = document.getElementById('loading');
        const detailEl = document.getElementById('productDetail');
        
        if (loadingEl) loadingEl.classList.add('hidden');
        if (detailEl) detailEl.classList.remove('hidden');
        
        // Display product details
        displayProductDetails(currentProduct);
        currentPrice = currentProduct.price;
        
        // Update total price after DOM is ready
        setTimeout(() => {
            updateTotalPrice();
        }, 100);
        
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Không thể tải thông tin sản phẩm', 'error');
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 2000);
    }
}

// Display product details
function displayProductDetails(product) {
    // Update page title
    document.title = `${product.name} | Coffee House`;
    
    const imageUrl = getProductImageUrl(product.image);
    const isAvailable = product.available && product.stock > 0;
    
    // Render complete product detail HTML
    const detailContainer = document.getElementById('productDetail');
    if (!detailContainer) return;
    
    detailContainer.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Product Image -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
                <div class="w-full h-[500px] overflow-hidden rounded-xl bg-gray-50">
                    <img id="mainImage" 
                         src="${imageUrl}" 
                         alt="${product.name}"
                         class="w-full h-full object-cover rounded-xl"
                         onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'">
                </div>
            </div>
            
            <!-- Product Info -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
                <!-- Product Header -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="px-3 py-1 bg-coffee text-white text-sm rounded-full">
                            ${getCategoryName(product.category)}
                        </span>
                        <span id="productAvailability" class="${isAvailable ? 'text-green-600' : 'text-red-600'} font-semibold">
                            <i class="fas fa-${isAvailable ? 'check' : 'times'}-circle mr-2"></i>
                            ${isAvailable ? 'Còn hàng' : 'Hết hàng'}
                        </span>
                    </div>
                    
                    <h1 class="text-3xl font-bold text-coffee mb-3">${product.name}</h1>
                    <p class="text-gray-600">${product.description || 'Sản phẩm chất lượng cao từ Coffee House'}</p>
                    
                    <div class="mt-4">
                        <span class="text-4xl font-bold text-coffee">${formatPrice(product.price)}</span>
                    </div>
                </div>
                
                <!-- Quantity Selector -->
                <div class="mb-6">
                    <label class="block text-gray-700 font-semibold mb-2">Số lượng</label>
                    <div class="flex items-center space-x-4">
                        <button onclick="changeQuantity(-1)" 
                                class="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span id="quantity" class="text-2xl font-bold w-12 text-center">${quantity}</span>
                        <button onclick="changeQuantity(1)" 
                                class="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Total Price -->
                <div class="mb-6 p-4 bg-cream rounded-lg">
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-semibold text-gray-700">Tổng cộng:</span>
                        <span id="totalPrice" class="text-2xl font-bold text-coffee">${formatPrice(product.price)}</span>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="space-y-3">
                    <button onclick="addToCart()" 
                            ${!isAvailable ? 'disabled' : ''}
                            class="w-full bg-coffee text-white py-4 rounded-lg font-bold text-lg hover:bg-coffee-dark transition-colors ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}">
                        <i class="fas fa-shopping-cart mr-2"></i>Thêm vào giỏ hàng
                    </button>
                    
                    <button onclick="window.location.href='menu.html'" 
                            class="w-full bg-gray-200 text-gray-700 py-4 rounded-lg font-bold text-lg hover:bg-gray-300 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Quay lại Menu
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Product Description Tabs -->
        <div class="mt-12 bg-white rounded-2xl shadow-lg p-6">
            <div class="border-b border-gray-200 mb-6">
                <ul class="flex space-x-8">
                    <li>
                        <button class="tab-btn py-3 px-1 border-b-2 border-coffee text-coffee font-semibold" data-tab="description">
                            Mô tả
                        </button>
                    </li>
                    <li>
                        <button class="tab-btn py-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-coffee" data-tab="info">
                            Thông tin
                        </button>
                    </li>
                </ul>
            </div>
            
            <div class="tab-content">
                <div id="description" class="tab-pane">
                    <p class="text-gray-700 leading-relaxed">
                        ${product.description || 'Sản phẩm được chế biến từ những nguyên liệu cao cấp nhất, mang đến hương vị đặc trưng và khó quên.'}
                    </p>
                </div>
                
                <div id="info" class="tab-pane hidden">
                    <div class="space-y-3">
                        <div class="flex justify-between py-2 border-b">
                            <span class="text-gray-600">Danh mục:</span>
                            <span class="font-semibold">${getCategoryName(product.category)}</span>
                        </div>
                        <div class="flex justify-between py-2 border-b">
                            <span class="text-gray-600">Giá:</span>
                            <span class="font-semibold">${formatPrice(product.price)}</span>
                        </div>
                        <div class="flex justify-between py-2 border-b">
                            <span class="text-gray-600">Tình trạng:</span>
                            <span class="font-semibold ${isAvailable ? 'text-green-600' : 'text-red-600'}">
                                ${isAvailable ? 'Còn hàng' : 'Hết hàng'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize tabs after rendering
    initializeTabs();
}

// Get category display name
function getCategoryName(category) {
    const categories = {
        'coffee': 'Cà phê',
        'tea': 'Trà',
        'cake': 'Bánh ngọt',
        'smoothie': 'Sinh tố',
        'milk-tea': 'Trà sữa'
    };
    return categories[category] || category;
}

// Get product image URL
function getProductImageUrl(imageName) {
    if (!imageName) {
        return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80';
    }
    
    // Check if image is base64 encoded (from database)
    if (imageName.startsWith('data:image')) {
        return imageName;
    }
    
    // If it's already a full URL, return it
    if (imageName.startsWith('http')) {
        return imageName;
    }
    
    // Otherwise, construct URL from image name
    const imageMap = {
        'espresso.jpg': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
        'americano.jpg': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735',
        'cappuccino.jpg': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d',
        'latte.jpg': 'https://images.unsplash.com/photo-1561882468-9110e03e0f78',
        'mocha.jpg': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587'
    };
    
    const baseUrl = imageMap[imageName] || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93';
    return `${baseUrl}?auto=format&fit=crop&w=800&q=80`;
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// Initialize tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Remove active class from all tabs
            tabButtons.forEach(b => {
                b.classList.remove('border-coffee', 'text-coffee');
                b.classList.add('border-transparent', 'text-gray-500');
            });
            
            // Add active class to clicked tab
            this.classList.remove('border-transparent', 'text-gray-500');
            this.classList.add('border-coffee', 'text-coffee');
            
            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.add('hidden');
            });
            
            // Show selected tab pane
            const targetPane = document.getElementById(tabId);
            if (targetPane) {
                targetPane.classList.remove('hidden');
            }
        });
    });
}

// Mini cart toggle
function toggleMiniCart() {
    // Implementation for mini cart
    console.log('Toggle mini cart');
}

// Change main image
function changeMainImage(src) {
    document.getElementById('mainImage').src = src.replace('w=150', 'w=800');
    
    // Update thumbnail borders
    document.querySelectorAll('img[onclick*="changeMainImage"]').forEach(img => {
        img.classList.remove('border-coffee');
        img.classList.add('border-transparent');
    });
    event.target.classList.remove('border-transparent');
    event.target.classList.add('border-coffee');
}

// Toggle wishlist
function toggleWishlist() {
    const icon = document.getElementById('wishlistIcon');
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = '#ef4444';
        showNotification('Đã thêm vào danh sách yêu thích!', 'success');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        icon.style.color = '';
        showNotification('Đã xóa khỏi danh sách yêu thích!', 'info');
    }
}

// Share product
function shareProduct() {
    if (navigator.share) {
        navigator.share({
            title: 'Cappuccino - Coffee House',
            text: 'Thưởng thức ly Cappuccino tuyệt vời tại Coffee House!',
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        showNotification('Đã sao chép link sản phẩm!', 'success');
    }
}

// Size selection
document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all size buttons
        document.querySelectorAll('.size-btn').forEach(b => {
            b.classList.remove('border-coffee', 'bg-coffee', 'text-white');
            b.classList.add('border-gray-300', 'text-gray-700');
        });
        
        // Add active class to clicked button
        this.classList.remove('border-gray-300', 'text-gray-700');
        this.classList.add('border-coffee', 'bg-coffee', 'text-white');
        
        selectedSize = this.dataset.size;
        currentPrice = parseInt(this.dataset.price);
        updateTotalPrice();
    });
});

// Ice level selection
document.querySelectorAll('.ice-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all ice buttons
        document.querySelectorAll('.ice-btn').forEach(b => {
            b.classList.remove('border-coffee', 'bg-coffee', 'text-white');
            b.classList.add('border-gray-300', 'text-gray-700');
        });
        
        // Add active class to clicked button
        this.classList.remove('border-gray-300', 'text-gray-700');
        this.classList.add('border-coffee', 'bg-coffee', 'text-white');
        
        selectedIce = this.dataset.ice;
    });
});

// Sugar level selection
document.querySelectorAll('.sugar-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all sugar buttons
        document.querySelectorAll('.sugar-btn').forEach(b => {
            b.classList.remove('border-coffee', 'bg-coffee', 'text-white');
            b.classList.add('border-gray-300', 'text-gray-700');
        });
        
        // Add active class to clicked button
        this.classList.remove('border-gray-300', 'text-gray-700');
        this.classList.add('border-coffee', 'bg-coffee', 'text-white');
        
        selectedSugar = this.dataset.sugar;
    });
});

// Topping selection
document.querySelectorAll('.topping-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const toppingName = this.dataset.name;
        const toppingPrice = parseInt(this.dataset.price);
        
        if (this.checked) {
            selectedToppings.push({ name: toppingName, price: toppingPrice });
        } else {
            selectedToppings = selectedToppings.filter(t => t.name !== toppingName);
        }
        
        updateTotalPrice();
    });
});

// Change quantity
function changeQuantity(delta) {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
        quantity = newQuantity;
        const quantityEl = document.getElementById('quantity');
        if (quantityEl) {
            quantityEl.textContent = quantity;
        }
        updateTotalPrice();
    }
}

// Update total price
function updateTotalPrice() {
    const totalPriceEl = document.getElementById('totalPrice');
    if (!totalPriceEl) {
        console.warn('totalPrice element not found');
        return;
    }
    
    let toppingsTotal = selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
    let total = (currentPrice + toppingsTotal) * quantity;
    totalPriceEl.textContent = total.toLocaleString() + '₫';
}

// Add to cart
function addToCart() {
    if (!currentProduct) {
        showNotification('Không thể thêm vào giỏ hàng', 'error');
        return;
    }
    
    if (!currentProduct.available || currentProduct.stock <= 0) {
        showNotification('Sản phẩm hiện không có sẵn', 'error');
        return;
    }
    
    const toppingPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    const totalPrice = currentPrice + toppingPrice;
    
    const cartItem = {
        id: currentProduct._id,
        name: currentProduct.name,
        image: currentProduct.image,
        price: totalPrice,
        quantity: quantity,
        size: selectedSize,
        ice: selectedIce,
        sugar: selectedSugar,
        toppings: selectedToppings.map(t => t.name)
    };
    
    // Use cart.js addToCart function if available
    if (typeof window.addToCart === 'function' && window.addToCart !== addToCart) {
        window.addToCart(currentProduct._id, quantity, {
            size: selectedSize,
            ice: selectedIce,
            sugar: selectedSugar,
            toppings: selectedToppings
        });
    } else {
        // Fallback: Add to localStorage directly
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Check if product with same options exists
        const existingIndex = cart.findIndex(item => 
            item.id === cartItem.id &&
            item.size === cartItem.size &&
            item.ice === cartItem.ice &&
            item.sugar === cartItem.sugar &&
            JSON.stringify(item.toppings) === JSON.stringify(cartItem.toppings)
        );
        
        if (existingIndex >= 0) {
            cart[existingIndex].quantity += cartItem.quantity;
        } else {
            cart.push(cartItem);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Dispatch cart updated event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Manually update cart count UI
        if (typeof window.cartManager !== 'undefined' && window.cartManager.updateCartCountInUI) {
            window.cartManager.updateCartCountInUI();
        } else {
            // Fallback: update cart count directly
            const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCountElements.forEach(el => {
                el.textContent = totalItems;
                if (totalItems > 0) {
                    el.classList.remove('hidden');
                }
            });
        }
    }
    
    showNotification('Đã thêm vào giỏ hàng!', 'success');
}

// Buy now
function buyNow() {
    if (!currentProduct) {
        showNotification('Không thể thực hiện', 'error');
        return;
    }
    
    if (!currentProduct.available || currentProduct.stock <= 0) {
        showNotification('Sản phẩm hiện không có sẵn', 'error');
        return;
    }
    
    addToCart();
    // Redirect to checkout
    setTimeout(() => {
        window.location.href = 'checkout.html';
    }, 500);
}

// Show notification (use from main.js if available)
function showNotification(message, type) {
    // Prevent infinite recursion - check if we're already being called from window.showNotification
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'info' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'info' ? 'info' : 'exclamation'}-circle"></i>
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

// Format price (use from main.js if available)
function formatPrice(price) {
    if (typeof window.formatPrice === 'function' && window.formatPrice !== formatPrice) {
        return window.formatPrice(price);
    }
    return price.toLocaleString('vi-VN') + '₫';
}
