import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const path = req.nextUrl.pathname;

    // Public API routes
    if (path.startsWith("/api/auth") || path.startsWith("/api/register")) {
      return NextResponse.next();
    }

    // Protected API routes
    if (path.startsWith("/api/")) {
      // 1. Chặn truy cập trực tiếp từ URL trình duyệt (dù đã login hay chưa)
      const fetchMode = req.headers.get("sec-fetch-mode");
      if (fetchMode === "navigate") {
        return NextResponse.json(
          { error: "Direct API access is not allowed" },
          { status: 403 }
        );
      }

      // 2. Xác định API nào Guest (chưa đăng nhập) được phép gọi (Chỉ GET)
      const isGuestAllowedRoute =
        req.method === "GET" &&
        (path === "/api/posts" || path.match(/^\/api\/posts\/\d+\/comments$/));

      // 3. Kiểm tra JWT Token
      const token = req.nextauth.token;

      // Trả về JSON lỗi 401 nếu không có token và không nằm trong diện ngoại lệ
      if (!token && !isGuestAllowedRoute) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
        // Luôn trả về true để hàm middleware() ở trên có quyền tự quyết định
        // response JSON thay vì bị NextAuth ép redirect sang trang login.
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/api/:path*"],
};
