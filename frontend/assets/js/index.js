// Best seller products data
const bestSellerProducts = [
    {
        id: 1,
        name: 'Cappuccino Đặc Biệt',
        price: 65000,
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Cà phê espresso đậm đà với lớp sữa foam mịn màng',
        badge: 'Best Seller'
    },
    {
        id: 2,
        name: 'Latte Vanilla',
        price: 70000,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Cà phê latte thơm ngon với hương vị vanilla tự nhiên',
        badge: 'Hot'
    },
    {
        id: 3,
        name: 'Americano',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Cà phê đen nguyên chất, đậm đà và thơm ngon',
        badge: 'Classic'
    },
    {
        id: 4,
        name: 'Mocha Chocolate',
        price: 75000,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Cà phê kết hợp với chocolate Bỉ thơm ngon',
        badge: 'Premium'
    },
    {
        id: 5,
        name: 'Sinh Tố Bơ',
        price: 55000,
        image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Sinh tố bơ tươi mát, bổ dưỡng và thơm ngon',
        badge: 'Fresh'
    },
    {
        id: 6,
        name: 'Bánh Tiramisu',
        price: 65000,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        description: 'Bánh tiramisu Ý truyền thống, thơm ngon đặc biệt',
        badge: 'Special'
    }
];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    displayBestSellers();
    startCountdown();
    initScrollEffects();
    updateCurrentStatus();
});

// Display best seller products
function displayBestSellers() {
    const grid = document.getElementById('bestSellerGrid');
    grid.innerHTML = bestSellerProducts.map(product => `
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group">
            <div class="relative overflow-hidden">
                <img src="${product.image}" alt="${product.name}" class="w-full h-[250px] object-cover group-hover:scale-110 transition-transform duration-300">
                <div class="absolute top-4 left-4">
                    <span class="bg-coffee text-white px-3 py-1 rounded-full text-sm font-semibold">${product.badge}</span>
                </div>
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <button class="bg-white text-coffee px-6 py-2 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0" onclick="viewProduct(${product.id})">
                        <i class="fas fa-eye mr-2"></i>Xem chi tiết
                    </button>
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-semibold text-coffee mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-4 text-sm leading-relaxed">${product.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-2xl font-bold text-coffee">${formatPrice(product.price)}</span>
                    <button onclick="addToCart(${product.id})" class="bg-coffee text-white px-6 py-2 rounded-full hover:bg-coffee-dark transition-colors transform hover:scale-105">
                        <i class="fas fa-plus mr-2"></i>Đặt ngay
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Countdown timer
function startCountdown() {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 5);
    endDate.setHours(endDate.getHours() + 12);
    endDate.setMinutes(endDate.getMinutes() + 30);
    endDate.setSeconds(endDate.getSeconds() + 45);

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endDate.getTime() - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days1').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours1').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes1').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds1').textContent = seconds.toString().padStart(2, '0');

        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById('countdown1').innerHTML = '<div class="text-center text-red-400">Khuyến mãi đã kết thúc</div>';
        }
    }

    const countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
}

// Scroll effects
function initScrollEffects() {
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.remove('opacity-0', 'invisible');
            backToTopBtn.classList.add('opacity-100', 'visible');
        } else {
            backToTopBtn.classList.add('opacity-0', 'invisible');
            backToTopBtn.classList.remove('opacity-100', 'visible');
        }
    });
}

// Update current status
function updateCurrentStatus() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const statusElement = document.getElementById('currentStatus');
    
    let isOpen = false;
    
    if (day >= 1 && day <= 5) { // Monday to Friday
        isOpen = hour >= 7 && hour < 22;
    } else { // Weekend
        isOpen = hour >= 6.5 && hour < 23;
    }
    
    if (isOpen) {
        statusElement.textContent = 'Đang mở cửa';
        statusElement.className = 'text-green-400 font-semibold';
    } else {
        statusElement.textContent = 'Đã đóng cửa';
        statusElement.className = 'text-red-400 font-semibold';
    }
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function scrollToMenu() {
    document.getElementById('menu').scrollIntoView({
        behavior: 'smooth'
    });
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('hidden');
}

function toggleCart() {
    // Cart functionality would be implemented here
    alert('Giỏ hàng sẽ được mở');
}

function addToCart(productId) {
    const product = bestSellerProducts.find(p => p.id === productId);
    if (product) {
        // Add to cart logic here
        showNotification(`Đã thêm "${product.name}" vào giỏ hàng!`);
        
        // Update cart count
        const cartCount = document.getElementById('cartCount');
        const currentCount = parseInt(cartCount.textContent) || 0;
        cartCount.textContent = currentCount + 1;
    }
}

function viewProduct(productId) {
    // Navigate to product detail page
    alert(`Xem chi tiết sản phẩm ID: ${productId}`);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Toggle user dropdown menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('userDropdown');
    if (userMenu && !userMenu.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

// Logout function
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Check if user is logged in
window.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const loginBtn = document.getElementById('loginBtn');
    const userBtn = document.getElementById('userBtn');
    const userName = document.getElementById('userName');
    
    if (user && user.name) {
        // User is logged in - show user button with dropdown
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userBtn) userBtn.classList.remove('hidden');
        if (userName) userName.textContent = user.name;
    } else {
        // User not logged in - show login button
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userBtn) userBtn.classList.add('hidden');
    }
});
