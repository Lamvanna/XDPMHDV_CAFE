// Menu Admin functionality
document.addEventListener('DOMContentLoaded', function() {
    loadMenuItems();

    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addMenuItem();
        });
    }
});

async function loadMenuItems() {
    const menuItems = await fetchProducts();
    displayMenuItems(menuItems);
}

function displayMenuItems(items) {
    const container = document.querySelector('.menu-items-admin');
    if (!container) return;

    container.innerHTML = '';
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'menu-item-admin';
        itemElement.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p>Price: $${item.price}</p>
            <button onclick="editMenuItem(${item.id})">Edit</button>
            <button onclick="deleteMenuItem(${item.id})">Delete</button>
        `;
        container.appendChild(itemElement);
    });
}

function addMenuItem() {
    // Implement add menu item logic
    console.log('Adding menu item');
    // This would typically make an API call
}

function editMenuItem(id) {
    // Implement edit menu item logic
    console.log('Editing menu item:', id);
}

function deleteMenuItem(id) {
    // Implement delete menu item logic
    console.log('Deleting menu item:', id);
    // This would typically make an API call
}
