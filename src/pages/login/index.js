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
    <div className="login-container">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleBg {
          from { transform: scale(1.05); }
          to { transform: scale(1); }
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
          background-color: #fff;
          overflow: hidden;
        }

          /* SISI KIRI: VISUAL DAN ANIMASI */
            .visual-side {
              flex: 1.2;
              position: relative;
              background: linear-gradient(135deg, rgba(20,83,45,0.85) 0%, rgba(34,197,94,0.7) 100%), 
                          url("/gambar-santri.png") no-repeat;
              background-size: cover;
              background-position: center;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 48px;
              color: white;

              /* TAMBAHKAN KATA "forwards" DI SETIAP AKHIR ANIMASI */
              animation: fadeIn 1s ease-out forwards, scaleBg 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

        .brand-overlay {
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .brand-logo {
          height: 45px;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));
        }

        .brand-text h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .brand-text span {
          font-size: 11px;
          opacity: 0.8;
          display: block;
        }

        .quote-box {
          max-width: 500px;
          animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .quote-box h1 {
          font-size: 36px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 16px;
          text-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .quote-box p {
          font-size: 15px;
          opacity: 0.9;
          line-height: 1.6;
          margin: 0;
        }

        .visual-footer {
          font-size: 12px;
          opacity: 0.7;
          animation: slideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* SISI KANAN: FORM LOGIN */
        .form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: #ffffff;
          position: relative;
          box-shadow: -10px 0 30px rgba(0,0,0,0.03);
          animation: fadeIn 0.8s ease-out;
        }

        .form-wrapper {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .header-section {
          text-align: left;
        }

        .header-section h2 {
          font-size: 26px;
          font-weight: 800;
          color: #0f2415;
          margin: 0 0 6px 0;
        }

        .header-section p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .error-banner {
          background: #fef2f2;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          border: 1px solid #fecaca;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .google-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          font-family: inherit;
        }

        .google-button:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .google-button:active {
          transform: translateY(0);
        }

        .divider-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .divider-text {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
          white-space: nowrap;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 700;
          color: #374151;
        }

        .input-field {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          font-size: 14.5px;
          outline: none;
          font-family: inherit;
          color: #1a2e1f;
          background: #fdfdfd;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .input-field:focus {
          border-color: #22c55e;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(34,197,94,0.12);
        }

        .password-wrapper {
          position: relative;
        }

        .password-input {
          width: 100%;
          padding: 12px 44px 12px 14px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          font-size: 14.5px;
          outline: none;
          font-family: inherit;
          color: #1a2e1f;
          background: #fdfdfd;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .password-input:focus {
          border-color: #22c55e;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(34,197,94,0.12);
        }

        .eye-button {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          transition: color 0.2s;
        }
        
        .eye-button:hover {
          color: #374151;
        }

        .forgot-link {
          align-self: flex-end;
          font-size: 13px;
          color: #16a34a;
          cursor: pointer;
          font-weight: 600;
          margin-top: -4px;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #14532d;
          text-decoration: underline;
        }

        .submit-button {
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #14532d, #16a34a);
          color: white;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 4px 14px rgba(20,83,45,0.2);
          transition: all 0.2s ease;
          margin-top: 6px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(20,83,45,0.3);
          background: linear-gradient(135deg, #0f3f22, #15803d);
        }

        .submit-button:active {
          transform: translateY(0);
        }

        .info-notice {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 12px;
        }

        .info-text {
          font-size: 12px;
          color: #14532d;
          line-height: 1.5;
          font-weight: 500;
        }

        .mobile-footer {
          display: none;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          margin-top: 10px;
        }

        /* MEDIA QUERY RESPONSIVENESS (HP & TABLET) */
        @media (max-width: 968px) {
          .visual-side {
            display: none; /* Menyembunyikan sisi gambar pada perangkat mobile/layar kecil */
          }
          .form-side {
            flex: 1;
            padding: 24px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          }
          .form-wrapper {
            background: #ffffff;
            padding: 32px 24px;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(20,83,45,0.08);
          }
          .mobile-footer {
            display: block;
          }
        }
      `}</style>

      {/* SISI KIRI: BACKGROUND ANIMASI & INFORMASI BRAND */}
      <div className="visual-side">
        <div className="brand-overlay">
          <img 
            src="/logo-sibatamu.png" 
            alt="SIBATAMU-SPP Logo" 
            className="brand-logo"
            onError={e => e.target.style.display = "none"} 
          />
          <div className="brand-text">
            <h3>SIBATAMU-SPP</h3>
            <span>Tarbiyatul Mubalighin Sumberjo</span>
          </div>
        </div>

        <div className="quote-box">
          <h1>Kelola Pembayaran SPP Lebih Mudah & Modern</h1>
          <p>Platform administrasi keuangan digital terintegrasi untuk kenyamanan santri, wali santri, dan pengurus madrasah.</p>
        </div>

        <div className="visual-footer">
          © 2026 SIBATAMU-SPP · Madrasah Tarbiyatul Mubalighin
        </div>
      </div>

      {/* SISI KANAN: PANEL FORM LOGIN */}
      <div className="form-side">
        <div className="form-wrapper">
          <div className="header-section">
            <h2>Selamat Datang</h2>
            <p>Silakan masuk ke akun Anda</p>
          </div>

          {/* BANNER NOTIFIKASI ERROR */}
          {errorMsg && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* GOOGLE SIGN IN BUTTON */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="google-button"
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

          {/* GARIS PEMISAH */}
          <div className="divider-container">
            <div className="divider-line" />
            <span className="divider-text">atau gunakan username</span>
            <div className="divider-line" />
          </div>

          {/* FORM ISIAN UTAMA */}
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Masukkan username"
                className="input-field"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  className="password-input"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="eye-button"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <span className="forgot-link" onClick={() => router.push("/forgot-password")}>
              Lupa Password?
            </span>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Memproses..." : "🔐 Masuk ke Akun"}
            </button>
          </form>

          {/* KOTAK INFORMASI */}
          <div className="info-notice">
            <span style={{ fontSize: 14 }}>ℹ️</span>
            <span className="info-text">
              Login Google hanya berlaku bagi santri dengan alamat email yang telah didaftarkan sebelumnya oleh Administrator.
            </span>
          </div>

          <div className="mobile-footer">
            © 2026 SIBATAMU-SPP · Madrasah Tarbiyatul Mubalighin
          </div>
        </div>
      </div>
    </div>
  );
}