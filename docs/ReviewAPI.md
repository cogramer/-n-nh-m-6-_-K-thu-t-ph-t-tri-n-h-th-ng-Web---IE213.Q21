## Review API

**Base URL:** `/api/reviews`
**Xác thực:** Các route có 🔒 yêu cầu header `Authorization: Bearer <token>`

---

### Tạo hoặc cập nhật đánh giá

#### POST `/create` 🔒
Tạo đánh giá cho một sản phẩm đã mua hoặc cập nhật đánh giá hiện có của chính user.

Điều kiện:
- User phải đăng nhập.
- User phải có đơn hàng `completed` chứa sản phẩm cần đánh giá.
- Nếu gửi kèm `orderId`, đơn hàng đó phải thuộc về user, đã hoàn tất và có sản phẩm tương ứng.
- Mỗi user có một đánh giá chính cho mỗi sản phẩm. Gửi lại endpoint này sẽ cập nhật nội dung và số sao của đánh giá đó.

**Request Body:**
```json
{
  "productId": "string",
  "orderId": "string",
  "rating": "number",
  "comment": "string"
}
```

`orderId` là tùy chọn. Nên gửi `orderId` khi đánh giá từ trang chi tiết đơn hàng để backend xác thực đúng đơn mua.

**Response:**
```json
{ ...thông tin đánh giá vừa tạo hoặc vừa cập nhật }
```

---

### Lấy đánh giá của user hiện tại

#### GET `/my/:productId` 🔒
Lấy đánh giá hiện tại của user đang đăng nhập cho một sản phẩm.

**URL Param:** `productId` — MongoDB `_id` của sản phẩm

Không cần body.

**Response:**
```json
{ ...thông tin đánh giá của user }
```

Nếu user chưa từng đánh giá sản phẩm này, API trả về `null`.

---

### Lấy đánh giá theo sản phẩm

#### GET `/product/:productId`
Lấy tất cả đánh giá đã được xác thực mua hàng của một sản phẩm. Không cần đăng nhập.

**URL Param:** `productId` — MongoDB `_id` của sản phẩm

Không cần body.

**Response:**
```json
[ ...danh sách đánh giá ]
```

---

> 🔒 = yêu cầu `Authorization: Bearer <token>`
