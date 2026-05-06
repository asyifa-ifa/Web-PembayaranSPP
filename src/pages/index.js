import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes floatLogo {
        0%   { transform: translateY(0px) rotate(-1deg) scale(1); }
        50%  { transform: translateY(-20px) rotate(1.5deg) scale(1.03); }
        100% { transform: translateY(0px) rotate(-1deg) scale(1); }
      }
      @keyframes fadeSlideLeft {
        from { opacity: 0; transform: translateX(-50px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes fadeSlideRight {
        from { opacity: 0; transform: translateX(50px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes softGlow {
        0%, 100% { filter: drop-shadow(0 12px 40px rgba(34,197,94,0.20)); }
        50%       { filter: drop-shadow(0 20px 60px rgba(34,197,94,0.40)); }
      }
      .hero-text-anim {
        animation: fadeSlideLeft 0.9s cubic-bezier(.22,.68,0,1.2) both;
      }
      .hero-logo-anim {
        animation: fadeSlideRight 0.9s cubic-bezier(.22,.68,0,1.2) 0.2s both;
      }
      .float-logo {
        animation: floatLogo 5s ease-in-out infinite, softGlow 5s ease-in-out infinite;
      }
      .login-btn-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(34,197,94,0.45) !important;
        transition: all 0.2s ease;
      }
      .secondary-btn-hover:hover {
        background: #f0fdf4 !important;
        transition: all 0.2s ease;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div style={styles.container}>

      {/* NAVBAR */}
      <nav style={styles.nav}>
        <div style={styles.logoWrap}>
          <img
            src="/logo-sibatamu.png"
            alt="SIBATAMU"
            style={{ height: 38, objectFit: "contain" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div style={styles.logoText}>
            <b style={{ color: "#14532d", fontSize: 15 }}>SIBATAMU-SPP</b>
            <p style={{ fontSize: 11, margin: 0, color: "#6b7280" }}>
              Madrasah Tarbiyatul Mubalighin Sumberjo
            </p>
          </div>
        </div>

        <div style={styles.menu}>
          <a style={styles.menuItem} onClick={() => scrollToSection("beranda")}>
            🏠 Beranda
          </a>
          <a style={styles.menuItem} onClick={() => scrollToSection("kontak")}>
            📞 Kontak
          </a>
          <button
            className="login-btn-hover"
            style={styles.loginBtn}
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        </div>
      </nav>

      {/* HERO — dua kolom: teks kiri, logo kanan */}
      <section id="beranda" style={styles.hero}>
        {/* Decorative blobs */}
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.blob3} />

        <div style={styles.heroGrid}>

          {/* KIRI — teks */}
          <div className="hero-text-anim" style={styles.heroLeft}>
            <span style={styles.badge}>🌿 SISTEM TERPERCAYA & MODERN</span>

            <h1 style={styles.title}>
              Kelola Pembayaran<br />
              <span style={styles.titleAccent}>SPP Lebih Mudah</span>
            </h1>

            <p style={styles.desc}>
              Platform pembayaran SPP digital yang transparan, efisien,
              dan mudah digunakan untuk seluruh civitas Madrasah Tarbiyatul
              Mubalighin Sumberjo.
            </p>

            <div style={styles.heroButtons}>
              <button
                className="login-btn-hover"
                style={styles.primaryBtn}
                onClick={() => router.push("/login")}
              >
                🚀 Login Sekarang
              </button>
              <button
                className="secondary-btn-hover"
                style={styles.secondaryBtn}
                onClick={() => scrollToSection("kontak")}
              >
                📞 Hubungi Kami
              </button>
            </div>
          </div>

          {/* KANAN — logo floating */}
          <div className="hero-logo-anim" style={styles.heroRight}>
            <div style={styles.logoCircleBg}>
              <img
                className="float-logo"
                src="/logo-sibatamu.png"
                alt="SIBATAMU Logo"
                style={styles.heroLogoImg}
              />
            </div>
          </div>

        </div>
      </section>

      {/* KONTAK */}
      <section id="kontak" style={styles.contactSection}>
        <h2 style={styles.sectionTitle}>📞 Kontak Kami</h2>
        <p style={styles.sectionSub}>
          Hubungi kami untuk informasi lebih lanjut tentang sistem SPP Digital.
        </p>

        <div style={styles.contactGrid}>
          {/* Info Kontak */}
          <div style={styles.contactCard}>
            <div style={styles.contactItem}>
              <div style={styles.contactIconBox}>📍</div>
              <div>
                <p style={styles.contactLabel}>Alamat</p>
                <p style={styles.contactValue}>
                  Ds. Sumberjo, Kec. Sanankulon,<br />Kab. Blitar, Jawa Timur
                </p>
              </div>
            </div>

            <div style={styles.contactItem}>
              <div style={styles.contactIconBox}>📧</div>
              <div>
                <p style={styles.contactLabel}>Email</p>
                <p style={styles.contactValue}>email@madrasah.com</p>
              </div>
            </div>

            <div style={styles.contactItem}>
              <div style={styles.contactIconBox}>📱</div>
              <div>
                <p style={styles.contactLabel}>Telepon / WhatsApp</p>
                <p style={styles.contactValue}>08xxxxxxxxxx</p>
              </div>
            </div>

            <div style={styles.contactItem}>
              <div style={styles.contactIconBox}>📲</div>
              <div>
                <p style={styles.contactLabel}>Media Sosial</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <a href="https://instagram.com/" target="_blank" rel="noreferrer" style={styles.socialLink}>
                    <span style={styles.socialIcon}>📸</span> Instagram
                  </a>
                  <a href="https://facebook.com/" target="_blank" rel="noreferrer" style={styles.socialLink}>
                    <span style={styles.socialIcon}>📘</span> Facebook
                  </a>
                  <a href="https://youtube.com/" target="_blank" rel="noreferrer" style={styles.socialLink}>
                    <span style={styles.socialIcon}>▶️</span> YouTube
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps Embed */}
          <div style={styles.mapWrapper}>
            <iframe
              title="Lokasi Madrasah"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.8!2d112.1623!3d-8.0512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e78f2e1c3b8b1e5%3A0xabcdef1234567890!2sSumberjo%2C%20Sanankulon%2C%20Blitar%2C%20Jawa%20Timur!5e0!3m2!1sid!2sid!4v1746000000000!5m2!1sid!2sid"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: 16 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        🌿 © 2026 Madrasah Tarbiyatul Mubalighin Sumberjo. All rights reserved.
      </footer>
    </div>
  );
}

/* ================= STYLE ================= */

const styles = {
  container: {
    fontFamily: "'Segoe UI', sans-serif",
    scrollBehavior: "smooth",
    overflowX: "hidden",
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "14px 60px",
    alignItems: "center",
    background: "#ffffff",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  logoText: {
    lineHeight: 1.4,
  },

  menu: { display: "flex", gap: 24, alignItems: "center" },

  menuItem: {
    color: "#374151",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: 14,
    textDecoration: "none",
  },

  loginBtn: {
    padding: "9px 22px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #14532d, #22c55e)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s ease",
  },

  /* HERO */
  hero: {
    position: "relative",
    padding: "80px 80px",
    background: "linear-gradient(135deg, #fefce8 0%, #dcfce7 55%, #bbf7d0 100%)",
    overflow: "hidden",
    minHeight: "85vh",
    display: "flex",
    alignItems: "center",
  },

  heroGrid: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 60,
    alignItems: "center",
    maxWidth: 1100,
    marginInline: "auto",
    width: "100%",
  },

  heroLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },

  heroRight: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  logoCircleBg: {
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.85) 40%, rgba(187,247,208,0.5) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 48px rgba(34,197,94,0.12)",
  },

  heroLogoImg: {
    width: 260,
    height: 260,
    objectFit: "contain",
  },

  blob1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 70%)",
    top: -120,
    right: -100,
    zIndex: 1,
  },

  blob2: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(20,83,45,0.09) 0%, transparent 70%)",
    bottom: -80,
    left: -80,
    zIndex: 1,
  },

  blob3: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%)",
    bottom: 60,
    right: "30%",
    zIndex: 1,
  },

  badge: {
    display: "inline-block",
    background: "linear-gradient(135deg, #14532d, #22c55e)",
    padding: "7px 18px",
    borderRadius: 50,
    color: "white",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
    marginBottom: 20,
  },

  title: {
    fontSize: 44,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.2,
    marginTop: 10,
    marginBottom: 10,
  },

  titleAccent: {
    color: "#14532d",
  },

  desc: {
    marginTop: 16,
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 1.8,
    maxWidth: 460,
  },

  heroButtons: {
    marginTop: 36,
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
  },

  primaryBtn: {
    padding: "14px 28px",
    background: "linear-gradient(135deg, #14532d, #22c55e)",
    border: "none",
    color: "white",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
    transition: "all 0.2s ease",
  },

  secondaryBtn: {
    padding: "14px 28px",
    borderRadius: 12,
    border: "2px solid #14532d",
    background: "transparent",
    color: "#14532d",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  /* KONTAK */
  contactSection: {
    padding: "80px 60px",
    background: "#f9fafb",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 30,
    fontWeight: 800,
    color: "#14532d",
    marginBottom: 8,
  },

  sectionSub: {
    color: "#6b7280",
    fontSize: 15,
    marginBottom: 48,
  },

  contactGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: 28,
    maxWidth: 960,
    marginInline: "auto",
    textAlign: "left",
  },

  contactCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "32px 28px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },

  contactItem: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },

  contactIconBox: {
    width: 44,
    height: 44,
    minWidth: 44,
    background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },

  contactLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    margin: "0 0 4px 0",
  },

  contactValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: 500,
    lineHeight: 1.6,
    margin: 0,
  },

  mapWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    height: 340,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },

  socialLink: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#14532d",
    fontWeight: 600,
    fontSize: 14,
    textDecoration: "none",
  },

  socialIcon: {
    fontSize: 16,
  },

  /* FOOTER */
  footer: {
    background: "#111827",
    color: "#9ca3af",
    padding: "28px 60px",
    textAlign: "center",
    fontSize: 13,
  },
};