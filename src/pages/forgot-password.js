import { useState } from "react";
import { useRouter } from "next/router";

export default function ForgotPassword() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Link reset berhasil dibuat");
      
      // 🔥 redirect ke reset page (mode demo)
      if (data.token) {
        setTimeout(() => {
          router.push(`/reset-password?token=${data.token}`);
        }, 1500);
      }
    } else {
      setMessage(data.message);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>🔑 Lupa Password</h2>

        <p style={styles.subtitle}>
          Masukkan username untuk reset password
        </p>

        {message && <div style={styles.info}>{message}</div>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Memproses..." : "Kirim Link Reset"}
        </button>

        {/* 🔙 KEMBALI KE LOGIN */}
        <p
          style={styles.back}
          onClick={() => router.push("/login")}
        >
          ← Kembali ke Login
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

  info: {
    background: "#dcfce7",
    color: "#166534",
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    textAlign: "center",
  },

  back: {
    textAlign: "center",
    fontSize: 13,
    color: "#16a34a",
    cursor: "pointer",
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 10,
  },
};