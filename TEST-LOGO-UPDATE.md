# ✅ Đã cập nhật Logo Header

## Thay đổi:

### Trước:
```html
<div class="w-10 h-10 sm:w-12 sm:h-12 bg-coffee rounded-full flex items-center justify-center">
    <i class="fas fa-coffee text-white text-lg sm:text-xl"></i>
</div>
```

### Sau:
```html
<div class="w-10 h-10 sm:w-12 sm:h-12 bg-coffee rounded-full flex items-center justify-center overflow-hidden shop-logo-container">
    <i class="fas fa-coffee text-white text-lg sm:text-xl shop-logo-icon"></i>
    <img src="" alt="Logo" class="shop-logo w-full h-full object-cover hidden">
</div>
```

## Cách hoạt động:

1. **Mặc định:** Hiển thị icon cà phê (FontAwesome)
2. **Khi có logo:** 
   - Ẩn icon cà phê
   - Hiển thị ảnh logo
   - Đổi background từ nâu sang trắng

## Các trang đã cập nhật:

- ✅ index.html
- ✅ menu.html
- ✅ cart.html
- ✅ checkout.html
- ✅ contact.html
- ✅ detail.html
- ✅ profile.html
- ✅ promotion.html
- ✅ my-orders.html
- ✅ reservation.html
- ✅ reservation-history.html

## Test ngay:

### Bước 1: Upload logo
1. Vào admin settings
2. Upload logo hoặc nhập URL
3. Lưu thay đổi

### Bước 2: Kiểm tra
1. Reload trang index.html
2. Logo mới sẽ hiển thị thay vì icon cà phê
3. Kiểm tra các trang khác (menu, cart, etc.)

### Bước 3: Xóa logo (test fallback)
1. Xóa URL logo trong admin settings
2. Lưu lại
3. Reload → Icon cà phê sẽ hiển thị lại

## Debug:

Mở Console (F12) và xem logs:
```
🔄 Loading shop settings...
📥 Settings loaded: {success: true, settings: {...}}
✅ Applying settings: {shop: {logo: "/uploads/logo-xxx.png", ...}}
```

Kiểm tra logo có được áp dụng:
```javascript
// Check logo URL
document.querySelector('.shop-logo').src

// Check if icon is hidden
document.querySelector('.shop-logo-icon').classList.contains('hidden')

// Check if logo is visible
!document.querySelector('.shop-logo').classList.contains('hidden')
```

## CSS Classes:

- `.shop-logo-container` - Container của logo
- `.shop-logo-icon` - Icon mặc định (FontAwesome)
- `.shop-logo` - Ảnh logo (img tag)

## Tự động:

File `settings-loader.js` sẽ tự động:
1. Load settings từ API
2. Kiểm tra có logo không
3. Nếu có: Hiển thị logo, ẩn icon
4. Nếu không: Hiển thị icon, ẩn logo
