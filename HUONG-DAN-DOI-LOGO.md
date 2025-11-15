# 🎨 Hướng dẫn Đổi Logo Cửa Hàng

## Cách 1: Sử dụng URL Logo (Đơn giản - Đã cài đặt)

### Bước 1: Chuẩn bị logo
1. Tạo/chọn logo của bạn (định dạng: PNG, JPG, SVG)
2. Kích thước khuyến nghị: 200x200px hoặc 512x512px
3. Nền trong suốt (PNG) để đẹp hơn

### Bước 2: Upload logo lên hosting
Chọn một trong các dịch vụ miễn phí:

**Option A: Imgur (Khuyến nghị)**
1. Vào https://imgur.com
2. Click "New post" → Upload ảnh
3. Click chuột phải vào ảnh → "Copy image address"
4. URL sẽ có dạng: `https://i.imgur.com/xxxxx.png`

**Option B: Cloudinary**
1. Đăng ký tài khoản tại https://cloudinary.com
2. Upload ảnh
3. Copy URL

**Option C: GitHub (Nếu dự án trên GitHub)**
1. Tạo folder `frontend/assets/images/`
2. Upload logo vào đó
3. URL: `./assets/images/logo.png` (relative path)

### Bước 3: Cập nhật logo trong Admin
1. Mở trình duyệt và vào: `http://localhost:3000/admin/admin-settings.html`
2. Đăng nhập với tài khoản admin
3. Tìm phần "Logo cửa hàng" (ở đầu form)
4. Dán URL logo vào ô input
5. Click nút "Xem trước" để kiểm tra
6. Nếu logo hiển thị đúng, click "Lưu thay đổi"

### Bước 4: Kiểm tra kết quả
1. Mở trang user: `http://localhost:3000/index.html`
2. Logo mới sẽ hiển thị ở header (nếu có class `.shop-logo`)

## Cách 2: Upload File Trực Tiếp (Nâng cao)

Nếu bạn muốn upload file trực tiếp từ máy tính, cần cài đặt thêm:

### Cài đặt Multer (Backend)
```bash
npm install multer
```

### Tạo Upload Controller
Tôi có thể giúp bạn tạo:
1. Upload endpoint: `POST /api/upload/logo`
2. Lưu file vào `frontend/uploads/`
3. Trả về URL để lưu vào database

Bạn có muốn tôi tạo chức năng upload file không?

## 📝 Áp dụng Logo vào HTML

Để logo tự động cập nhật, thêm class hoặc attribute vào thẻ `<img>`:

### Cách 1: Sử dụng class
```html
<img src="default-logo.png" alt="Logo" class="shop-logo">
```

### Cách 2: Sử dụng data attribute
```html
<img src="default-logo.png" alt="Logo" data-shop-logo>
```

### Ví dụ trong Header
```html
<header>
    <div class="logo-container">
        <img src="./assets/images/default-logo.png" 
             alt="Coffee House Logo" 
             class="shop-logo w-12 h-12 object-contain">
        <h1 class="shop-name">Coffee House</h1>
    </div>
</header>
```

## 🎯 Các trang đã hỗ trợ tự động cập nhật logo:
- ✅ index.html
- ✅ menu.html
- ✅ contact.html
- ✅ cart.html
- ✅ detail.html
- ✅ promotion.html
- ✅ profile.html
- ✅ my-orders.html
- ✅ reservation.html
- ✅ reservation-history.html
- ✅ checkout.html

## 🔧 Troubleshooting

### Logo không hiển thị?
1. Kiểm tra URL có đúng không (mở URL trực tiếp trên trình duyệt)
2. Kiểm tra CORS (một số hosting chặn hotlink)
3. Kiểm tra Console (F12) xem có lỗi không
4. Đảm bảo HTML có class `.shop-logo` hoặc `[data-shop-logo]`

### Logo bị vỡ/méo?
1. Thêm CSS: `object-fit: contain;` hoặc `object-fit: cover;`
2. Set kích thước cố định: `width: 48px; height: 48px;`

### Logo load chậm?
1. Tối ưu kích thước file (< 100KB)
2. Sử dụng định dạng WebP hoặc SVG
3. Sử dụng CDN như Cloudinary

## 💡 Tips
- Sử dụng SVG cho logo để scale tốt ở mọi kích thước
- Nền trong suốt (PNG) trông chuyên nghiệp hơn
- Kích thước 512x512px là lý tưởng cho web và mobile
- Nén ảnh trước khi upload (dùng TinyPNG.com)
