# ✅ Đã sửa lỗi validate URL

## Vấn đề:
- Input logo có `type="url"` → bắt buộc phải nhập URL hợp lệ
- Không chấp nhận đường dẫn local như `/uploads/logo.png`

## Giải pháp:
- ✅ Đổi thành `type="text"` cho input logo
- ✅ Giữ `type="url"` cho Website và Facebook (vì chúng cần URL thật)

## Bây giờ có thể nhập:
1. ✅ URL đầy đủ: `https://i.imgur.com/abc123.png`
2. ✅ Đường dẫn tương đối: `/uploads/logo-123456.png`
3. ✅ Đường dẫn local: `./assets/images/logo.png`
4. ✅ Để trống (sẽ dùng logo mặc định)

## Test ngay:
1. Mở admin settings
2. Upload logo từ máy → Sẽ tự động điền `/uploads/logo-xxx.png`
3. Click "Lưu thay đổi" → Không còn lỗi validate!
4. Hoặc nhập URL từ Imgur/Cloudinary → Vẫn hoạt động bình thường

## Các trường hợp:
- Logo: `type="text"` ✅ (linh hoạt)
- Website: `type="url"` ✅ (cần URL thật)
- Facebook: `type="url"` ✅ (cần URL thật)
- Email: `type="email"` ✅ (cần email hợp lệ)
- Phone: `type="tel"` ✅ (số điện thoại)
