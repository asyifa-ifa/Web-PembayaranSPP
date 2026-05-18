// pages/login.js
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function Login() {
  const router = useRouter();
  const { error } = router.query;

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (error === "EmailNotRegistered") {
      setErrorMsg("Email Google kamu belum terdaftar di sistem. Hubungi admin.");
    }
  }, [error]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await signIn("credentials", {
      redirect: false,
      username: form.username,
      password: form.password,
    });

    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
      return;
    }

    const session = await getSession();
    redirectByRole(session?.user?.role);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMsg("");
    await signIn("google", { callbackUrl: "/auth-redirect" });
  };

  const redirectByRole = (role) => {
    if (role === "ADMIN") router.push("/admin/dashboard");
    else if (role === "SANTRI") router.push("/santri/dashboard");
    else if (role === "KEPALA") router.push("/kepala/dashboard");
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* LOGO */}
        <div style={s.logoWrap}>
          <img src="/logo-sibatamu.png" alt="logo" style={s.logo}
            onError={e => e.target.style.display = "none"} />
        </div>

        <h2 style={s.title}>Masuk ke SIBATAMU-SPP</h2>
        <p style={s.subtitle}>Sistem Pembayaran SPP Digital Madrasah</p>

        {/* ERROR */}
        {errorMsg && <div style={s.error}>⚠️ {errorMsg}</div>}

        {/* GOOGLE LOGIN */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={s.googleBtn}
        >
          {googleLoading ? (
            <span>Menghubungkan...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </>
          )}
        </button>

        {/* DIVIDER */}
        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>atau masuk dengan username</span>
          <div style={s.dividerLine} />
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} style={s.form}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Username</label>
            <input
              type="text"
              placeholder="Masukkan username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              style={s.input}
              required
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Password</label>
            <div style={s.passWrap}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={s.passInput}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? "Memproses..." : "🔐 Masuk"}
          </button>
        </form>

        {/* LUPA PASSWORD */}
        <p style={s.forgot} onClick={() => router.push("/forgot-password")}>
          Lupa Password?
        </p>

        {/* INFO GOOGLE */}
        <div style={s.infoBox}>
          <span style={{ fontSize: 13 }}>ℹ️</span>
          <span style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
            Login Google hanya untuk santri yang emailnya sudah terdaftar di sistem oleh admin.
          </span>
        </div>

        <p style={s.footer}>© 2026 SIBATAMU-SPP · Madrasah Tarbiyatul Mubalighin</p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
    padding: "20px",
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  },
  card: {
    background: "#fff",
    padding: "36px 32px",
    width: "100%",
    maxWidth: "400px",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(20,83,45,0.12)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    border: "1px solid #e9f5ec",
  },
  logoWrap: { display: "flex", justifyContent: "center", marginBottom: "4px" },
  logo: { height: "52px", objectFit: "contain" },
  title: {
    textAlign: "center",
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f2415",
    margin: 0,
  },
  subtitle: {
    textAlign: "center",
    fontSize: "13px",
    color: "#6b7280",
    margin: 0,
  },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    border: "1px solid #fecaca",
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "12px",
    borderRadius: "12px",
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.15s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    fontFamily: "inherit",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  dividerLine: { flex: 1, height: "1px", background: "#e5e7eb" },
  dividerText: { fontSize: "11px", color: "#9ca3af", fontWeight: "600", whiteSpace: "nowrap" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "12px", fontWeight: "700", color: "#374151" },
  input: {
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1.5px solid #e5e7eb",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    color: "#1a2e1f",
    background: "#fafafa",
    width: "100%",
    boxSizing: "border-box",
  },
  passWrap: { position: "relative" },
  passInput: {
    width: "100%",
    padding: "11px 40px 11px 14px",
    borderRadius: "10px",
    border: "1.5px solid #e5e7eb",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    color: "#1a2e1f",
    background: "#fafafa",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
  },
  submitBtn: {
    padding: "13px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #14532d, #22c55e)",
    color: "white",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 4px 16px rgba(20,83,45,0.25)",
    marginTop: "4px",
  },
  forgot: {
    textAlign: "center",
    fontSize: "13px",
    color: "#16a34a",
    cursor: "pointer",
    fontWeight: "600",
    margin: 0,
  },
  infoBox: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    padding: "10px 12px",
  },
  footer: {
    textAlign: "center",
    fontSize: "11px",
    color: "#9ca3af",
    margin: 0,
  },
};