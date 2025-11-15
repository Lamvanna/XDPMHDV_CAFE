# 📤 Hướng dẫn Upload Logo Trực Tiếp

## ✅ Đã cài đặt xong!

### Backend:
- ✅ Multer đã được cài đặt
- ✅ Upload Controller (`backend/controllers/uploadController.js`)
- ✅ Upload Routes (`backend/routes/uploadRoutes.js`)
- ✅ Static serving cho `/uploads` folder
- ✅ Giới hạn: 5MB, chỉ chấp nhận ảnh (JPEG, PNG, GIF, SVG, WebP)

### Frontend:
- ✅ Nút "Upload từ máy" trong admin settings
- ✅ Tự động upload và preview
- ✅ Validation file type và size

## 🚀 Cách sử dụng:

### Cách 1: Upload File Trực Tiếp (MỚI!)
1. Vào trang admin settings: `http://localhost:3000/admin/admin-settings.html`
2. Tìm phần "Logo cửa hàng"
3. Click nút **"Upload từ máy"** (màu xanh lá)
4. Chọn file ảnh từ máy tính (JPEG, PNG, GIF, SVG, WebP)
5. Đợi upload xong (sẽ có thông báo)
6. Logo sẽ tự động hiển thị trong ô preview
7. Click **"Lưu thay đổi"** để lưu vào database

### Cách 2: Nhập URL (Như trước)
1. Upload ảnh lên Imgur/Cloudinary
2. Copy URL
3. Dán vào ô input
4. Click "Xem trước"
5. Click "Lưu thay đổi"

## 📁 File được lưu ở đâu?

- **Thư mục:** `frontend/uploads/`
- **Tên file:** `logo-[timestamp]-[random].ext`
- **Ví dụ:** `logo-1699999999999-123456789.png`
- **URL:** `http://localhost:3000/uploads/logo-1699999999999-123456789.png`

## 🔒 Bảo mật:

- ✅ Chỉ Admin mới upload được (middleware: `authenticate`, `isAdmin`)
- ✅ Chỉ chấp nhận file ảnh
- ✅ Giới hạn kích thước 5MB
- ✅ Tên file được random để tránh conflict

## 🧪 Test API trực tiếp:

### Upload Logo (POST)
```bash
curl -X POST http://localhost:3000/api/upload/logo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "logo=@/path/to/your/logo.png"
```

### Response thành công:
```json
{
  "success": true,
  "message": "Upload logo thành công",
  "logoUrl": "/uploads/logo-1699999999999-123456789.png",
  "filename": "logo-1699999999999-123456789.png"
}
```

### Delete Logo (DELETE)
```bash
curl -X DELETE http://localhost:3000/api/upload/logo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename": "logo-1699999999999-123456789.png"}'
```

## ⚠️ Lưu ý:

1. **File được lưu local:** Nếu deploy lên server, cần cấu hình storage khác (AWS S3, Cloudinary, etc.)
2. **Không commit uploads:** Folder `frontend/uploads/*` đã được thêm vào `.gitignore`
3. **Backup:** Nhớ backup folder uploads khi deploy
4. **CDN:** Nên dùng CDN cho production để tăng tốc độ load

## 🎯 Các bước tiếp theo (Optional):

### 1. Tích hợp Cloudinary (Khuyến nghị cho Production)
```bash
npm install cloudinary multer-storage-cloudinary
```

### 2. Tự động resize ảnh
```bash
npm install sharp
```

### 3. Xóa logo cũ khi upload logo mới
- Đã có API DELETE, có thể tự động gọi khi upload mới

## 🐛 Troubleshooting:

### Lỗi: "Không có file được upload"
- Kiểm tra input có `name="logo"` không
- Kiểm tra FormData đã append đúng chưa

### Lỗi: "File quá lớn"
- Giảm kích thước file (dùng TinyPNG.com)
- Hoặc tăng limit trong `uploadController.js`

### Lỗi: 401 Unauthorized
- Kiểm tra token trong localStorage
- Đăng nhập lại với tài khoản admin

### Logo không hiển thị
- Kiểm tra URL: `http://localhost:3000/uploads/filename.png`
- Kiểm tra file có tồn tại trong `frontend/uploads/` không
- Kiểm tra server đã serve static files chưa

## 📊 So sánh 2 cách:

| Tính năng | Upload File | Nhập URL |
|-----------|-------------|----------|
| Dễ sử dụng | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Tốc độ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Bảo mật | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Phụ thuộc bên thứ 3 | ❌ | ✅ |
| Cần storage | ✅ | ❌ |
| Phù hợp cho | Development, Small apps | Production, Large scale |

## 💡 Khuyến nghị:

- **Development:** Dùng Upload File (đơn giản, nhanh)
- **Production:** Dùng Cloudinary/AWS S3 (scalable, CDN, backup tự động)
