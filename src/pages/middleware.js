import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (!token) return false;
        if (pathname.startsWith("/admin")) return token.role === "ADMIN";
        if (pathname.startsWith("/santri")) return token.role === "SANTRI";
        if (pathname.startsWith("/kepala")) return token.role === "KEPALA";
        return true;
      },
    },
  }
);

export const runtime = "nodejs"; // ← tambahkan ini

export const config = {
  matcher: ["/admin/:path*", "/santri/:path*", "/kepala/:path*"],
};