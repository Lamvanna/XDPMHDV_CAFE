# Coffee System Backend API

Backend API cho hệ thống quản lý quán cà phê được xây dựng với Node.js, Express và MongoDB.

## 🚀 Cài đặt

### Yêu cầu
- Node.js (v14 trở lên)
- MongoDB (v4.4 trở lên)
- npm hoặc yarn

### Các bước cài đặt

1. **Cài đặt dependencies**
```bash
npm install
```

2. **Cấu hình môi trường**
Tạo file `.env` trong thư mục gốc với nội dung:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/coffee-system
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5500
```

3. **Khởi động MongoDB**
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

4. **Chạy server**
```bash
# Development mode (với nodemon)
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 📚 API Documentation

### Authentication Routes (`/api/auth`)

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0123456789",
  "role": "customer"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "user123",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### Product Routes (`/api/products`)

#### Get All Products (Public)
```http
GET /api/products?category=coffee&available=true&search=latte
```

#### Get Product by ID (Public)
```http
GET /api/products/:id
```

#### Create Product (Staff/Admin only)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Cappuccino",
  "description": "Classic Italian coffee",
  "price": 45000,
  "category": "coffee",
  "image": "cappuccino.jpg",
  "stock": 100,
  "available": true
}
```

#### Update Product (Staff/Admin only)
```http
PUT /api/products/:id
Authorization: Bearer <token>
```

#### Update Stock (Staff/Admin only)
```http
PATCH /api/products/:id/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "stock": 50
}
```

### Order Routes (`/api/orders`)

#### Create Order (Authenticated)
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product": "product_id",
      "quantity": 2,
      "price": 45000
    }
  ],
  "total": 90000,
  "orderType": "dine-in",
  "table": "table_id",
  "paymentMethod": "cash"
}
```

#### Get User Orders (Authenticated)
```http
GET /api/orders/user/:userId
Authorization: Bearer <token>
```

#### Update Order Status (Staff/Admin only)
```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing"
}
```

Order Status: `pending`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled`

### Promotion Routes (`/api/promotions`)

#### Get Active Promotions (Public)
```http
GET /api/promotions/active
```

#### Validate Promotion Code (Authenticated)
```http
POST /api/promotions/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "SUMMER2024",
  "orderValue": 100000,
  "productIds": ["product_id_1", "product_id_2"]
}
```

#### Create Promotion (Staff/Admin only)
```http
POST /api/promotions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Summer Sale",
  "description": "20% off all drinks",
  "discountType": "percentage",
  "discountValue": 20,
  "code": "SUMMER2024",
  "minOrderValue": 50000,
  "maxDiscount": 30000,
  "startDate": "2024-06-01",
  "endDate": "2024-08-31",
  "isActive": true,
  "usageLimit": 100
}
```

### Statistics Routes (`/api/stats`) - Staff/Admin only

#### Dashboard Overview
```http
GET /api/stats/dashboard
Authorization: Bearer <token>
```

#### Sales Statistics
```http
GET /api/stats/sales?startDate=2024-01-01&endDate=2024-12-31&period=monthly
Authorization: Bearer <token>
```

#### Popular Items
```http
GET /api/stats/popular-items?limit=10
Authorization: Bearer <token>
```

#### Low Stock Products
```http
GET /api/stats/low-stock?threshold=10
Authorization: Bearer <token>
```

#### Customer Statistics
```http
GET /api/stats/customers
Authorization: Bearer <token>
```

#### Order Patterns
```http
GET /api/stats/patterns
Authorization: Bearer <token>
```

## 🔐 Authentication

API sử dụng JWT (JSON Web Token) để xác thực. Sau khi đăng nhập thành công, bạn sẽ nhận được một token. Sử dụng token này trong header của các request tiếp theo:

```http
Authorization: Bearer <your_token_here>
```

## 👥 User Roles

- **customer**: Khách hàng - Có thể đặt hàng và xem đơn hàng của mình
- **staff**: Nhân viên - Có thể quản lý đơn hàng, sản phẩm, xem thống kê
- **admin**: Quản trị viên - Có toàn quyền truy cập

## 📊 Database Schema

### User
- username (unique)
- email (unique)
- password (hashed)
- role (customer/staff/admin)
- firstName, lastName
- phone
- address (object)

### Product
- name
- description
- price
- category
- image
- available (boolean)
- stock

### Order
- user (ref to User)
- items (array of products)
- total
- status (pending/confirmed/preparing/ready/completed/cancelled)
- orderType (dine-in/takeaway/delivery)
- table (ref to Table)
- paymentMethod (cash/card/online)
- paymentStatus (pending/paid/refunded)

### Promotion
- title
- description
- discountType (percentage/fixed)
- discountValue
- code (unique)
- applicableProducts (array)
- minOrderValue
- maxDiscount
- startDate, endDate
- isActive
- usageLimit, usageCount

### Table
- number
- capacity
- status (available/occupied/reserved)
- currentOrder (ref to Order)

## 🛠️ Error Handling

API sử dụng HTTP status codes chuẩn:

- `200 OK` - Request thành công
- `201 Created` - Tạo resource thành công
- `400 Bad Request` - Dữ liệu không hợp lệ
- `401 Unauthorized` - Chưa xác thực hoặc token không hợp lệ
- `403 Forbidden` - Không có quyền truy cập
- `404 Not Found` - Resource không tồn tại
- `500 Internal Server Error` - Lỗi server

Error Response Format:
```json
{
  "error": "Error message here"
}
```

Success Response Format:
```json
{
  "success": true,
  "data": {...}
}
```

## 🧪 Testing

Bạn có thể test API bằng:

1. **Postman**: Import collection từ file `postman_collection.json`
2. **cURL**: Sử dụng các lệnh cURL trong documentation
3. **Frontend**: Kết nối với frontend đã được cấu hình

## 📝 Development Notes

- Tất cả passwords được hash bằng bcryptjs trước khi lưu database
- JWT tokens có thời hạn 7 ngày (có thể cấu hình trong .env)
- CORS được cấu hình cho phép truy cập từ frontend
- Database connection được tự động retry khi mất kết nối

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/coffee-system |
| JWT_SECRET | Secret key for JWT | (required) |
| JWT_EXPIRE | JWT expiration time | 7d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5500 |

## 📦 Project Structure

```
backend/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── orderController.js    # Order management
│   ├── productController.js  # Product management
│   ├── promotionController.js# Promotion management
│   ├── statsController.js    # Statistics & analytics
│   └── userController.js     # User management
├── middleware/
│   └── auth.js               # Authentication middleware
├── models/
│   ├── Order.js              # Order schema
│   ├── Product.js            # Product schema
│   ├── Promotion.js          # Promotion schema
│   ├── Table.js              # Table schema
│   └── User.js               # User schema
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   ├── orderRoutes.js        # Order endpoints
│   ├── productRoutes.js      # Product endpoints
│   ├── promotionRoutes.js    # Promotion endpoints
│   ├── statsRoutes.js        # Statistics endpoints
│   ├── tableRoutes.js        # Table endpoints
│   └── userRoutes.js         # User endpoints
└── server.js                 # App entry point
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

ISC License

## 👨‍💻 Author

Coffee System Team
