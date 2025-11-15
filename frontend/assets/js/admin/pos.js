const API_URL = 'http://localhost:3000/api';
let allProducts = [];
let cart = [];
let selectedPayment = 'cash';

const user = JSON.parse(localStorage.getItem('user') || '{}');
if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    window.location.href = '../login.html';
}

function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.clear();
        window.location.href = '../login.html';
    }
}

async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            allProducts = data.data.filter(p => p.available && p.stock > 0);
            displayProducts(allProducts);
        }
    } catch (error) {
        showNotification('Lỗi tải sản phẩm', 'error');
    }
}

async function loadTables() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tables`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            const select = document.getElementById('tableSelect');
            data.data.filter(t => t.status === 'available').forEach(table => {
                const option = document.createElement('option');
                option.value = table._id;
                option.textContent = `Bàn ${table.number} (${table.capacity} chỗ)`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Lỗi tải bàn:', error);
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (products.length === 0) {
        grid.innerHTML = '<p class="text-center text-gray-400 py-8 col-span-full">Không có sản phẩm</p>';
        return;
    }
    grid.innerHTML = products.map(p => `
        <div class="border rounded-lg p-3 hover:shadow-lg transition-shadow cursor-pointer" onclick="addToCart('${p._id}')">
            <img src="${p.image || '../assets/images/default-product.jpg'}" class="w-full h-32 object-cover rounded mb-2">
            <h4 class="font-medium text-sm mb-1 truncate">${p.name}</h4>
            <p class="text-amber-600 font-bold">${formatCurrency(p.price)}</p>
            <p class="text-xs text-gray-500">Còn ${p.stock}</p>
        </div>
    `).join('');
}

function filterCategory(category) {
    ['catAll', 'catCafe', 'catTea', 'catCake'].forEach(id => {
        document.getElementById(id).classList.remove('bg-amber-600', 'text-white');
        document.getElementById(id).classList.add('bg-gray-200');
    });
    
    if (category === 'all') {
        document.getElementById('catAll').classList.add('bg-amber-600', 'text-white');
        displayProducts(allProducts);
    } else {
        const btnId = category === 'Cà phê' ? 'catCafe' : category === 'Trà' ? 'catTea' : 'catCake';
        document.getElementById(btnId).classList.add('bg-amber-600', 'text-white');
        displayProducts(allProducts.filter(p => p.category === category));
    }
}

document.getElementById('searchProduct').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    displayProducts(allProducts.filter(p => p.name.toLowerCase().includes(search)));
});

function addToCart(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    const existing = cart.find(item => item.productId === productId);
    if (existing) {
        if (existing.quantity >= product.stock) {
            showNotification('Không đủ hàng trong kho', 'error');
            return;
        }
        existing.quantity++;
    } else {
        cart.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
        });
    }
    updateCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    const product = allProducts.find(p => p._id === productId);
    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter(i => i.productId !== productId);
    } else if (item.quantity > product.stock) {
        showNotification('Không đủ hàng trong kho', 'error');
        item.quantity = product.stock;
    }
    updateCart();
}

function updateCart() {
    const container = document.getElementById('cartItems');
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Chưa có sản phẩm</p>';
        document.getElementById('subtotal').textContent = '0 ₫';
        document.getElementById('tax').textContent = '0 ₫';
        document.getElementById('total').textContent = '0 ₫';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <img src="${item.image || '../assets/images/default-product.jpg'}" class="w-12 h-12 rounded mr-2">
            <div class="flex-1">
                <p class="font-medium text-sm">${item.name}</p>
                <p class="text-amber-600 text-sm">${formatCurrency(item.price)}</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="updateQuantity('${item.productId}', -1)" class="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded"><i class="fas fa-minus"></i></button>
                <span class="w-8 text-center font-bold">${item.quantity}</span>
                <button onclick="updateQuantity('${item.productId}', 1)" class="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded"><i class="fas fa-plus"></i></button>
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('tax').textContent = formatCurrency(tax);
    document.getElementById('total').textContent = formatCurrency(total);
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm('Xóa toàn bộ đơn hàng?')) {
        cart = [];
        updateCart();
    }
}

function selectPayment(method) {
    selectedPayment = method;
    ['payCash', 'payCard'].forEach(id => {
        document.getElementById(id).classList.remove('border-green-600', 'bg-green-50', 'text-green-800', 'border-blue-600', 'bg-blue-50', 'text-blue-800');
        document.getElementById(id).classList.add('border-gray-300');
    });
    if (method === 'cash') {
        document.getElementById('payCash').classList.add('border-green-600', 'bg-green-50', 'text-green-800');
    } else {
        document.getElementById('payCard').classList.add('border-blue-600', 'bg-blue-50', 'text-blue-800');
    }
}

async function createOrder() {
    if (cart.length === 0) {
        showNotification('Giỏ hàng trống', 'error');
        return;
    }

    const tableId = document.getElementById('tableSelect').value;
    const note = document.getElementById('orderNote').value;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal * 1.1;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                })),
                tableId: tableId || null,
                totalAmount: total,
                paymentMethod: selectedPayment,
                paymentStatus: 'paid',
                status: 'processing',
                note: note
            })
        });

        const data = await response.json();
        if (data.success) {
            showNotification('Đơn hàng đã được tạo thành công!', 'success');
            cart = [];
            updateCart();
            document.getElementById('orderNote').value = '';
            document.getElementById('tableSelect').value = '';
        } else {
            showNotification(data.message || 'Lỗi tạo đơn hàng', 'error');
        }
    } catch (error) {
        showNotification('Lỗi tạo đơn hàng', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadTables();
});
