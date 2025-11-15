// Homepage JavaScript
let bestSellerProducts = [];
let featuredProducts = [];
let promotions = [];

// Initialize homepage
document.addEventListener('DOMContentLoaded', async function () {
    await Promise.all([
        loadFeaturedProducts(),
        loadPromotions()
    ]);
});

// Load featured products from API
async function loadFeaturedProducts() {
    try {
        showLoadingProducts();

        // Try to fetch featured products
        let products = await fetchProducts();

        // Filter featured products or get top-rated ones
        // Since backend might not have 'featured' flag, we'll use first 6 products
        // or products from 'Cà phê' category as featured
        featuredProducts = products
            .filter(p => p.category === 'Cà phê' || p.available !== false)
            .slice(0, 6);

        // Also set as best sellers for backward compatibility
        bestSellerProducts = featuredProducts;

        renderBestSellers();
    } catch (error) {
        console.error('Error loading featured products:', error);
        showErrorProducts('Không thể tải sản phẩm nổi bật. Vui lòng thử lại sau.');
    }
}

// Load active promotions
async function loadPromotions() {
    try {
        const response = await fetch(`${API_BASE_URL}/promotions/active`);
        if (response.ok) {
            const data = await response.json();
            promotions = data.data || data.promotions || [];
            if (promotions.length > 0) {
                renderPromotionBanner();
            }
        }
    } catch (error) {
        console.error('Error loading promotions:', error);
        // Don't show error for promotions - it's optional
    }
}

// Render best seller products
function renderBestSellers() {
    const bestSellersGrid = document.getElementById('bestSellersGrid');

    if (!bestSellersGrid) {
        console.error('Best sellers grid not found');
        return;
    }

    if (bestSellerProducts.length === 0) {
        bestSellersGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-gray-500">Chưa có sản phẩm nào</p>
            </div>
        `;
        return;
    }

    bestSellersGrid.innerHTML = bestSellerProducts.map(product => createBestSellerCard(product)).join('');
}

// Create best seller card
function createBestSellerCard(product) {
    const imageUrl = getProductImageUrl(product.image);
    const badge = getBadgeForBestSeller(product);
    const productId = product._id || product.id;

    return `
        <div class="product-card bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group">
            <div class="relative overflow-hidden aspect-[4/3] rounded-t-2xl">
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                     onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80'">
                ${badge ? `
                    <div class="absolute top-3 left-3 bg-coffee text-white px-3 py-1 rounded-full text-sm font-semibold">
                        <i class="fas fa-star mr-1"></i>${badge}
                    </div>
                ` : ''}
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <button onclick="viewProduct('${productId}')" class="bg-white text-coffee px-6 py-3 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                        <i class="fas fa-shopping-cart mr-2"></i>Đặt ngay
                    </button>
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold text-coffee mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-4">${product.description || 'Sản phẩm chất lượng cao'}</p>
                <div class="flex items-center justify-between">
                    <span class="text-2xl font-bold text-coffee">${formatPrice(product.price)}</span>
                    <button onclick="quickAddToCart('${productId}', '${product.name.replace(/'/g, "\\'")}', ${product.price})" class="bg-coffee text-white px-4 py-2 rounded-full hover:bg-coffee-dark transition-colors">
                        <i class="fas fa-plus mr-1"></i>Thêm
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Get badge for best seller - use utils version if available
function getBadgeForBestSeller(product) {
    // Try utils.js version first
    if (typeof getBadgeForProduct !== 'undefined') {
        return getBadgeForProduct(product);
    }

    // Fallback implementation
    if (product.category === 'Cà phê') {
        return 'Best Seller';
    } else if (product.price > 40000) {
        return 'Hot';
    }
    return 'New';
}

// Get product image URL - use utils version if available
function getProductImageUrl(imageName) {
    // If utils.js is loaded, use its version
    if (typeof window.getProductImageUrl !== 'undefined' && window.getProductImageUrl !== getProductImageUrl) {
        return window.getProductImageUrl(imageName);
    }

    // Check if image is base64 encoded (from database)
    if (imageName && imageName.startsWith('data:image')) {
        return imageName;
    }

    // Fallback implementation with common image mappings
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

// View product detail
function viewProduct(productId) {
    window.location.href = `detail.html?id=${productId}`;
}

// Quick add to cart - use cartManager if available
function quickAddToCart(productId, productName, price) {
    if (typeof cartManager !== 'undefined') {
        cartManager.addToCart({
            id: productId,
            name: productName,
            price: price
        }, 1);
    } else {
        // Fallback to addToCart global function
        addToCart(productId, productName, price, 1);
    }
}

// Render promotion banner (if promotions exist)
function renderPromotionBanner() {
    const bannerContainer = document.getElementById('promotionBanner');
    if (!bannerContainer || promotions.length === 0) return;

    const activePromotion = promotions[0];
    bannerContainer.innerHTML = `
        <div class="bg-gradient-to-r from-coffee to-coffee-light text-white p-6 rounded-2xl shadow-lg">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <h3 class="text-2xl font-bold mb-2">
                        <i class="fas fa-gift mr-2"></i>${activePromotion.title || activePromotion.name}
                    </h3>
                    <p class="text-lg opacity-90">${activePromotion.description}</p>
                    <div class="mt-3">
                        <span class="bg-white text-coffee px-4 py-2 rounded-full font-bold">
                            Giảm ${activePromotion.discountPercent}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Show loading state for products
function showLoadingProducts() {
    const grid = document.getElementById('bestSellersGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="inline-block animate-spin rounded-full h-16 w-16 border-4 border-coffee border-t-transparent"></div>
            <p class="mt-4 text-gray-600">Đang tải sản phẩm...</p>
        </div>
    `;
}

// Show error state for products
function showErrorProducts(message) {
    const grid = document.getElementById('bestSellersGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <i class="fas fa-exclamation-circle text-6xl text-red-400 mb-4"></i>
            <p class="text-gray-600 mb-4">${message}</p>
            <button onclick="loadFeaturedProducts()" class="bg-coffee text-white px-6 py-3 rounded-full hover:bg-coffee-dark transition-colors">
                <i class="fas fa-redo mr-2"></i>Thử lại
            </button>
        </div>
    `;
}

// Export functions for global access
window.loadFeaturedProducts = loadFeaturedProducts;
