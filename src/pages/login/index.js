import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Login() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username: form.username,
      password: form.password,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    const session = await getSession();

    if (session.user.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (session.user.role === "SANTRI") {
      router.push("/santri/dashboard");
    } else if (session.user.role === "KEPALA") {
      router.push("/kepala/dashboard");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h2 style={styles.title}>🔐 Login SPP Digital</h2>
        <p style={styles.subtitle}>
          Masukkan username dan password Anda
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
          style={styles.input}
          required
        />

        <div style={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            style={styles.passwordInput}
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Memproses..." : "Login"}
        </button>

        {/* 🔥 LUPA PASSWORD DI SINI */}
        <p
          style={styles.lupa}
          onClick={() => router.push("/forgot-password")}
        >
          Lupa Password?
        </p>

        <p style={styles.footer}>
          © 2026 SPP Digital Madrasah
        </p>
      </form>
    </div>
  );
}

/* ================= STYLE ================= */

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #fefce8 0%, #dcfce7 50%, #bbf7d0 100%)",
    padding: 20,
  },

  card: {
    background: "#ffffff",
    padding: 35,
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    boxShadow: "0 15px 40px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },

  title: {
    textAlign: "center",
    color: "#14532d",
    margin: 0,
  },

  subtitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 10,
  },

  input: {
    padding: "12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
    boxSizing:"border-box",
  },

  passwordWrapper: {
    position: "relative",
  },

  passwordInput: {
    width: "100%",
    padding: "12px 35px 12px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
},

  eyeButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: 14,
  },

  button: {
    marginTop: 10,
    padding: "12px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#14532d,#22c55e)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },

  /* 🔥 STYLE LUPA PASSWORD */
  lupa: {
    textAlign: "center",
    fontSize: 13,
    color: "#16a34a",
    cursor: "pointer",
    marginTop: 5,
  },

  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    textAlign: "center",
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 10,
  },
};