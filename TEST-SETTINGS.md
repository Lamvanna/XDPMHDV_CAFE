# Hướng dẫn Test Hệ thống Settings

## ✅ Đã hoàn thành:

1. **Backend:**
   - ✅ Model Settings có đầy đủ fields: name, address, phone, email, website, facebook, description
   - ✅ Routes: GET /api/settings (public), PUT /api/settings (admin only)
   - ✅ Controller: getSettings và updateSettings

2. **Frontend Admin:**
   - ✅ File `frontend/assets/js/admin/settings.js` đã được tạo
   - ✅ Hàm `showNotification()` đã được thêm
   - ✅ Hàm `loadSettings()` - load dữ liệu từ API
   - ✅ Hàm `saveShopInfo()` - lưu dữ liệu lên API
   - ✅ File `admin-settings.html` đã load script `settings.js`

3. **Frontend User:**
   - ✅ File `settings-loader.js` tự động load settings khi trang load
   - ✅ Đã thêm script vào tất cả các trang: index.html, menu.html, contact.html, cart.html, etc.
   - ✅ Tự động cập nhật: shop-name, shop-address, shop-phone, shop-email, shop-website, shop-facebook, shop-description

## 🧪 Cách Test:

### Bước 1: Khởi động server
```bash
npm start
# hoặc
node backend/server.js
```

### Bước 2: Test Admin Settings
1. Mở trình duyệt và vào: `http://localhost:3000/admin/admin-settings.html`
2. Đăng nhập với tài khoản admin
3. Mở Console (F12) để xem logs
4. Thay đổi thông tin cửa hàng (tên, địa chỉ, số điện thoại, email, website, facebook)
5. Click "Lưu thay đổi"
6. Kiểm tra:
   - ✅ Console hiển thị: "💾 Saving shop info..."
   - ✅ Console hiển thị: "📤 Sending data: {...}"
   - ✅ Console hiển thị: "✅ Settings saved successfully"
   - ✅ Notification màu xanh hiện lên: "Đã lưu thông tin cửa hàng"

### Bước 3: Test Frontend User
1. Mở tab mới và vào: `http://localhost:3000/index.html`
2. Mở Console (F12)
3. Kiểm tra logs:
   - ✅ "🔄 Loading shop settings..."
   - ✅ "📥 Settings loaded: {...}"
   - ✅ "✅ Applying settings: {...}"
4. Kiểm tra header trang web:
   - ✅ Tên cửa hàng đã thay đổi theo settings
5. Reload trang và kiểm tra lại

### Bước 4: Test các trang khác
- Menu: `http://localhost:3000/menu.html`
- Contact: `http://localhost:3000/contact.html`
- Cart: `http://localhost:3000/cart.html`

Tất cả các trang này đều phải hiển thị thông tin cửa hàng mới.

## 🔍 Debug nếu có lỗi:

### Lỗi: "showNotification is not defined"
- ✅ Đã fix: Thêm hàm showNotification vào settings.js

### Lỗi: Settings không load ở frontend
- ✅ Đã fix: Thêm script settings-loader.js vào tất cả các trang HTML

### Lỗi: Admin không lưu được
- Kiểm tra token trong localStorage: `localStorage.getItem('authToken')`
- Kiểm tra role: `JSON.parse(localStorage.getItem('user')).role` phải là 'admin'

### Lỗi: 401 Unauthorized
- Đăng nhập lại với tài khoản admin

## 📝 Các class CSS để áp dụng settings:

Thêm các class này vào HTML để tự động cập nhật:
- `.shop-name` hoặc `[data-shop-name]` - Tên cửa hàng
- `.shop-address` hoặc `[data-shop-address]` - Địa chỉ
- `.shop-phone` hoặc `[data-shop-phone]` - Số điện thoại
- `.shop-email` hoặc `[data-shop-email]` - Email
- `.shop-website` hoặc `[data-shop-website]` - Website
- `.shop-facebook` hoặc `[data-shop-facebook]` - Facebook
- `.shop-description` hoặc `[data-shop-description]` - Mô tả

Ví dụ:
```html
<h1 class="shop-name">Coffee House</h1>
<p class="shop-address">123 Nguyễn Huệ</p>
<a href="tel:" class="shop-phone">0901234567</a>
```
