# Saigon Speed - Car Marketplace with Blockchain Escrow

> IE213.Q21 - Kỹ thuật phát triển hệ thống Web | Nhóm 6

Saigon Speed là website mua bán xe kết hợp React, Express, MongoDB và Ethereum Sepolia. Hệ thống xử lý dữ liệu sản phẩm, giỏ hàng, tài khoản và đơn hàng off-chain; các bước đặt cọc/thanh toán được ghi nhận on-chain bằng smart contract escrow và MetaMask.

## Nội dung

- [Thành Viên & Phân Công](#thành-viên--phân-công)
- [Công nghệ](#công-nghệ)
- [Kiến trúc](#kiến-trúc)
- [Chức năng chính](#chức-năng-chính)
- [Checkout và blockchain](#checkout-và-blockchain)
- [Cài đặt](#cài-đặt)
- [Biến môi trường](#biến-môi-trường)
- [Deploy và verify smart contract](#deploy-và-verify-smart-contract)
- [Tài liệu API](#tài-liệu-api)
- [Lưu ý khi test Metamask](#lưu-ý-khi-test-metamask)

## Thành Viên & Phân Công

| MSSV | Họ và Tên | Công việc phụ trách |
|---|---|---|
| 23520101 | **Huỳnh Khánh Bảo** | API giỏ hàng, viết document cho các API, hỗ trợ frontend tích hợp với backend, làm slide, thuyết trình |
| 23521390 | **Nguyễn Minh Tâm** | Khởi tạo dự án backend, viết Smart Contract deploy lên Sepolia Testnet, API xác thực & tài khoản, tích hợp blockchain vào API đơn hàng, giao diện trang contact/profile/quản lý admin, viết báo cáo |
| 23520195 | **Dương Chí Cường** | Khởi tạo dự án frontend, cấu hình điều hướng & kiến trúc, README, giao diện Trang chủ/Header/Footer, trang thanh toán & giỏ hàng, kết nối MetaMask, các file service, Dashboard & quản lý admin |
| 23521456 | **Nguyễn Văn Thanh** | Khởi tạo dự án backend, API Dashboard/Product/Review/Contact, hỗ trợ tích hợp blockchain, viết báo cáo, giao diện trang About/Wishlist/Quên mật khẩu, responsive |
| 23520870 | **Huỳnh Tiến Lợi** | Giao diện trang danh sách xe, trang xe chi tiết kèm review, trang đăng nhập & đăng ký, kiểm thử trang web |

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19 + Vite + React Router |
| Backend | Node.js + Express 5 |
| Database | MongoDB + Mongoose |
| Blockchain | Ethereum Sepolia Testnet |
| Smart contract | Solidity + Hardhat |
| Wallet | MetaMask |
| Web3 client | ethers.js v6 |

## Kiến trúc

```text
React Frontend
  - Cars and Reviews
  - Cart / Checkout / My Orders
  - Profile + Wallet Management
  - Admin product, order, contact, dashboard

Express Backend
  - Auth, Account, Product, Review, Cart, Order, Wallet APIs
  - Tạo order on-chain bằng seller/server wallet
  - Verify transaction receipt và event log
  - Đồng bộ trạng thái order vao MongoDB

VehicleMarketplaceEscrow
  - Lưu orderId, buyer, seller, total/deposit amount
  - Nhấn payDeposit/payFull từ buyer
  - Cho seller confirm, buyer complete, cancel/refund
```

Blockchain không thay thế database. MongoDB vẫn là nơi lưu chi tiết user, product, cart, delivery info và order detail; smart contract chỉ lưu những dữ liệu cần minh bạch và đối chiếu giao dịch.

## Chức năng chính

- Xác thực user/admin bằng JWT, OTP email, forgot/reset password.
- Quản lý sản phẩm xe, hình ảnh, thông số, review va wishlist.
- Giỏ hàng và checkout theo từng xe đã chọn.
- Profile gồm edit profile, change password và wallet management.
- Mỗi tài khoản có thể lưu nhiều ví MetaMask.
- Wallet management cho phép connect, set default, delete.
- Checkout chỉ dùng MetaMask escrow.
- User có thể chọn ví đã lưu để thanh toán.
- Admin quản lý order, confirm/cancel order bằng seller/server wallet.

## Checkout và blockchain

Checkout hiện tại gồm 4 bước:

1. `Vehicle`: chọn xe trong giỏ hàng, sửa quantity hoặc xóa xe.
2. `Handover`: chọn showroom pickup hoặc home delivery.
3. `Deposit`: điền contact, chọn payment plan và chọn MetaMask wallet.
4. `Done`: hiển thị confirmation và transaction hash.

Payment plan:

| Plan | Mô tả |
| --- | --- |
| `deposit` | Thanh toán tiền cọc trước. Số còn lại chỉ thanh toán sau khi nhận xe. |
| `full` | Thanh toán toàn bộ giá trị đơn trên smart contract. |

Tỷ giá giả lập đang dùng:

```text
USD_PER_ETH=2000000
deposit rate = 0.5% tổng giá xe
```

Ví dụ xe `$13,000`:

```text
Full amount = 0.0065 ETH
Deposit = 0.0000325 ETH ($65)
Remaining = 0.0064675 ETH ($12,935)
```

## Cài đặt

### 1. Clone repo

```bash
git clone https://github.com/cogramer/Ky-thuat-phat-trien-he-thong-Web-IE213.Q21-Nhom-6.git
cd Ky-thuat-phat-trien-he-thong-Web-IE213.Q21-Nhom-6
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:3000
```

### 3. Frontend

```bash
cd frontend/car-sales-web
npm install
npm run dev
```

Vite mặc định chạy tại:

```text
http://localhost:5173
```

### 4. Blockchain tests

```bash
cd blockchain
npm install
npm test
```

## Biến môi trường

### Backend `.env`

Tạo file từ template:

```bash
cd backend
cp .env.example .env
```

```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

SEPOLIA_RPC_URL=your_sepolia_rpc_url
SEPOLIA_PRIVATE_KEY=private_key_of_seller_server_wallet
CONTRACT_ADDRESS=0xD0CF607f0bCD60B5ed02896e682450eA4dBf5BB0
SELLER_WALLET=0x3aB431DC9782DA26bBdB002e94Fa057A13D2049F
USD_PER_ETH=2000000
```

### Frontend `frontend/car-sales-web/.env`

Tao file từ template:

```bash
cd frontend/car-sales-web
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3000
VITE_CONTRACT_ADDRESS=0xD0CF607f0bCD60B5ed02896e682450eA4dBf5BB0
VITE_USD_PER_ETH=2000000
```

Quan trọng: `CONTRACT_ADDRESS` của backend va `VITE_CONTRACT_ADDRESS` của frontend phải giống nhau. Sau khi đổi env, restart cả backend và frontend.

### Blockchain `.env`

Tạo file từ template nếu cần compile/deploy/verify contract:

```bash
cd blockchain
cp .env.example .env
```

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<your-infura-project-id>
SEPOLIA_PRIVATE_KEY=replace_with_deployer_or_seller_private_key_without_0x
ETHERSCAN_API_KEY=replace_with_etherscan_api_key
CONTRACT_ADDRESS=0xD0CF607f0bCD60B5ed02896e682450eA4dBf5BB0
```

`SEPOLIA_PRIVATE_KEY` là private key của ví deployer/seller, không có tiền tố `0x`. Ví này nên trùng với `SELLER_WALLET` trong backend để admin có thể tạo, xác nhận và hủy order on-chain.

## Deploy và verify smart contract

Smart contract chính nằm tại `blockchain/contracts/VehicleMarketplaceEscrow.sol`. Phần blockchain dùng Hardhat 3, Solidity `0.8.28`, network Sepolia và plugin `@nomicfoundation/hardhat-verify`.

### 1. Cài đặt package

```bash
cd blockchain
npm install
```

### 2. Cấu hình `.env`

Tạo file môi trường từ template:

```bash
cp .env.example .env
```

Cập nhật các giá trị sau:

```env
SEPOLIA_RPC_URL=your_sepolia_rpc_url
SEPOLIA_PRIVATE_KEY=private_key_of_deployer_or_seller_wallet_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

Lưu ý bảo mật: không commit private key, RPC project ID hoặc Etherscan API key lên repository.

### 3. Compile contract

```bash
npx hardhat compile
```

Lệnh này kiểm tra Solidity source và sinh artifact/ABI trong thư mục `blockchain/artifacts`.

### 4. Deploy lên Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Sau khi deploy thành công, terminal sẽ in ra địa chỉ contract:

```text
Contract deployed to: 0xYourContractAddress
```

Cập nhật địa chỉ mới vào các file môi trường:

```env
# backend/.env
CONTRACT_ADDRESS=0xYourContractAddress

# frontend/car-sales-web/.env
VITE_CONTRACT_ADDRESS=0xYourContractAddress

# blockchain/.env
CONTRACT_ADDRESS=0xYourContractAddress
```

Ví dụ contract Sepolia đang được cấu hình trong project:

```text
0xD0CF607f0bCD60B5ed02896e682450eA4dBf5BB0
```

### 5. Verify contract trên Etherscan

Contract hiện tại không có constructor parameter, vì vậy có thể verify trực tiếp bằng địa chỉ đã deploy:

```bash
npx hardhat verify --network sepolia 0xYourContractAddress
```

Nếu verify thành công, Etherscan sẽ hiển thị source code, compiler version và ABI của contract. Điều này giúp người dùng đối chiếu địa chỉ contract frontend/backend đang gọi với source code đã công khai.

### 6. Checklist sau khi deploy

- Kiểm tra `CONTRACT_ADDRESS` ở backend và `VITE_CONTRACT_ADDRESS` ở frontend có cùng một địa chỉ.
- Restart backend và frontend sau khi đổi biến môi trường.
- Chạy `npm test` trong thư mục `backend` để kiểm tra service tích hợp blockchain.
- Chạy `npm test` trong thư mục `blockchain` để kiểm tra logic smart contract.
- Test luồng checkout bằng ví buyer trên Sepolia, không dùng ví seller làm buyer.

## Tài liệu API

Tài liệu route nằm trong thư mục `docs/`:

- `docs/AuthAPI.md`
- `docs/AccountAPI.md`
- `docs/WalletAPI.md`
- `docs/CartAPI.md`
- `docs/OrderAPI.md`
- `docs/AdminOrderAPI.md`
- `docs/ProductAPI.md`
- `docs/ReviewAPI.md`
- `docs/ContactAPI.md`
- `docs/DashboardAPI.md`

## Lưu ý khi test Metamask

- Chọn đúng network `Sepolia`.
- Ví buyer phải có Sepolia ETH để trả tiền và gas.
- Không dùng `SELLER_WALLET` làm buyer wallet khi test checkout.
- Wallet được chọn trong checkout phải là account đang active trong MetaMask.
- Nếu Metamask không hiện popup, giao dịch thường đã bị reject ở bước `estimateGas`. Kiểm tra:
  - frontend/backend có cùng contract address không;
  - wallet đang active có phải buyer của order không;
  - payment plan va amount có khớp order on-chain không;
  - order trên contract còn status `Pending` không.

## License

Dự án phục vụ mục đích học tập cho môn IE213.Q21.
