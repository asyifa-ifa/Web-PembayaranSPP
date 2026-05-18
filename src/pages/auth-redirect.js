// pages/auth-redirect.js
// Halaman perantara untuk redirect setelah Google login
import { useEffect } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const session = await getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const role = session.user.role;
      if (role === "ADMIN") router.push("/admin/dashboard");
      else if (role === "SANTRI") router.push("/santri/dashboard");
      else if (role === "KEPALA") router.push("/kepala/dashboard");
      else router.push("/login");
    };
    redirect();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
      fontFamily: "sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🌿</p>
        <p style={{ color: "#14532d", fontSize: 15, fontWeight: 600 }}>
          Mengalihkan...
        </p>
      </div>
    </div>
  );
}