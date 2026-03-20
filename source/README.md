# HR Cloud Platform – README

## Giới thiệu
Nền tảng HR Cloud với kiến trúc **Microservices + Polyglot Persistence** (SQL Server + MongoDB).

## Cấu trúc dự án
```
source/
├── docker-compose.yml
├── init-scripts/init.sql        # Khởi tạo DB (Staff, LeaveRecords, ApproveLeave SP)
├── backend/
│   ├── pom.xml                  # Parent Maven POM
│   ├── identity-service/        # Cổng 8081 - JWT Auth (SQL Server)
│   ├── organization-service/    # Cổng 8082 - Nhân viên + Org Chart CTE (SQL Server)
│   ├── leave-service/           # Cổng 8083 - Nghỉ phép Stored Procedure (SQL Server)
│   └── recruitment-service/     # Cổng 8084 - Ứng viên Aggregation Pipeline (MongoDB)
└── frontend/                    # React.js UI (Cổng 80)
```

## Chạy với Docker Compose
```bash
cd source/
docker-compose up --build
```
Truy cập: http://localhost

## Chạy từng service thủ công

### 1. Khởi động cơ sở dữ liệu
```bash
# SQL Server
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=HRCloud@123456" -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest

# MongoDB
docker run -p 27017:27017 mongo:7.0
```

### 2. Chạy init SQL
```bash
sqlcmd -S localhost -U sa -P "HRCloud@123456" -i source/init-scripts/init.sql
```

### 3. Chạy backend services
```bash
cd source/backend
mvn clean install -DskipTests

# Identity Service
cd identity-service && mvn spring-boot:run

# Organization Service
cd organization-service && mvn spring-boot:run

# Leave Service
cd leave-service && mvn spring-boot:run

# Recruitment Service
cd recruitment-service && mvn spring-boot:run
```

### 4. Chạy frontend
```bash
cd source/frontend
npm install
npm start
```

## API Endpoints

| Service | Method | URL | Chức năng |
|---|---|---|---|
| Identity | POST | :8081/api/auth/login | Đăng nhập JWT |
| Identity | POST | :8081/api/auth/register | Đăng ký |
| Organization | GET | :8082/api/org-chart | Sơ đồ tổ chức (Recursive CTE) |
| Organization | GET | :8082/api/staff | Danh sách nhân viên |
| Organization | POST | :8082/api/staff | Thêm nhân viên |
| Leave | POST | :8083/api/leave/request | Gửi yêu cầu nghỉ (Stored Procedure) |
| Leave | GET | :8083/api/leave | Lịch sử nghỉ phép |
| Leave | GET | :8083/api/leave/balance/{id} | Số ngày phép còn lại |
| Recruitment | GET | :8084/api/candidates | Danh sách ứng viên |
| Recruitment | GET | :8084/api/candidates/search | Tìm kiếm (Aggregation Pipeline) |
| Recruitment | POST | :8084/api/candidates | Thêm ứng viên |

## Tài khoản mặc định
- **Username:** `admin`
- **Password:** `admin123`

## Công nghệ chính
- **Frontend:** React.js 18 + React Router 6 + Axios
- **Backend:** Java 17 + Spring Boot 3.2 + Spring Security
- **DB Quan hệ:** SQL Server 2022 (ACID, Recursive CTE, Stored Procedure)
- **DB NoSQL:** MongoDB 7 (Aggregation Pipeline, Schema-on-read)
- **Auth:** JWT (JJWT 0.11.5)
- **Hạ tầng:** Docker + Docker Compose
