// Menu page JavaScript
let allProducts = [];
let filteredProducts = [];
let isLoading = false;
let currentCategory = 'all';
let currentSort = 'default';

// Initialize menu page
document.addEventListener('DOMContentLoaded', async function() {
    showLoading(true);
    await loadProducts();
    setupEventListeners();
    updateCartCount();
    
    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCartCount);
    
    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', function(e) {
        if (e.key === 'cart') {
            updateCartCount();
        }
    });
});

// Load products from API
async function loadProducts() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);
    
    try {
        allProducts = await fetchProducts();
        
        if (!allProducts || allProducts.length === 0) {
            showEmptyState();
            return;
        }
        
        filteredProducts = [...allProducts];
        renderProducts(filteredProducts);
        updateResultsInfo();
        showNotification('Đã tải ' + allProducts.length + ' sản phẩm', 'success');
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Không thể tải danh sách sản phẩm. Vui lòng kiểm tra kết nối đến server.');
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

// Render products to grid
function renderProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) {
        console.error('Products grid not found');
        return;
    }
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <p class="text-xl text-gray-500">Không tìm thấy sản phẩm nào</p>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = products.map(product => createProductCard(product)).join('');
}

// Create product card HTML
function createProductCard(product) {
    const isAvailable = product.available !== false;
    const badge = getBadgeForProduct(product);
    const imageUrl = getProductImageUrl(product.image);
    
    return `
        <div class="product-card bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group" 
             data-category="${product.category.toLowerCase()}" 
             data-price="${product.price}" 
             data-name="${product.name}">
            <div class="relative overflow-hidden aspect-square rounded-2xl">
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                     onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80'">
                ${badge ? `
                    <div class="absolute top-3 left-3 bg-coffee text-white px-2 py-1 rounded-full text-xs font-semibold">
                        <i class="fas fa-star mr-1"></i>${badge}
                    </div>
                ` : ''}
                ${!isAvailable ? `
                    <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span class="bg-red-500 text-white px-4 py-2 rounded-full font-semibold">Hết hàng</span>
                    </div>
                ` : ''}
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <button class="bg-white text-coffee px-4 py-2 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0" 
                            onclick="viewProductDetail('${product._id}')">
                        <i class="fas fa-eye mr-2"></i>Xem chi tiết
                    </button>
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-lg font-bold text-coffee mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-3">${product.description || 'Sản phẩm chất lượng cao'}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xl font-bold text-coffee">${formatPrice(product.price)}</span>
                    ${isAvailable ? `
                        <button class="bg-coffee text-white px-3 py-2 rounded-full hover:bg-coffee-dark transition-colors transform hover:scale-105" 
                                onclick="addToCart('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price})">
                            <i class="fas fa-plus mr-1"></i>Thêm
                        </button>
                    ` : `
                        <button class="bg-gray-400 text-white px-3 py-2 rounded-full cursor-not-allowed" disabled>
                            <i class="fas fa-ban mr-1"></i>Hết
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

// Get badge for product (best seller, new, etc.)
function getBadgeForProduct(product) {
    // You can customize this logic based on your needs
    if (product.category === 'Cà phê' && product.price > 25000) {
        return 'Best Seller';
    }
    return null;
}

// Get product image URL
function getProductImageUrl(imageName) {
    // Check if image is base64 encoded (from database)
    if (imageName && imageName.startsWith('data:image')) {
        return imageName;
    }
    
    // Default images based on product type
    const defaultImages = {
        'coffee_black.jpg': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
        'coffee_milk.jpg': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=80',
        'tea_peach.jpg': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
        'juice_orange.jpg': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80',
        'flan.jpg': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
        'smoothie_avocado.jpg': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=400&q=80'
    };
    
    return defaultImages[imageName] || `./assets/images/products/${imageName}`;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Category filter
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', handleCategoryFilter);
    });
    
    // Sort functionality
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    
    renderProducts(filteredProducts);
    updateResultsInfo();
}

// Handle category filter
function handleCategoryFilter(e) {
    const categoryBtn = e.currentTarget;
    const category = categoryBtn.getAttribute('data-category');
    
    // Prevent double-click on same category
    if (currentCategory === category) return;
    
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-coffee', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    categoryBtn.classList.add('active', 'bg-coffee', 'text-white');
    categoryBtn.classList.remove('bg-gray-100', 'text-gray-700');
    
    // Filter products
    if (category === 'all') {
        filteredProducts = [...allProducts];
    } else {
        const categoryMap = {
            'coffee': 'Cà phê',
            'tea': 'Trà',
            'juice': 'Nước ép',
            'smoothie': 'Sinh tố',
            'cake': 'Ăn vặt'
        };
        
        const filterCategory = categoryMap[category] || category;
        filteredProducts = allProducts.filter(product => 
            product.category === filterCategory
        );
    }
    
    // Apply current sort
    applySorting();
    
    renderProducts(filteredProducts);
    updateResultsInfo();
    
    showNotification(`Đã lọc ${filteredProducts.length} sản phẩm`, 'info');
}

// Handle sort
function handleSort(e) {
    currentSort = e.target.value;
    applySorting();
    renderProducts(filteredProducts);
}

// Apply current sorting
function applySorting() {
    switch(currentSort) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
            break;
        case 'popular':
            // Could sort by some popularity metric
            break;
        default:
            // Default sorting (by _id or creation order)
            break;
    }
}

// Update results info
function updateResultsInfo() {
    const resultsInfo = document.querySelector('.container p.text-gray-600');
    if (resultsInfo) {
        const showing = filteredProducts.length;
        const total = allProducts.length;
        resultsInfo.innerHTML = `Hiển thị <span class="font-semibold text-coffee">${showing}</span> của <span class="font-semibold text-coffee">${total}</span> sản phẩm`;
    }
}

// View product detail
function viewProductDetail(productId) {
    window.location.href = `detail.html?id=${productId}`;
}

// Add to cart function - uses cartManager if available
function addToCart(productId, productName, price, image = '', category = '') {
    try {
        // Find full product info if available
        const product = allProducts.find(p => p._id === productId);
        
        // Use cartManager if available (from cart-manager.js)
        if (typeof cartManager !== 'undefined') {
            cartManager.addToCart({
                id: productId,
                name: productName,
                price: price,
                image: product?.image || image || '',
                category: product?.category || category || '',
                description: product?.description || ''
            }, 1);
            showNotification(`Đã thêm ${productName} vào giỏ hàng`, 'success');
            return;
        }
        
        // Fallback implementation
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: price,
                image: product?.image || image || '',
                category: product?.category || category || '',
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        showNotification(`Đã thêm ${productName} vào giỏ hàng`, 'success');
        updateCartCount();
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Có lỗi xảy ra khi thêm sản phẩm', 'error');
    }
}

// Show error
function showError(message) {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-circle text-6xl text-red-400 mb-4"></i>
                <p class="text-xl text-gray-700 mb-2">${message}</p>
                <button onclick="loadProducts()" class="mt-4 bg-coffee text-white px-6 py-2 rounded-full hover:bg-coffee-dark transition-colors">
                    <i class="fas fa-redo mr-2"></i>Thử lại
                </button>
            </div>
        `;
    }
}

// Show loading state
function showLoading(show = true) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    if (show) {
        productsGrid.innerHTML = `
            <div class="col-span-full flex items-center justify-center py-20">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-coffee mx-auto mb-4"></div>
                    <p class="text-gray-600 text-lg">Đang tải sản phẩm...</p>
                </div>
            </div>
        `;
    }
}

// Show empty state
function showEmptyState() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = `
        <div class="col-span-full text-center py-20">
            <i class="fas fa-coffee text-6xl text-gray-300 mb-4"></i>
            <p class="text-xl text-gray-600 mb-2">Chưa có sản phẩm nào</p>
            <p class="text-gray-500">Vui lòng thử lại sau hoặc liên hệ quản trị viên</p>
        </div>
    `;
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.menu-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `menu-notification fixed top-24 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-0`;
    
    // Set color based on type
    const colors = {
        'success': 'bg-green-500 text-white',
        'error': 'bg-red-500 text-white',
        'warning': 'bg-yellow-500 text-white',
        'info': 'bg-blue-500 text-white'
    };
    
    notification.className += ` ${colors[type] || colors.info}`;
    
    // Set icon based on type
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Update cart count in header
function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    if (!cartCountElement) return;
    
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        cartCountElement.textContent = totalItems;
        
        // Update cart badge visibility
        if (totalItems > 0) {
            cartCountElement.classList.remove('hidden');
        } else {
            cartCountElement.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
        cartCountElement.textContent = '0';
    }
}

// View product detail
function viewProductDetail(productId) {
    window.location.href = `detail.html?id=${productId}`;
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
