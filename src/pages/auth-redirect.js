import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    const role = session.user?.role;
    if (role === "ADMIN") router.push("/admin/dashboard");
    else if (role === "SANTRI") router.push("/santri/dashboard");
    else if (role === "KEPALA") router.push("/kepala/dashboard");
    else router.push("/login");
  }, [session, status]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <p style={{ color: "#16a34a", fontWeight: 600 }}>
          Mengalihkan ke halaman Anda...
        </p>
      </div>
    </div>
  );
}