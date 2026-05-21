import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Biarkan semua API lewat, auth dicek di masing-masing API
        if (pathname.startsWith("/api/")) return true;

        if (!token) return false;
        if (pathname.startsWith("/admin")) return token.role === "ADMIN";
        if (pathname.startsWith("/kepala")) return token.role === "KEPALA";
        if (pathname.startsWith("/santri")) return token.role === "SANTRI";
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/kepala/:path*",
    "/santri/:path*",
    "/api/santri/:path*",
  ],
};