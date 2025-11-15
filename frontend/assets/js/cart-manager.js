// Centralized Cart Management System
// This module handles all cart-related operations and state management

class CartManager {
    constructor() {
        this.cart = [];
        this.storageKey = 'cart';
        this.init();
    }

    /**
     * Initialize cart manager
     */
    init() {
        this.loadCart();
        this.setupEventListeners();
    }

    /**
     * Load cart from localStorage
     */
    loadCart() {
        try {
            const cartData = localStorage.getItem(this.storageKey);
            this.cart = cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    }

    /**
     * Save cart to localStorage and dispatch update event
     */
    saveCart() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
            this.dispatchCartUpdate();
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    /**
     * Dispatch cart update event
     */
    dispatchCartUpdate() {
        window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: {
                cart: this.cart,
                count: this.getTotalItems(),
                total: this.getTotal()
            }
        }));
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for cart update events to refresh UI
        window.addEventListener('cartUpdated', () => {
            this.updateCartCountInUI();
        });

        // Listen for storage changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.loadCart();
                this.dispatchCartUpdate();
            }
        });
    }

    /**
     * Update cart count in all UI elements
     */
    updateCartCountInUI() {
        const count = this.getTotalItems();
        const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
        
        cartCountElements.forEach(el => {
            el.textContent = count;
            if (count > 0) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    }

    /**
     * Add product to cart
     * @param {Object} product - Product object with id, name, price, image
     * @param {number} quantity - Quantity to add (default: 1)
     * @returns {boolean} Success status
     */
    addToCart(product, quantity = 1) {
        try {
            // Validate product
            if (!product || !product.id || !product.name || !product.price) {
                console.error('Invalid product data:', product);
                if (typeof showNotification === 'function') {
                    showNotification('Dữ liệu sản phẩm không hợp lệ!', 'error');
                }
                return false;
            }

            // Check if product already in cart
            const existingItem = this.cart.find(item => item.id === product.id);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                // Get product image URL
                let imageUrl = product.image || '';
                if (!imageUrl || imageUrl === '') {
                    // Use default image based on product ID or name
                    imageUrl = this.getDefaultProductImage(product);
                }
                
                this.cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: imageUrl,
                    quantity: quantity,
                    category: product.category || '',
                    description: product.description || ''
                });
            }

            this.saveCart();
            
            if (typeof showNotification === 'function') {
                showNotification(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
            }
            
            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            if (typeof showNotification === 'function') {
                showNotification('Có lỗi khi thêm vào giỏ hàng!', 'error');
            }
            return false;
        }
    }

    /**
     * Get default product image based on product info
     * @param {Object} product - Product object
     * @returns {string} Image URL
     */
    getDefaultProductImage(product) {
        // Default images mapping
        const defaultImages = {
            'coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
            'tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
            'juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&q=80',
            'smoothie': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=400&q=80',
            'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80'
        };
        
        // Try to match by category
        if (product.category) {
            const category = product.category.toLowerCase();
            for (const [key, url] of Object.entries(defaultImages)) {
                if (category.includes(key)) {
                    return url;
                }
            }
        }
        
        // Try to match by name
        if (product.name) {
            const name = product.name.toLowerCase();
            if (name.includes('cà phê') || name.includes('coffee')) {
                return defaultImages.coffee;
            } else if (name.includes('trà') || name.includes('tea')) {
                return defaultImages.tea;
            } else if (name.includes('nước ép') || name.includes('juice')) {
                return defaultImages.juice;
            } else if (name.includes('sinh tố') || name.includes('smoothie')) {
                return defaultImages.smoothie;
            } else if (name.includes('bánh') || name.includes('cake')) {
                return defaultImages.cake;
            }
        }
        
        // Default fallback
        return defaultImages.coffee;
    }

    /**
     * Remove product from cart
     * @param {string|number} productId - Product ID
     * @returns {boolean} Success status
     */
    removeFromCart(productId) {
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(item => item.id !== productId);
        
        if (this.cart.length < initialLength) {
            this.saveCart();
            if (typeof showNotification === 'function') {
                showNotification('Đã xóa khỏi giỏ hàng!', 'success');
            }
            return true;
        }
        
        return false;
    }

    /**
     * Update product quantity in cart
     * @param {string|number} productId - Product ID
     * @param {number} quantity - New quantity
     * @returns {boolean} Success status
     */
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        
        if (!item) return false;

        if (quantity <= 0) {
            return this.removeFromCart(productId);
        }

        item.quantity = quantity;
        this.saveCart();
        return true;
    }

    /**
     * Increase product quantity
     * @param {string|number} productId - Product ID
     * @returns {boolean} Success status
     */
    increaseQuantity(productId) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return false;
        
        item.quantity += 1;
        this.saveCart();
        return true;
    }

    /**
     * Decrease product quantity
     * @param {string|number} productId - Product ID
     * @returns {boolean} Success status
     */
    decreaseQuantity(productId) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return false;
        
        if (item.quantity <= 1) {
            return this.removeFromCart(productId);
        }
        
        item.quantity -= 1;
        this.saveCart();
        return true;
    }

    /**
     * Clear all items from cart
     * @returns {boolean} Success status
     */
    clearCart() {
        this.cart = [];
        this.saveCart();
        if (typeof showNotification === 'function') {
            showNotification('Đã xóa tất cả sản phẩm!', 'success');
        }
        return true;
    }

    /**
     * Get cart items
     * @returns {Array} Cart items array
     */
    getCart() {
        return [...this.cart];
    }

    /**
     * Get total number of items in cart
     * @returns {number} Total items count
     */
    getTotalItems() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Get cart subtotal (before shipping/discount)
     * @returns {number} Subtotal amount
     */
    getSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    /**
     * Calculate shipping fee
     * @param {number} subtotal - Subtotal amount
     * @returns {number} Shipping fee
     */
    getShippingFee(subtotal = null) {
        const total = subtotal || this.getSubtotal();
        
        // Free shipping for orders over 200,000 VND
        if (total >= 200000) return 0;
        
        // Standard shipping fee
        return total > 0 ? 20000 : 0;
    }

    /**
     * Calculate discount amount
     * @param {Object} promotion - Promotion object with discount info
     * @returns {number} Discount amount
     */
    getDiscountAmount(promotion = null) {
        if (!promotion) return 0;
        
        const subtotal = this.getSubtotal();
        
        if (promotion.type === 'percentage') {
            return subtotal * (promotion.value / 100);
        } else if (promotion.type === 'fixed') {
            return Math.min(promotion.value, subtotal);
        }
        
        return 0;
    }

    /**
     * Get cart total (subtotal + shipping - discount)
     * @param {Object} promotion - Optional promotion to apply
     * @returns {number} Total amount
     */
    getTotal(promotion = null) {
        const subtotal = this.getSubtotal();
        const shipping = this.getShippingFee(subtotal);
        const discount = this.getDiscountAmount(promotion);
        
        return subtotal + shipping - discount;
    }

    /**
     * Check if cart is empty
     * @returns {boolean} True if cart is empty
     */
    isEmpty() {
        return this.cart.length === 0;
    }

    /**
     * Get item by product ID
     * @param {string|number} productId - Product ID
     * @returns {Object|null} Cart item or null
     */
    getItem(productId) {
        return this.cart.find(item => item.id === productId) || null;
    }

    /**
     * Check if product is in cart
     * @param {string|number} productId - Product ID
     * @returns {boolean} True if product is in cart
     */
    hasProduct(productId) {
        return this.cart.some(item => item.id === productId);
    }
}

// Create global cart manager instance
const cartManager = new CartManager();

// Global helper functions for backward compatibility
function addToCart(productId, name = null, price = null, quantity = 1) {
    // If called with full product details
    if (name && price) {
        return cartManager.addToCart({
            id: productId,
            name: name,
            price: price
        }, quantity);
    }
    
    // Legacy call - try to find product in cart or fail gracefully
    const existingItem = cartManager.getItem(productId);
    if (existingItem) {
        return cartManager.increaseQuantity(productId);
    }
    
    console.warn('addToCart called without product details:', productId);
    return false;
}

function removeFromCart(productId) {
    return cartManager.removeFromCart(productId);
}

function updateCartQuantity(productId, quantity) {
    return cartManager.updateQuantity(productId, quantity);
}

function clearCart() {
    return cartManager.clearCart();
}

function getCart() {
    return cartManager.getCart();
}

function getCartCount() {
    return cartManager.getTotalItems();
}

function getCartTotal() {
    return cartManager.getTotal();
}

// Update cart count in UI (global function)
function updateCartCount() {
    cartManager.updateCartCountInUI();
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CartManager, cartManager };
}
