// Load and apply shop settings dynamically
let shopSettings = null;

async function loadShopSettings() {
    try {
        console.log('🔄 Loading shop settings...');
        const response = await fetch('http://localhost:3000/api/settings');
        const data = await response.json();
        
        console.log('📥 Settings loaded:', data);
        
        if (data.success && data.settings) {
            shopSettings = data.settings;
            console.log('✅ Applying settings:', shopSettings);
            applyShopSettings();
        }
    } catch (error) {
        console.log('⚠️ Could not load shop settings, using defaults', error);
    }
}

function applyShopSettings() {
    if (!shopSettings) return;
    
    const { shop } = shopSettings;
    
    // Update shop name
    const shopNameElements = document.querySelectorAll('.shop-name, [data-shop-name]');
    shopNameElements.forEach(el => {
        el.textContent = shop.name || 'Coffee House';
    });
    
    // Update shop logo (if exists)
    if (shop.logo) {
        // Update img tags with class shop-logo
        const logoImgElements = document.querySelectorAll('img.shop-logo, img[data-shop-logo]');
        logoImgElements.forEach(el => {
            el.src = shop.logo;
            el.classList.remove('hidden');
        });
        
        // Hide default icon when logo exists
        const logoIcons = document.querySelectorAll('.shop-logo-icon');
        logoIcons.forEach(icon => {
            icon.classList.add('hidden');
        });
        
        // Update logo containers background
        const logoContainers = document.querySelectorAll('.shop-logo-container');
        logoContainers.forEach(container => {
            container.classList.remove('bg-coffee');
            container.classList.add('bg-white');
        });
    }
    
    // Update address
    const addressElements = document.querySelectorAll('.shop-address, [data-shop-address]');
    addressElements.forEach(el => {
        el.textContent = shop.address || '';
    });
    
    // Update phone
    const phoneElements = document.querySelectorAll('.shop-phone, [data-shop-phone]');
    phoneElements.forEach(el => {
        el.textContent = shop.phone || '';
        if (el.tagName === 'A') {
            el.href = 'tel:' + shop.phone;
        }
    });
    
    // Update email
    const emailElements = document.querySelectorAll('.shop-email, [data-shop-email]');
    emailElements.forEach(el => {
        el.textContent = shop.email || '';
        if (el.tagName === 'A') {
            el.href = 'mailto:' + shop.email;
        }
    });
    
    // Update description
    const descElements = document.querySelectorAll('.shop-description, [data-shop-description]');
    descElements.forEach(el => {
        el.textContent = shop.description || '';
    });
    
    // Update website
    const websiteElements = document.querySelectorAll('.shop-website, [data-shop-website]');
    websiteElements.forEach(el => {
        if (shop.website) {
            el.textContent = shop.website;
            if (el.tagName === 'A') {
                el.href = shop.website;
            }
        }
    });
    
    // Update facebook
    const facebookElements = document.querySelectorAll('.shop-facebook, [data-shop-facebook]');
    facebookElements.forEach(el => {
        if (shop.facebook) {
            el.textContent = shop.facebook;
            if (el.tagName === 'A') {
                el.href = shop.facebook;
            }
        }
    });
    
    // Update page title
    const titleParts = document.title.split('|');
    if (titleParts.length > 1) {
        document.title = titleParts[0].trim() + ' | ' + shop.name;
    }
}

// Load settings when page loads
document.addEventListener('DOMContentLoaded', loadShopSettings);
