# 🌐 Central Gateway

<div align="center">

[![CI Pipeline](https://github.com/thanhba0505/central-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/thanhba0505/central-gateway/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/thanhba0505/central-gateway?color=0284c7&label=Release)](https://github.com/thanhba0505/central-gateway/releases)
[![Client Control Plane](https://img.shields.io/badge/Client-Live%20on%20Render-10b981?logo=render)](https://central-gateway-client.onrender.com)
[![Server API](https://img.shields.io/badge/Server-API%20v1-0284c7?logo=nestjs)](https://central-gateway-server.onrender.com/api/v1)
[![Swagger OpenAPI](https://img.shields.io/badge/Docs-Swagger%20OpenAPI-85ea2d?logo=swagger)](https://central-gateway-server.onrender.com/api/docs)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Cổng thông báo tập trung và trung tâm điều khiển hạ tầng đám mây cho hệ sinh thái Wonderlab & Microservices.**

[Control Plane](https://central-gateway-client.onrender.com) • [API Swagger](https://central-gateway-server.onrender.com/api/docs) • [Kiến trúc chi tiết](docs/architecture.md)

</div>

---

## 📌 Giới thiệu dự án

**Central Gateway** là nền tảng quản lý và điều phối thông báo tập trung. Dự án giúp tách biệt hoàn toàn các ứng dụng vệ tinh (như [Wonderlab](https://github.com/thanhba0505/Wonderlab), GitHub Actions CI/CD, Cron Workers) khỏi thông tin bảo mật và SDK của các nhà cung cấp bên thứ ba (Slack, Discord, Telegram).

### Tính năng cốt lõi:
- **Định tuyến thông minh**: Tự động chuyển thông báo đến đúng kênh Slack dựa theo dự án (`project`) và loại sự kiện (`ci`, `deploy`, `git`, `feedback`, `comment`).
- **Giao diện điều khiển (Control Plane)**: Trực quan hóa tỷ lệ gửi thành công, tra cứu nhật ký phân phối (Audit Logs) và giả lập bắn thông báo qua Sandbox.
- **Chuẩn hóa thông điệp**: Thiết kế thẻ thông báo trực quan, đồng bộ và chuyên nghiệp theo chuẩn Slack Block Kit.

---

## 🏗️ Cấu trúc các Service con

Dự án được tổ chức theo mô hình **pnpm Monorepo**:

```
central-gateway/
├── client/          # Frontend Web Control Plane (Next.js 15, React 19, Tailwind CSS)
├── server/          # Backend Ingestion & Routing Engine (NestJS 10, Prisma, Slack API)
├── docs/            # Tài liệu kiến trúc và hướng dẫn tích hợp
└── scripts/         # Scripts đồng bộ phiên bản và kiểm thử tự động
```

| Service | Công nghệ | Cổng mặc định | Vai trò |
| :--- | :--- | :---: | :--- |
| **`client`** | Next.js 15 App Router | `5000` | Bảng điều khiển quản trị, quản lý kênh, tra cứu audit log và sandbox thử nghiệm |
| **`server`** | NestJS 10 + Prisma ORM | `5001` | REST API nhận sự kiện, xác thực Bearer token, kết nối Neon Postgres và gửi tin nhắn Slack |

---

## 🚀 Hướng dẫn khởi động

### Yêu cầu môi trường:
- **Node.js**: `v24.x` (xem `.nvmrc`)
- **Package Manager**: `pnpm` `12.11.2` (`npm i -g pnpm@12.11.2`)
- **Cơ sở dữ liệu**: PostgreSQL 16 (chạy local port `5434` hoặc kết nối Neon cloud)

### 1. Cài đặt dependencies
```bash
git clone https://github.com/thanhba0505/central-gateway.git
cd central-gateway
pnpm install
```

### 2. Thiết lập cơ sở dữ liệu
```bash
cd server
pnpm db:generate
pnpm db:migrate
pnpm db:seed
cd ..
```

### 3. Khởi động môi trường phát triển
```bash
# Khởi động đồng thời cả Client và Server:
pnpm dev

# Hoặc khởi động riêng từng service:
pnpm dev:server    # Server API chạy tại http://localhost:5001
pnpm dev:client    # Client Web chạy tại http://localhost:5000
```

### 4. Kiểm thử & Kiểm tra mã nguồn
```bash
pnpm test          # Chạy unit tests
pnpm lint          # Kiểm tra chuẩn linter
pnpm format:check  # Kiểm tra chuẩn định dạng Prettier
```

---

## 📄 Bản quyền

Dự án được phát hành theo giấy phép mã nguồn mở [MIT License](LICENSE).  
Bản quyền (c) 2026 Bá Lê Thanh.
