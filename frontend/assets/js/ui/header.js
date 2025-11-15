// Header UI components
function createHeader() {
    const header = document.createElement('header');
    header.innerHTML = `
        <h1>Coffee System</h1>
        <nav>
            <a href="index.html">Home</a>
            <a href="menu.html">Menu</a>
            <a href="cart.html">Cart</a>
            <a href="login.html">Login</a>
        </nav>
    `;
    return header;
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartLink = document.querySelector('nav a[href="cart.html"]');
    if (cartLink) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartLink.textContent = `Cart (${totalItems})`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});
