# Design Brief: Dashboard UI Mobile First

## Mục tiêu

Thiết kế lại frontend dashboard theo Next.js App Router, Tailwind CSS và icon từ `lucide-react`. Giữ phong cách hiện tại của app: pixel/cute social network, màu pastel hồng - lavender - mint, border pixel, font `Press_Start_2P` cho nhãn/heading nhỏ và `VT323` cho nội dung dài.

Ưu tiên mobile-first. Sau đó mở rộng layout cho tablet và PC bằng breakpoint responsive.

## Ràng buộc kỹ thuật

- Dự án đang dùng Next.js App Router trong thư mục `app/`.
- Đọc docs trong `node_modules/next/dist/docs/` trước khi đổi cấu trúc Next.js.
- Dùng Tailwind CSS v4, `@import "tailwindcss"` đã có trong `app/globals.css`.
- Nếu component có state, `onClick`, sidebar popup, panel bạn bè hoặc logout thì component đó phải là Client Component với `"use client"`.
- Dùng icon từ `lucide-react`. Nếu chưa có package, cài:

```bash
npm install lucide-react
```

## Phong cách hiện tại cần giữ

- Theme tổng thể: pixel art, cute, social dashboard.
- Nền chính: `#fdf6ff`, panel: `#fff0fb`, viền phụ: `#ffe8f7`.
- Accent chính: hồng `#f472b6`, lavender `#a78bfa`, mint `#34d399`, red `#f87171`.
- UI có cảm giác "game/pixel": border dày 2-3px, shadow lệch 3-4px, text uppercase cho điều hướng.
- Không chuyển sang phong cách SaaS/phẳng hiện đại. UI mới phải hòa với class/style hiện có như `pixel-card`, `btn`, `post-card`, `sidebar-item`, `user-badge`.
- Thay emoji trong các control chính bằng lucide icon. Có thể giữ chữ/brand "PIXELVERSE".

## Icon lucide đề xuất

Import ví dụ:

```tsx
import {
  Menu,
  X,
  Users,
  LogOut,
  User,
  Home,
  FileText,
  Plus,
  Settings,
  Heart,
  MessageCircle,
  Send,
  Edit3,
  Trash2,
} from "lucide-react"
```

Quy ước:

- Menu mở sidebar: `Menu`
- Đóng sidebar: `X`
- Bạn bè/tin nhắn: `Users`
- Logout: `LogOut`
- Avatar fallback: `User`
- Feed: `Home`
- My posts: `FileText`
- New post: `Plus`
- Account: `Settings` hoặc `User`
- Like: `Heart`
- Comment/message: `MessageCircle`
- Send: `Send`
- Edit: `Edit3`
- Delete: `Trash2`

## Cấu trúc màn hình

### Header

Header sticky ở trên cùng, giữ chiều cao khoảng 56px.

Mobile:

- Bên trái có nút icon hamburger để mở sidebar popup.
- Logo nằm cạnh nút hamburger, vẫn hiển thị "PIXELVERSE".
- Bên phải có avatar user, nút icon bạn bè, nút logout.
- Nút bạn bè mở panel danh sách bạn bè/tin nhắn dạng popup hoặc drawer.
- Các nút icon nên có `aria-label`, hit area tối thiểu 40x40px.

Tablet:

- Vẫn có header sticky.
- Sidebar đã hiển thị cố định trong main, nên nút hamburger có thể ẩn hoặc chỉ dùng khi cần overlay phụ. Ưu tiên ẩn hamburger từ `md`.
- Có thể giữ nút bạn bè nếu chưa đủ không gian cho cột bạn bè riêng.

PC:

- Header ẩn nút icon bạn bè vì cột bạn bè hiển thị cố định bên phải.
- Header vẫn có logo, avatar user và logout.
- Nếu sidebar đã cố định, ẩn hamburger.

### Main Mobile

Mobile-first layout là một cột:

- Main content hiển thị danh sách bài post hoặc view đang chọn.
- Sidebar bên trái là popup/drawer khi mở bằng hamburger, ẩn khi tắt.
- Drawer nên trượt từ trái, có backdrop mờ nhẹ.
- Khi click backdrop hoặc nút `X`, sidebar đóng.
- Body không bị scroll ngang.
- Panel bạn bè/tin nhắn mở khi click nút `Users` ở header. Vì đang demo, dùng data ảo.

Sidebar mobile popup gồm:

- New Post
- Feed
- My Posts
- Account
- Trạng thái user online ở cuối

Bạn bè/tin nhắn mobile popup gồm:

- Tiêu đề nhỏ: "FRIENDS"
- Danh sách bạn bè demo: Alice, Bob, Charlie, Dave, Eve.
- Mỗi item có avatar chữ cái, username, trạng thái online/offline, dòng tin nhắn ảo.
- Có thể có nút nhỏ `MessageCircle` hoặc `Send`.

### Main Tablet

Từ breakpoint tablet (`md`, khoảng 768px):

- Main chia 2 cột.
- Sidebar bên trái hiển thị cố định, chiếm 30% chiều rộng.
- Nội dung chính chiếm phần còn lại 70%.
- Không hiển thị cột bạn bè cố định nếu không đủ rộng.
- Nếu vẫn cần truy cập bạn bè, giữ nút `Users` trên header để mở panel popup.

Gợi ý class:

```tsx
<div className="md:grid md:grid-cols-[30%_1fr]">
  <aside className="hidden md:block">...</aside>
  <main>...</main>
</div>
```

### Main PC

Từ breakpoint desktop (`lg` hoặc `xl`):

- Main chia 3 cột:
  - Sidebar trái.
  - Nội dung chính ở giữa.
  - Cột bạn bè bên phải.
- Header ẩn nút icon bạn bè.
- Sidebar trái rộng khoảng 220-280px hoặc 22-25%.
- Nội dung chính là vùng lớn nhất, tối ưu đọc post.
- Cột bạn bè rộng khoảng 260-320px.

Gợi ý class:

```tsx
<div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)_280px]">
  <aside>...</aside>
  <main>...</main>
  <aside className="hidden lg:block">...</aside>
</div>
```

## Hành vi UI

- Sidebar mobile và friends panel mobile dùng state:
  - `isSidebarOpen`
  - `isFriendsOpen`
- Khi mở sidebar, nếu friends panel đang mở thì đóng friends panel.
- Khi mở friends panel, nếu sidebar đang mở thì đóng sidebar.
- Sau khi chọn một mục trong sidebar mobile, tự đóng sidebar.
- Logout vẫn gọi `signOut({ callbackUrl: "/login" })`.
- Các tương tác hiện có của post, like, comment, edit, delete không được mất.

## Component gợi ý

Có thể tách nhỏ để dễ bảo trì:

- `DashboardShell`
- `DashboardHeader`
- `DashboardSidebar`
- `FriendsPanel`
- `PostCard`
- `PostEditor`
- `IconButton`

Nếu giữ trong `app/dashboard/page.tsx`, vẫn nên tạo helper component nội bộ rõ ràng. Với Next.js, phần dashboard đang cần session, state, click handlers nên file có thể tiếp tục là Client Component.

## Tailwind và CSS

Ưu tiên dùng Tailwind utilities cho layout responsive mới:

- `sticky top-0 z-50`
- `fixed inset-y-0 left-0 z-50`
- `translate-x-0`, `-translate-x-full`
- `transition-transform`
- `grid`, `md:grid-cols-[30%_1fr]`, `lg:grid-cols-[240px_minmax(0,1fr)_280px]`
- `hidden md:block`, `lg:hidden`, `hidden lg:block`

Vẫn có thể dùng CSS variables hiện tại qua arbitrary values:

```tsx
className="bg-[var(--bg2)] border-[3px] border-[var(--pink)] text-[var(--dark)]"
```

Không phá các class global hiện có nếu chưa cần. Nếu thêm class mới, đặt tên rõ theo dashboard shell:

- `.dashboard-shell`
- `.dashboard-header`
- `.mobile-drawer`
- `.friends-panel`

## Accessibility

- Button icon phải có `aria-label`.
- Drawer có nút đóng rõ ràng.
- Backdrop là button hoặc div có role phù hợp và có thể đóng bằng click.
- Trạng thái mở/đóng dùng `aria-expanded`.
- Panel bạn bè và sidebar nên có heading ẩn hoặc visible label để screen reader hiểu ngữ cảnh.
- Icon lucide chỉ trang trí thì thêm `aria-hidden="true"`.

## Nội dung demo cho bạn bè/tin nhắn

Dùng data tĩnh trong component:

```ts
const demoFriends = [
  { name: "Alice", username: "alice", status: "ONLINE", message: "Vừa đăng một bài mới." },
  { name: "Bob", username: "bob", status: "ONLINE", message: "Đang đọc feed." },
  { name: "Charlie", username: "charlie", status: "AWAY", message: "Hẹn trả lời sau." },
  { name: "Dave", username: "dave", status: "ONLINE", message: "Muốn xem bài mới của bạn." },
  { name: "Eve", username: "eve", status: "OFFLINE", message: "Tin nhắn demo." },
]
```

## Checklist hoàn thành

- Mobile có header đủ 4 nhóm: hamburger, logo, avatar, friends, logout.
- Mobile sidebar là popup bên trái và đóng/mở ổn định.
- Mobile friends/messages panel mở bằng nút `Users`, dùng dữ liệu ảo.
- Tablet main có sidebar 30% và content 70%.
- PC main có 3 cột và header ẩn nút bạn bè.
- Icon chính dùng `lucide-react`, không dùng emoji cho control.
- Không làm mất chức năng post, like, comment, edit, delete, logout.
- Build/lint không lỗi sau khi hoàn tất.
