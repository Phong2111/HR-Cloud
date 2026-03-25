# Giải mã Hệ thống HR Cloud (Phương pháp Feynman)

Tài liệu này được thiết kế theo **Phương pháp Feynman** (giải thích mọi thứ một cách đơn giản, dễ hiểu nhất, giống như đang kể một câu chuyện) để giúp bạn nắm vững toàn bộ kiến trúc, luồng chạy code và các điểm "ăn tiền" của dự án **HR Cloud**. Mục tiêu là giúp bạn hoàn toàn tự tin khi đối thoại và bảo vệ đồ án với giảng viên.

---

## 1. Bức tranh toàn cảnh: Hệ thống này là gì?

Hãy tưởng tượng **HR Cloud** là một **Tòa nhà văn phòng hiện đại** thay vì là một mớ code phức tạp. 
Thay vì dồn tất cả phòng ban vào một căn phòng khổng lồ lộn xộn (Kiến trúc Monolithic - Nguyên khối), tòa nhà này chia thành các **phòng ban chuyên trách** hoạt động độc lập (Kiến trúc Microservices).

- **Cửa ra vào (Frontend - React.js)**: Nơi nhân viên tương tác, giao tiếp với hệ thống. Mọi yêu cầu đều bắt đầu từ đây.
- **Phòng Bảo vệ (Identity Service - Port 8081)**: Chuyên lo việc kiểm tra giấy tờ, cấp "Thẻ ra vào" (JWT Token).
- **Phòng Hành chính Nhân sự (Organization Service - Port 8082)**: Quản lý danh sách nhân viên và biết ai là sếp của ai (Sơ đồ tổ chức).
- **Phòng Xử lý Nghỉ phép (Leave Service - Port 8083)**: Nhận đơn xin nghỉ phép, kiểm tra số ngày phép còn lại và duyệt đơn.
- **Phòng Tuyển dụng (Recruitment Service - Port 8084)**: Quản lý hàng ngàn hồ sơ ứng viên đa dạng, cần tìm kiếm sàng lọc rất nhanh.

**Điểm đặc biệt (Polyglot Persistence):** 
Không phải phòng ban nào cũng dùng chung một loại tủ đựng hồ sơ!
- Các phòng ban cần sự *chính xác tuyệt đối và có quan hệ phức tạp* (Nhân sự, Nghỉ phép) dùng **Tủ sắt có khóa chắn chắn (SQL Server)**.
- Riêng phòng Tuyển dụng cần chứa CV ứng viên với đủ thể loại kỹ năng, cấu trúc linh hoạt, họ dùng **Tủ hồ sơ mở dễ tìm kiếm (MongoDB)**.

---

## 2. Cách các "Phòng ban" (Code) vận hành chi tiết

Bây giờ ta sẽ đi sâu vào từng phòng ban, xem code của họ hoạt động ra sao và cần nhớ điều gì để nói với giảng viên.

### A. Hạ tầng tòa nhà (Docker & Docker Compose & SQL Init)
- **Cách hoạt động:** Khi gõ `docker-compose up`, hệ thống giống như được "thắp sáng". Nó bật database SQL Server, MongoDB lên trước. Sau đó, nó chạy một kịch bản (`init.sql`) để tự động xây sẵn các bảng dữ liệu cơ bản (Staff, LeaveRecords, Users) và tạo sẵn tài khoản Admin. Cuối cùng, nó khởi động 4 services backend và frontend.
- **💡 Điểm cần nhớ khoe với giảng viên:** 
  - Đã đóng gói (Containerize) toàn bộ hệ thống bằng Docker. Giảng viên chỉ cần gõ 1 lệnh là chạy được cả Frontend, Backend, Database mà không cần cài đặt môi trường rườm rà.
  - Sử dụng `healthcheck` và `depends_on` trong `docker-compose.yml` để đảm bảo Database chạy xong và kết nối được thì Backend mới được phép khởi động.

### B. Phòng Bảo vệ (Identity Service - Auth JWT)
- **Cách hoạt động:** Khi người dùng nhập user/pass ở Frontend, Frontend gửi đến cổng `8081` (`/api/auth/login`). Service này chọc vào SQL Server bảng `users` để kiểm tra mật khẩu (đã được băm an toàn bằng BCrypt). Nếu đúng, nó tạo ra một **chuỗi mã hóa (JWT Token)** giống như một cái thẻ từ có hạn sử dụng, và trả về cho Frontend.
- **💡 Điểm cần nhớ:**
  - Token này quy định rõ "người này là ai" và "quyền gì" (Role).
  - Các service khác (8082, 8083, 8084) khi nhận được request từ Frontend sẽ tự giải mã cái Token này ra để xem có hợp lệ không (Stateless Auth) mà không cần phải gọi lại hàm kiểm tra liên tục.

### C. Phòng Hành chính (Organization Service - Recursive CTE)
- **Cách hoạt động:** Khi cần xem danh sách nhân viên, nó gọi `/api/staff` (CRUD thông thường). Nhưng điểm ăn tiền nhất là api `/api/org-chart` tạo ra Sơ đồ tổ chức (ai quản lý ai).
- **💡 Điểm cần nhớ (Rất quan trọng):**
  - **Kiến thức ghi điểm:** Thay vì dùng vòng lặp (For/While) trong Java để tìm từng ông sếp rồi tìm nhân viên cấp dưới (gây cực kỳ chậm và quá tải Database - lỗi N+1 query), Service này dùng **Recursive CTE (Common Table Expression đệ quy) trong SQL Server**. 
  - Nó chỉ gửi 1 câu lệnh SQL duy nhất xuống DB, SQL Server sẽ tự đệ quy tìm ra ngọn ngành cây tổ chức và trả về kết quả. Cách này tối ưu hiệu năng (Performance) tuyệt đối cho xử lý cây phân cấp (Hierarchical data).

### D. Phòng Nghỉ phép (Leave Service - Stored Procedure & ACID)
- **Cách hoạt động:** Quản lý quy trình trừ ngày nghỉ của nhân viên. Khi nhân viên xin phép, gọi API `/api/leave/request`.
- **💡 Điểm cần nhớ (Rất quan trọng):**
  - Bắt buộc phải nhắc đến khái niệm **ACID Transactions** và **Race Condition** (Điều kiện cạnh tranh).
  - Giả sử nhân viên chỉ còn 1 ngày phép, nhưng họ dùng 2 điện thoại bấm xin phép cùng 1 mili-giây. Dẫn đến số ngày phép có thể bị âm (-1) nếu code không tốt.
  - **Cách giải quyết:** Service này không viết logic trừ phép ở Java, mà nó gọi hẳn một **Stored Procedure (SP) `ApproveLeave`** nằm dưới SQL Server. SP sẽ đảm bảo việc *[1. Kiểm tra số phép]* -> *[2. Trừ phép]* -> *[3. Ghi vào lịch sử LeaveRecords]* diễn ra **nguyên tử (Atomically)**. Cả 3 bước thành công hoặc cùng thất bại. Database sẽ tự động lock dòng dữ liệu đó lại trong tích tắc để ngăn chặn lỗi song song (Concurrency).

### E. Phòng Tuyển dụng (Recruitment Service - MongoDB Aggregation)
- **Cách hoạt động:** Lưu hồ sơ tuyển dụng ứng viên (`/api/candidates`).
- **💡 Điểm cần nhớ:**
  - Tại sao dùng MongoDB? Vì hồ sơ ứng viên (CV) là dạng dữ liệu phi cấu trúc (Unstructured/Schema-less). Người thì có 3 kỹ năng, người thì có 10 chứng chỉ. Nếu dùng SQL sẽ phải tạo rất nhiều bảng (bảng skills, bảng work_experience) và join lại rất chậm. MongoDB cấu trúc JSON lưu trọn vẹn 1 CV vào 1 Document.
  - Khi người dùng tìm kiếm xem "Ai biết Java VÀ React VÀ có  > 3 năm kinh nghiệm", service dùng **Aggregation Pipeline** của MongoDB để lọc qua hàng ngàn hồ sơ cực kỳ nhanh chóng.

### F. Giao diện (Frontend - React)
- **Cách hoạt động:** Nó là mặt tiền. React quản lý các View, dùng `react-router-dom` để chuyển trang mà không cần load lại web (Single Page Application). Dùng `Axios` để nhét cái Token (Thẻ ra vào) vào `Header` của mỗi request HTTP gửi đến Backend.
- Kỹ thuật **Reverse Proxy** với NGINX (nếu chạy prod) giúp gom 4 cái cổng backend 8081, 8082, 8083, 8084 về đằng sau, Frontend chỉ cần trỏ về 1 chỗ duy nhất.

---

## 3. Chiến lược đối thoại với Giảng viên (Hỏi & Đáp dự kiến)

Đây là những câu giảng viên *rất hay hỏi* để xem bạn có tự code & hiểu sâu hệ thống hay không.

**CÂU HỎI 1: Tại sao em lại phức tạp hóa bằng Microservices thay vì làm 1 cục Monolithic cho dễ?**
* **Trả lời:** Thưa thày/cô, Monolithic dễ lúc đầu nhưng khó mở rộng (Scale). Trong hệ thống HR, vào ngày tính lương hoặc ngày lễ, lượng người xin phép (Leave) vào rất đông, trong khi tuyển dụng (Recruitment) thì vắng. Với Microservices, em chỉ cần chạy thêm 5 container của `Leave Service` để gánh tải (Scale theo chiều ngang), tài nguyên không bị lãng phí cho các service không dùng đến. Ngoài ra, nó cho phép áp dụng Polyglot Persistence như em đang làm (dùng cả SQL và MongoDB).

**CÂU HỎI 2: Ai đó sửa Token JWT của em thì sao?**
* **Trả lời:** JWT gồm 3 phần (Header, Payload, Signature). Phần Signature được ký bằng một Secret Key (chữ ký gốc độ dài 256bit) chỉ có Backend biết. Nếu một hacker cố tình sửa nội dung phần Payload (từ ROLE_USER thành ROLE_ADMIN), thì chữ ký sẽ bị sai lệch. Backend khi nhận được sẽ dùng Secret Key tính toán lại, thấy không khớp là từ chối ngay lập tức (throw Exception).

**CÂU HỎI 3: Tại sao làm tính năng sơ đồ tổ chức (Org Chart) lại dùng Recursive CTE ở SQL Server mà không lấy hết data lên Java rồi dùng đệ quy?**
* **Trả lời:** Em quan tâm đến bài toán hiệu năng. Vấn đề "N+1 Query" hoặc "Memory Leak". Nếu lấy hết data lên Java, với công ty 10,000 nhân viên, bộ nhớ RAM của server backend sẽ bị tràn ngập. Giải quyết ở tầng SQL Server bằng Recursive CTE bắt Database server dùng thuật toán xử lý dữ liệu ngay tại chỗ và chỉ trả về payload cuối cùng, tối ưu được băng thông mạng và RAM cho backend.

**CÂU HỎI 4: Stored Procedure trong Leave Service giải quyết vấn đề gì? Tại sao không dùng @Transactional trong Spring Boot?**
* **Trả lời:** @Transactional của Spring Boot giải quyết được ACID ở mức độ ứng dụng, nhưng khi chạy Microservices gồm nhiều Server Node chạy song song (ví dụ 3 instance Leave Service), @Transactional ở app A không lock được app B, dẫn đến lỗi "Race Condition" ghi đè dữ liệu nếu 2 request đến cùng mili giây. C đẩy logic tính toán trừ phép xuống Database bằng SP đảm bảo DB tự động nắm quyền Lock dòng vật lý đó ở mức độ Database.

**CÂU HỎI 5: Lý do chính xác em chọn MongoDB cho Recruitment là gì?**
* **Trả lời:** Flexibility (Sự linh hoạt) và Read/Search Performance. Một profile ứng viên chứa mảng skills, mảng experiences lồng nhau. Document-oriented DB của MongoDB map 1-1 với cấu trúc JSON của Frontend, không tốn thời gian mapping. Đồng thời, API tìm kiếm dùng Aggregation Pipeline match các element trong mảng array (như skills) hoạt động cực kì hiệu quả so với thao tác `JOIN` các bảng N-N trên SQL.

---

## 4. Lời khuyên chốt lại trước khi "ra trận"
1. **Mở sẵn Code:** Lúc demo, hãy mở sẵn file `docker-compose.yml`, `init.sql`, class có chứa `Recursive CTE` và class có `Aggregation Pipeline` của MongoDB. Đó là những minh chứng sắc bén nhất.
2. **Luôn bắt đầu từ Vấn đề (Problem):** Đừng chỉ nói "Em code hàm này". Hãy nói "Để giải quyết vấn đề dữ liệu phình to/lỗi đồng bộ, em dùng công nghệ này...". Tư duy kỹ sư phần mềm (Software Engineering) mới là thứ giảng viên đánh giá cao nhất.

Chúc bạn có một buổi bảo vệ đồ án xuất sắc! Hệ thống của bạn rất ấn tượng và mang dáng dấp của một hệ thống Enterprise thực thụ.
