# HR Cloud Platform – Walkthrough

## ✅ Hoàn thành

Dự án HR Cloud Platform đã được xây dựng hoàn chỉnh tại `d:\1_HR Cloud\HR-Cloud\source\`

---

## Cấu trúc dự án

```
source/
├── docker-compose.yml           # Orchestrates all 6 services
├── init-scripts/init.sql        # SQL Server init (Staff, LeaveRecords, ApproveLeave SP)
├── README.md
├── backend/
│   ├── pom.xml                  # Parent Maven POM (Java 17, Spring Boot 3.2)
│   ├── identity-service/        # 🔐 Port 8081 – JWT Auth (SQL Server)
│   ├── organization-service/    # 🏢 Port 8082 – Org Chart Recursive CTE (SQL Server)
│   ├── leave-service/           # 📅 Port 8083 – Leave Stored Procedure (SQL Server)
│   └── recruitment-service/     # 🎯 Port 8084 – Candidate Aggregation (MongoDB)
└── frontend/                    # React 18 + React Router 6 + Axios (Port 80)
```

---

## Điểm nổi bật kỹ thuật

### 1. 🔐 Identity Service (Spring Security + JWT)
- [JwtUtil](file:///d:/1_HR%20Cloud/HR-Cloud/source/backend/identity-service/src/main/java/com/hrcloud/identity/security/JwtUtil.java#11-59) – generate/validate token HS256, claim `role`
- [JwtAuthFilter](file:///d:/1_HR%20Cloud/HR-Cloud/source/backend/identity-service/src/main/java/com/hrcloud/identity/security/JwtAuthFilter.java#17-50) – `OncePerRequestFilter` inject SecurityContext
- [SecurityConfig](file:///d:/1_HR%20Cloud/HR-Cloud/source/backend/identity-service/src/main/java/com/hrcloud/identity/security/SecurityConfig.java#23-78) – stateless, CORS, BCrypt password
- Endpoints: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`

### 2. 🏢 Organization Service – Recursive CTE
```sql
-- Từ HRCloud.sql, được triển khai như native query trong StaffRepository
WITH OrgChart AS (
    SELECT ID, Name, ManagerID, Salary, LeaveBalance, 0 AS Level
    FROM Staff WHERE ManagerID IS NULL
    UNION ALL
    SELECT s.ID, s.Name, s.ManagerID, s.Salary, s.LeaveBalance, o.Level + 1
    FROM Staff s JOIN OrgChart o ON s.ManagerID = o.ID
)
SELECT * FROM OrgChart ORDER BY Level, ManagerID, ID
```
- `GET /api/org-chart` → Tree JSON (đệ quy Java buildTree)
- `GET /api/org-chart/flat` → Flat list từ CTE

### 3. 📅 Leave Service – Stored Procedure ATOMIC
```java
// Gọi đúng SP ApproveLeave từ HRCloud.sql qua JPA EntityManager
entityManager.createStoredProcedureQuery("ApproveLeave")
    .registerStoredProcedureParameter("staff_id", Integer.class, ParameterMode.IN)
    .registerStoredProcedureParameter("days", Integer.class, ParameterMode.IN)
    .setParameter("staff_id", staffId)
    .setParameter("days", days)
    .execute();
```
- SP kiểm tra `LeaveBalance >= days` → deduct → insert `LeaveRecords` trong 1 transaction ATOMIC

### 4. 🎯 Recruitment Service – MongoDB Aggregation Pipeline
```java
// Aggregation Pipeline: $match → $sort → $addFields
Aggregation.match(criteria)       // skills.$all, yearsExperience.$gte, position.$regex
Aggregation.sort(DESC, "yearsExperience")
Aggregation.addFields().addField("skillCount")
    .withValue(ArrayOperators.Size.lengthOfArray("skills"))
```
- Candidate model: `skills[]`, `projects[]`, `workExperiences[]`, `certifications[]`

### 5. 🖥 Frontend (React 18)
- Dark theme premium UI với CSS variables system
- Pages: Login → Dashboard → Org Chart (tree visualization) → Leave → Recruitment
- AuthContext (JWT state) + Axios interceptor (auto Bearer header)
- Nginx SPA routing + API proxy to all microservices

---

## Cách chạy

### Với Docker Compose (khuyến nghị)
```bash
cd "d:\1_HR Cloud\HR-Cloud\source"
docker-compose up --build
```
- Frontend: http://localhost
- Identity API: http://localhost:8081
- Org API: http://localhost:8082
- Leave API: http://localhost:8083
- Recruitment API: http://localhost:8084

**Login:** `admin` / `admin123`

### Không có Docker (local development)
```bash
# 1. Khởi động SQL Server + MongoDB (Docker)
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=HRCloud@123456" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
docker run -p 27017:27017 -d mongo:7.0

# 2. Chạy init.sql
sqlcmd -S localhost -U sa -P "HRCloud@123456" -i init-scripts/init.sql

# 3. Chạy từng service
cd backend/identity-service && mvn spring-boot:run
cd backend/organization-service && mvn spring-boot:run
cd backend/leave-service && mvn spring-boot:run
cd backend/recruitment-service && mvn spring-boot:run

# 4. Frontend
cd frontend && npm install && npm start
```

---

## Dữ liệu seed (HRCloud.sql)

| ID | Tên | Manager | Lương | Phép còn |
|---|---|---|---|---|
| 1 | CEO | — | 10,000 | 30 |
| 2 | Manager A | CEO | 7,000 | 20 |
| 3 | Manager B | CEO | 7,000 | 20 |
| 4 | Employee A | Manager A | 4,000 | 15 |
| 5 | Employee B | Manager A | 4,000 | 15 |
| 6 | Employee C | Manager B | 4,000 | 15 |

---

## File chính

| File | Mô tả |
|---|---|
| [init.sql](file:///d:/1_HR%20Cloud/HR-Cloud/source/init-scripts/init.sql) | SQL Server init + seed data |
| [StaffRepository.java](file:///d:/1_HR%20Cloud/HR-Cloud/source/backend/organization-service/src/main/java/com/hrcloud/organization/repository/StaffRepository.java) | Recursive CTE native query |
| [LeaveService.java](file:///d:/1_HR%20Cloud/HR-Cloud/source/backend/leave-service/src/main/java/com/hrcloud/leave/service/LeaveService.java) | Stored Procedure ApproveLeave |
| [CandidateService.java](file:///d:/1_HR%20Cloud/HR-Cloud/source/backend/recruitment-service/src/main/java/com/hrcloud/recruitment/service/CandidateService.java) | MongoDB Aggregation Pipeline |
| [SecurityConfig.java](file:///d:/1_HR%20Cloud/HR-Cloud/source/backend/identity-service/src/main/java/com/hrcloud/identity/security/SecurityConfig.java) | JWT Spring Security |
| [docker-compose.yml](file:///d:/1_HR%20Cloud/HR-Cloud/source/docker-compose.yml) | Docker Compose toàn hệ thống |
