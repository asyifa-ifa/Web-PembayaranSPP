import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // bisa ditambah logic lain kalau perlu
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // ❌ BELUM LOGIN
        if (!token) return false;

        // ✅ ADMIN ONLY
        if (pathname.startsWith("/admin")) {
          return token.role === "ADMIN";
        }

        // ✅ SANTRI ONLY
        if (pathname.startsWith("/santri")) {
          return token.role === "SANTRI";
        }

        // ✅ KEPALA ONLY
        if (pathname.startsWith("/kepala")) {
          return token.role === "KEPALA";
        }

        // selain itu bebas
        return true;
      },
    },
  }
);

/* ================= PROTECT ROUTES ================= */
export const config = {
  matcher: [
    "/admin/:path*",
    "/santri/:path*",
    "/kepala/:path*",
  ],
};