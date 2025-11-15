# HỆ THỐNG QUẢN LÝ QUÁN CÀ PHÊ

**Công nghệ:** HTML, CSS, JavaScript (Frontend) + Node.js (Backend) + MongoDB (Database)

---

## 🧭 I. MỤC TIÊU HỆ THỐNG

Xây dựng hệ thống quản lý quán cà phê giúp:
- Khách hàng có thể đặt món, đặt bàn, xem lịch sử giao dịch.
- Nhân viên có thể order trực tiếp, quản lý bàn và thanh toán nhanh (POS).
- Quản lý có thể theo dõi kho, nhân viên, doanh thu.
- Admin có thể cấu hình toàn hệ thống, phân quyền người dùng, và thống kê hoạt động.

---

## 🧩 II. PHÂN QUYỀN NGƯỜI DÙNG

| Vai trò      | Quyền hạn chính |
|--------------|-----------------|
| 👤 Khách hàng | Xem menu, đặt món, đặt bàn, theo dõi đơn hàng và lịch sử. |
| 👨‍🍳 Nhân viên (POS) | Order món tại quán, cập nhật trạng thái bàn, in hóa đơn. |
| 🧾 Quản lý | Quản lý món, kho, bàn, nhân viên, thống kê doanh thu. |
| 🛠 Admin | Quản lý toàn bộ hệ thống, phân quyền, cài đặt thông tin quán. |

---

## 🏠 III. CHỨC NĂNG CHI TIẾT THEO NHÓM NGƯỜI DÙNG

---

### 🧍‍♂️ A. KHÁCH HÀNG

1. **Trang chủ**
   - Xem giới thiệu quán, món nổi bật, ưu đãi.
   - Điều hướng đến Thực đơn, Đặt bàn, Liên hệ, Đăng nhập.
   - Hiển thị banner quảng cáo và thông tin nổi bật.

2. **Thực đơn**
   - Xem danh sách món: ảnh, giá, loại, trạng thái.
   - Lọc món theo danh mục (Cà phê, Trà, Nước ép, Ăn vặt...).
   - Tìm kiếm món theo tên.
   - Thêm món vào giỏ hàng.

3. **Giỏ hàng**
   - Xem danh sách món đã chọn (ảnh, tên, số lượng, giá).
   - Cập nhật số lượng hoặc xóa món.
   - Tính tổng tiền tạm tính.
   - Chuyển đến trang thanh toán.

4. **Thanh toán**
   - Nhập thông tin giao hàng hoặc chọn "Dùng tại quán."
   - Chọn phương thức thanh toán: Tiền mặt / Momo / Thẻ.
   - Xác nhận đơn hàng → tạo mới đơn trong hệ thống.
   - Nhận thông báo "Đặt hàng thành công."

5. **Đặt bàn**
   - Chọn ngày, giờ, số khách, khu vực (trong nhà / ngoài trời).
   - Gửi yêu cầu đặt bàn.
   - Nhận xác nhận từ nhân viên / quản lý.

6. **Đơn hàng của tôi**
   - Xem danh sách đơn hàng: mã đơn, ngày đặt, tổng tiền, trạng thái.
   - Lọc theo trạng thái (Đang xử lý / Hoàn tất / Đã hủy).
   - Xem chi tiết từng đơn (món, số lượng, tổng tiền).
   - Đánh giá món sau khi hoàn tất.

7. **Lịch sử đặt bàn**
   - Xem lại lịch sử đặt bàn (ngày, giờ, số khách, trạng thái).
   - Hủy bàn nếu chưa tới giờ đặt.
   - Gửi phản hồi hoặc đánh giá dịch vụ.

8. **Hồ sơ cá nhân (Profile)**
   - Xem thông tin: Avatar, họ tên, email, số điện thoại.
   - Cập nhật thông tin cá nhân.
   - Đổi mật khẩu.
   - Xem liên kết nhanh: "Đơn hàng của tôi" / "Lịch sử đặt bàn."

---

### 👨‍🍳 B. NHÂN VIÊN (POS - ORDER TẠI QUÁN)

1. **Sơ đồ bàn (Table Map)**
   - Hiển thị tất cả bàn trong quán (mã bàn, khu vực, trạng thái).
   - Đổi màu theo trạng thái:
     - 🟢 Trống
     - 🟡 Đang phục vụ
     - 🔴 Đã thanh toán
   - Click chọn bàn để order món.

2. **Order món**
   - Hiển thị menu món.
   - Chọn món → tự động thêm vào bàn đang phục vụ.
   - Cập nhật số lượng hoặc xóa món.
   - Ghi chú món (nếu có yêu cầu đặc biệt).

3. **Hóa đơn tạm thời**
   - Hiển thị danh sách món đang order cho bàn.
   - Tính tổng tiền tạm thời.
   - Có nút "In tạm hóa đơn."

4. **Thanh toán nhanh**
   - Chọn bàn → bấm "Thanh toán."
   - Chọn phương thức (Tiền mặt / QR / Momo).
   - In hóa đơn → cập nhật trạng thái bàn sang "Trống."

---

### 🧾 C. QUẢN LÝ (MANAGER)

1. **Quản lý món**
   - Thêm, sửa, xóa món.
   - Cập nhật giá, loại món, ảnh đại diện.
   - Ẩn / hiển thị món trong menu.
   - Tìm kiếm và lọc món theo loại.

2. **Quản lý đơn hàng**
   - Theo dõi toàn bộ đơn hàng của khách.
   - Cập nhật trạng thái: "Chờ xác nhận" → "Đang chuẩn bị" → "Hoàn tất."
   - Xem chi tiết món trong đơn.
   - In hóa đơn cho khách.

3. **Quản lý nhân viên**
   - Danh sách nhân viên: tên, vai trò, ca làm, liên hệ.
   - Thêm / sửa / xóa nhân viên.
   - Phân quyền (POS / Quản lý kho / Quản lý bàn...).
   - Cập nhật ca làm, chấm công.

4. **Quản lý kho**
   - Theo dõi nguyên liệu, số lượng tồn, hạn sử dụng.
   - Nhập hàng mới, xuất hàng khi pha chế.
   - Cảnh báo khi tồn kho thấp.
   - Báo cáo nhập – xuất – tồn định kỳ.

5. **Quản lý bàn**
   - Danh sách bàn (số bàn, khu vực, sức chứa).
   - Thêm / xóa bàn.
   - Cập nhật trạng thái (đang sử dụng / trống / bảo trì).

6. **Thống kê**
   - Biểu đồ doanh thu theo ngày / tháng / nhân viên.
   - Top món bán chạy nhất.
   - Tổng hợp chi phí nguyên liệu.
   - Báo cáo lợi nhuận định kỳ.

---

### 🛠 D. ADMIN HỆ THỐNG

1. **Dashboard tổng quan**
   - Biểu đồ doanh thu.
   - Tổng số đơn hàng, khách, nhân viên.
   - Thống kê nhanh theo thời gian thực.

2. **Quản lý người dùng hệ thống**
   - Danh sách tất cả tài khoản (Admin / Quản lý / Nhân viên / Khách hàng).
   - Thêm / sửa / xóa tài khoản.
   - Cấp quyền và giới hạn truy cập.

3. **Quản lý cấu hình hệ thống**
   - Thông tin quán (tên, logo, địa chỉ, giờ mở cửa).
   - Cấu hình email, thanh toán, thông báo.
   - Thiết lập API key (nếu cần).

4. **Sao lưu & khôi phục dữ liệu**
   - Xuất dữ liệu ra file (CSV, Excel).
   - Sao lưu toàn bộ database.
   - Khôi phục từ bản sao lưu.

5. **Nhật ký hoạt động (Logs)**
   - Ghi lại lịch sử thao tác: đăng nhập, thêm món, sửa đơn, xóa nhân viên, v.v.
   - Lọc theo ngày / người thực hiện.

---

## 📊 IV. CÁC CHỨC NĂNG HỆ THỐNG HỖ TRỢ

| Hạng mục | Mô tả |
|----------|-------|
| 🔐 Đăng nhập / Đăng ký / Phân quyền | Bảo mật JWT, phân quyền theo vai trò (role-based). |
| 🕵️‍♀️ Tìm kiếm & Lọc | Cho phép tìm theo tên, loại món, trạng thái đơn hàng. |
| 📱 Responsive UI | Giao diện tối ưu cho điện thoại và máy tính bảng. |
| 🔔 Thông báo (Notification) | Thông báo đơn hàng mới, hết hàng, bàn trống. |
| 💬 Phản hồi khách hàng | Khách có thể gửi đánh giá, góp ý. |
| 📈 Báo cáo tự động | Xuất PDF / Excel theo thời gian. |

---

## 💾 V. TỔNG KẾT LUỒNG HOẠT ĐỘNG

### 🔹 Khách hàng
1. Xem menu → chọn món → thanh toán.
2. Hoặc đặt bàn → đến quán → xác nhận / hủy.
3. Xem lại đơn hàng và lịch sử đặt bàn.

### 🔹 Nhân viên
1. Nhận bàn → order món → in hóa đơn.
2. Thanh toán → cập nhật trạng thái bàn.

### 🔹 Quản lý
1. Theo dõi đơn hàng / kho / bàn / nhân viên.
2. Xuất báo cáo doanh thu và hoạt động.

### 🔹 Admin
1. Cấu hình hệ thống, phân quyền, sao lưu dữ liệu.
2. Theo dõi hoạt động toàn hệ thống.

---

## 📁 VI. CẤU TRÚC DỰ ÁN

```
cafe-management-system/
│
├── frontend/                         # Giao diện người dùng (HTML, CSS, JS)
│   ├── assets/                       # Hình ảnh, biểu tượng, font, v.v.
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── css/
│   │   ├── style.css                 # CSS chung cho toàn hệ thống
│   │   ├── header.css                # CSS riêng cho header / navbar
│   │   ├── home.css                  # Giao diện Trang chủ (SCREEN 1)
│   │   ├── menu.css                  # Giao diện Menu món (SCREEN 2)
│   │   ├── detail.css                # Chi tiết món (SCREEN 3)
│   │   ├── cart.css                  # Giỏ hàng (SCREEN 4)
│   │   ├── checkout.css              # Thanh toán (SCREEN 5)
│   │   ├── reservation.css           # Đặt bàn (SCREEN 6)
│   │   ├── auth.css                  # Đăng nhập / Đăng ký (SCREEN 7)
│   │   ├── profile.css               # Hồ sơ cá nhân (SCREEN 8)
│   │   ├── orders.css                # Đơn hàng của tôi (SCREEN 9)
│   │   ├── reservation-history.css   # Lịch sử đặt bàn (SCREEN 10)
│   │   ├── dashboard.css             # Dashboard admin (SCREEN 11)
│   │   ├── admin-products.css        # Quản lý món (SCREEN 12)
│   │   ├── admin-orders.css          # Quản lý đơn hàng (SCREEN 13)
│   │   ├── admin-staff.css           # Quản lý nhân viên (SCREEN 14)
│   │   ├── admin-inventory.css       # Quản lý kho (SCREEN 15)
│   │   ├── admin-tables.css          # Quản lý bàn (SCREEN 16)
│   │   ├── admin-stats.css           # Thống kê (SCREEN 17)
│   │   └── admin-settings.css        # Cài đặt hệ thống (SCREEN 18)
│   │
│   ├── js/
│   │   ├── main.js                   # Script chính (điều hướng, navbar, footer)
│   │   ├── api.js                    # Hàm gọi API đến backend
│   │   ├── home.js                   # Trang chủ
│   │   ├── menu.js                   # Danh sách món
│   │   ├── detail.js                 # Chi tiết món
│   │   ├── cart.js                   # Giỏ hàng
│   │   ├── checkout.js               # Thanh toán
│   │   ├── reservation.js            # Đặt bàn
│   │   ├── auth.js                   # Đăng nhập / Đăng ký
│   │   ├── profile.js                # Hồ sơ cá nhân
│   │   ├── orders.js                 # Lịch sử đơn hàng
│   │   ├── reservationHistory.js     # Lịch sử đặt bàn
│   │   ├── dashboard.js              # Trang tổng quan admin
│   │   ├── admin-products.js         # CRUD món
│   │   ├── admin-orders.js           # Quản lý đơn hàng
│   │   ├── admin-staff.js            # Quản lý nhân viên
│   │   ├── admin-inventory.js        # Quản lý kho
│   │   ├── admin-tables.js           # Quản lý bàn
│   │   ├── admin-stats.js            # Thống kê
│   │   └── admin-settings.js         # Cài đặt hệ thống
│   │
│   ├── pages/                        # Từng màn hình giao diện
│   │   ├── index.html                # 🏠 Trang chủ
│   │   ├── menu.html                 # 🍽️ Thực đơn
│   │   ├── detail.html               # 🧾 Chi tiết món
│   │   ├── cart.html                 # 🛒 Giỏ hàng
│   │   ├── checkout.html             # 💳 Thanh toán
│   │   ├── reservation.html          # 🪑 Đặt bàn
│   │   ├── login.html                # 👤 Đăng nhập
│   │   ├── register.html             # ✍️ Đăng ký
│   │   ├── profile.html              # 🧍‍♂️ Hồ sơ cá nhân
│   │   ├── my-orders.html            # 📦 Đơn hàng của tôi
│   │   ├── reservation-history.html  # 📅 Lịch sử đặt bàn
│   │   ├── dashboard.html            # 🧭 Dashboard (Admin Home)
│   │   ├── admin-products.html       # 📋 Quản lý món
│   │   ├── admin-orders.html         # 🧾 Quản lý đơn hàng
│   │   ├── admin-staff.html          # 👨‍🍳 Quản lý nhân viên
│   │   ├── admin-inventory.html      # 🏭 Quản lý kho
│   │   ├── admin-tables.html         # 🪑 Quản lý bàn
│   │   ├── admin-stats.html          # 📊 Thống kê / Báo cáo
│   │   └── admin-settings.html       # ⚙️ Cài đặt hệ thống
│   │
│   ├── components/                   # Thành phần dùng chung
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── sidebar-admin.html
│   │   └── modal.html
│   │
│   └── index.html                    # File chạy chính (Router frontend)
│
├── backend/                          # Xử lý logic và API (Node.js + Express)
│   ├── server.js                     # File khởi động server
│   ├── config/
│   │   ├── db.js                     # Kết nối MongoDB
│   │   └── env.js                    # Cấu hình biến môi trường
│   │
│   ├── models/                       # Định nghĩa schema MongoDB
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Table.js
│   │   ├── Reservation.js
│   │   ├── Staff.js
│   │   └── Inventory.js
│   │
│   ├── routes/                       # Khai báo endpoint API
│   │   ├── authRoutes.js             # Đăng nhập / Đăng ký / Token
│   │   ├── productRoutes.js          # Quản lý món
│   │   ├── orderRoutes.js            # Quản lý đơn hàng
│   │   ├── reservationRoutes.js      # Đặt bàn
│   │   ├── staffRoutes.js            # Nhân viên
│   │   ├── inventoryRoutes.js        # Kho
│   │   ├── tableRoutes.js            # Bàn
│   │   ├── dashboardRoutes.js        # Thống kê / báo cáo
│   │   └── settingsRoutes.js         # Cài đặt hệ thống
│   │
│   ├── controllers/                  # Xử lý logic cho từng route
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── reservationController.js
│   │   ├── staffController.js
│   │   ├── inventoryController.js
│   │   ├── tableController.js
│   │   ├── dashboardController.js
│   │   └── settingsController.js
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js         # Xác thực JWT, phân quyền
│   │   └── errorHandler.js
│   │
│   └── utils/
│       ├── sendEmail.js
│       ├── generateReport.js
│       └── logger.js
│
├── .env                              # Cấu hình môi trường (PORT, DB_URI,…)
├── package.json
└── README.md
```

---

## 🚀 VII. CÀI ĐẶT VÀ CHẠY DỰ ÁN

1. **Clone repository:**
   ```
   git clone https://github.com/Lamvanna/CAFE_SHOP.git
   cd cafe-management-system
   ```

2. **Cài đặt dependencies:**
   ```
   npm install
   ```

3. **Cấu hình môi trường:**
   - Tạo file `.env` trong thư mục `backend/` với nội dung:
     ```
     MONGODB_URI=mongodb://localhost:27017/cafe-system
     JWT_SECRET=your_jwt_secret_here
     PORT=3000
     ```

4. **Khởi động MongoDB:**
   - Đảm bảo MongoDB đang chạy trên máy.

5. **Chạy server:**
   ```
   npm run dev
   ```

6. **Truy cập ứng dụng:**
   - Frontend: Mở `frontend/index.html` trong trình duyệt.
   - API: `http://localhost:3000`

---

## 📝 VIII. API ENDPOINTS

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `GET /api/auth/me` - Thông tin người dùng hiện tại

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `PUT /api/orders/:id` - Cập nhật đơn hàng

### Tables
- `GET /api/tables` - Lấy danh sách bàn
- `POST /api/tables` - Tạo bàn mới
- `PUT /api/tables/:id` - Cập nhật bàn

### Reservations
- `GET /api/reservations` - Lấy danh sách đặt bàn
- `POST /api/reservations` - Tạo đặt bàn mới

### Staff
- `GET /api/staff` - Lấy danh sách nhân viên
- `POST /api/staff` - Thêm nhân viên

### Inventory
- `GET /api/inventory` - Lấy danh sách kho
- `POST /api/inventory` - Thêm nguyên liệu

### Dashboard
- `GET /api/dashboard/stats` - Thống kê tổng quan

---

## 🤝 IX. ĐÓNG GÓP

1. Fork dự án
2. Tạo nhánh feature mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên nhánh (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

---

## 📄 X. GIẤY PHÉP

Dự án này được phân phối dưới giấy phép ISC.

---

## 📞 XI. LIÊN HỆ

Nếu bạn có câu hỏi hoặc góp ý, vui lòng liên hệ qua email hoặc tạo issue trên GitHub.
