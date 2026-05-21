import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (!token) return false;
        if (pathname.startsWith("/admin")) return token.role === "ADMIN";
        if (pathname.startsWith("/kepala")) return token.role === "KEPALA";
        // Halaman santri (bukan API)
        if (pathname.startsWith("/santri")) return token.role === "SANTRI";
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/santri/:path*",
    "/kepala/:path*",
    // Exclude API routes dari middleware
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};