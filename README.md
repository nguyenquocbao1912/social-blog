# 🚀 Blog Backend (Next.js Fullstack Platform)

Dự án này là một nền tảng Mạng xã hội / Blog thu nhỏ được xây dựng toàn diện từ Frontend tới Backend bằng hệ sinh thái **Next.js**. Mục tiêu của dự án là mang lại trải nghiệm người dùng (UX) mượt mà, giao diện (UI) hiện đại, cùng với một hệ thống Backend có bảo mật.

---

## 🎨 Frontend (UI / UX Optimization)

Giao diện được thiết kế theo phong cách cổ điển nhưng vẫn đảm bảo hiệu năng.
- **Kỹ thuật xây dựng:** Sử dụng **React (Next.js App Router)**. CSR (Client-Side Rendering) cho các component tương tác mạnh như Dashboard, Sidebar, Friends Panel.
- **Styling:** Hiện tại dự án chưa chuyển sang dùng Tailwind mà dùng CSS thuần(`globals.css`), biến CSS (CSS Variables) để quản lý Theme (Dark/Light mode) đồng bộ.
- **Tối ưu Fetching & Caching:** 
  - Sử dụng **SWR** (`useSWR` / `useSWRInfinite`) của Vercel để fetch dữ liệu.
  - Tự động lưu cache (cache-first), tự động lấy lại dữ liệu mới (revalidation) khi người dùng quay lại tab, giúp UI luôn được cập nhật mà không bị nháy trang.
  - Áp dụng **Optimistic UI**: Khi user Like hoặc Comment, UI được cập nhật ngay lập tức trước khi server phản hồi, mang lại cảm giác cực kỳ tốc độ.
- **Trải nghiệm Popups/Modals hoàn hảo:** 
  - Sử dụng **React Portals (`createPortal`)** để đẩy các Popup/Modals ra ngoài cùng (`document.body`). Cách này giải quyết triệt để lỗi xung đột CSS `position: fixed` khi nằm trong các thẻ có thuộc tính `transform` (ví dụ: ngăn kéo trượt trên Mobile).
- **Bảo vệ thao tác người dùng (UX Safeguards):** 
  - Custom Hook **`useActionCooldown`** để thiết lập "Global Lock" (Khóa toàn cục). Khi user thực hiện thao tác quan trọng, hệ thống tự block mọi cú click chuột trong khoảng thời gian ngắn để ngăn spam click, user thao tác quá nhanh, hạn chế bug luồng dữ liệu.
- **Hình ảnh tối ưu:** Tận dụng `<Image>` component của Next.js với thuộc tính `objectFit: contain` và dynamic width/height giúp ảnh luôn giữ đúng tỉ lệ gốc mà không bị cắt xén hay vỡ tỉ lệ, tối ưu load ảnh, tự động chuyển đổi định dạng WebP, giảm tải dung lượng mạng.

---

## ⚙️ Backend (Architecture & API)

Hệ thống API được thiết kế trên mô hình Serverless Functions của **Next.js Route Handlers**.
- **Cơ sở dữ liệu (Database):** 
  - Quản lý schema và migrations bằng **Prisma ORM**.
  - Dữ liệu lưu trữ với cấu trúc: User, Post, Comment, Friendship, Likes.
- **Quản lý phiên đăng nhập (Authentication):** 
  - Tích hợp **NextAuth.js (v4)**.
  - Quản lý phiên bằng **JWT (JSON Web Token)** được lưu trữ trong HTTP-only Cookie an toàn. Các callback được tinh chỉnh để đưa thông tin User (như Avatar, ID) xuyên suốt hệ thống.
- **Mã hóa (Encryption):** 
  - Sử dụng `bcryptjs` với độ mặn (salt rounds) = 10 để băm mật khẩu người dùng trước khi lưu trữ vào Database.
- **Quản lý File & Hình ảnh:** 
  - Tích hợp **Cloudinary API** để lưu trữ Avatar và Post Thumbnail độc lập, giảm tải băng thông máy chủ.
- **Cơ chế Xử lý ngầm (Background Tasks):** 
  - Sử dụng API `after()` (Next.js 15+) để đẩy các tác vụ nặng (như gửi lệnh xóa ảnh qua Cloudinary) ra khỏi vòng luân chuyển Response, giúp API phản hồi về cho Frontend ngay lập tức (Giảm thời gian chờ).

---

## 🛡️ Security & Validation (Bảo vệ luồng dữ liệu)

Hệ thống được bọc bởi nhiều lớp khiên bảo mật để chống lại các lỗ hổng từ phía người dùng bình thường đến người dùng cố tình tấn công.

1. **Anti-Bruteforce & Rate Limiting (Redis Upstash):**
   - Áp dụng kỹ thuật Rate Limit (Giới hạn truy cập) dựa trên IP cho tính năng Login.
   - **Cơ chế khóa tài khoản tự động:** Khi một Email bị nhập sai mật khẩu quá 5 lần, Redis sẽ khóa (Lockout) tài khoản đó trong 30 phút.
2. **Strict Schema Validation (Zod):**
   - **Kiểm tra data input!** Toàn bộ dữ liệu gửi tới API (POST, PUT) đều bị kiểm duyệt qua thư viện **Zod** (`lib/validations.ts`).
   - Khoảng trắng (`.trim()`) để chống dữ liệu rác (user nhập toàn dấu cách).
   - Kiểm tra Regex (Chính quy): Yêu cầu Password mới luôn phải tuân thủ chuẩn an toàn (Tối thiểu 8 ký tự, 1 hoa, 1 thường, 1 số). Ngăn chặn cURL hoặc Postman bắn dữ liệu rỗng trực tiếp vào CSDL.
3. **Phân quyền Route (Authorization):**
   - Backend luôn tái xác thực JWT thông qua `getServerSession`.
   - Các API nhạy cảm (Sửa bài, Xóa bài) đều kiểm tra đối chiếu `post.userId === session.user.id` trước khi thực thi lệnh SQL. Không ai có thể xóa hoặc chỉnh sửa dữ liệu của người khác dù biết ID bài viết.
4. **Cookie Security:** 
   - Cookie phiên làm việc luôn được đánh dấu `HttpOnly`, `SameSite=Lax`, và `Secure` trên môi trường Production để ngăn chặn hoàn toàn tấn công XSS (Đánh cắp Cookie qua Javascript) và hạn chế CSRF.
