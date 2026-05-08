import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { overflow-x: hidden; font-family: 'Segoe UI', sans-serif; }

      @keyframes floatLogo {
        0%   { transform: translateY(0px) rotate(-1deg) scale(1); }
        50%  { transform: translateY(-16px) rotate(1.5deg) scale(1.03); }
        100% { transform: translateY(0px) rotate(-1deg) scale(1); }
      }
      @keyframes fadeSlideLeft {
        from { opacity: 0; transform: translateX(-40px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes fadeSlideRight {
        from { opacity: 0; transform: translateX(40px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes softGlow {
        0%, 100% { filter: drop-shadow(0 12px 40px rgba(34,197,94,0.20)); }
        50%       { filter: drop-shadow(0 20px 60px rgba(34,197,94,0.40)); }
      }

      .hero-text-anim { animation: fadeSlideLeft 0.9s cubic-bezier(.22,.68,0,1.2) both; }
      .hero-logo-anim { animation: fadeSlideRight 0.9s cubic-bezier(.22,.68,0,1.2) 0.2s both; }
      .float-logo { animation: floatLogo 5s ease-in-out infinite, softGlow 5s ease-in-out infinite; }

      /* NAVBAR */
      .navbar {
        display: flex; justify-content: space-between;
        padding: 14px 60px; align-items: center;
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
        position: sticky; top: 0; z-index: 1000;
        box-shadow: 0 2px 16px rgba(0,0,0,0.06);
      }
      .nav-logo-wrap { display: flex; align-items: center; gap: 10px; }
      .nav-logo-img  { height: 38px; object-fit: contain; }
      .nav-brand-name { font-weight: 800; color: #14532d; font-size: 15px; }
      .nav-brand-sub  { font-size: 11px; color: #6b7280; }
      .nav-menu { display: flex; gap: 24px; align-items: center; }
      .nav-link {
        color: #374151; font-weight: 500; cursor: pointer;
        font-size: 14px; text-decoration: none; transition: color 0.15s;
        background: none; border: none; font-family: inherit;
      }
      .nav-link:hover { color: #14532d; }
      .nav-login-btn {
        padding: 9px 22px; border-radius: 10px; border: none;
        background: linear-gradient(135deg, #14532d, #22c55e);
        color: white; font-weight: 600; cursor: pointer; font-size: 14px;
        transition: all 0.2s ease;
      }
      .nav-login-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(34,197,94,0.45); }

      .hamburger {
        display: none; flex-direction: column; gap: 5px;
        cursor: pointer; background: none; border: none; padding: 4px;
      }
      .hamburger span {
        display: block; width: 24px; height: 2.5px;
        background: #14532d; border-radius: 2px; transition: 0.3s;
      }

      .mobile-menu {
        display: none; flex-direction: column;
        background: #fff; padding: 16px 24px 24px;
        gap: 4px; border-top: 1px solid #e8f0e8;
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        position: sticky; top: 60px; z-index: 999;
      }
      .mobile-menu.open { display: flex; }
      .mobile-link {
        font-size: 15px; font-weight: 500; color: #374151;
        padding: 12px 0; border-bottom: 1px solid #f3f4f6;
        background: none; border-left: none; border-right: none; border-top: none;
        text-align: left; cursor: pointer; font-family: inherit; width: 100%;
      }
      .mobile-login-btn {
        margin-top: 12px; padding: 13px;
        background: linear-gradient(135deg, #14532d, #22c55e);
        color: white; font-weight: 700; border-radius: 10px;
        border: none; cursor: pointer; font-size: 15px; font-family: inherit;
      }

      /* HERO */
      .hero {
        position: relative; padding: 80px;
        background: linear-gradient(135deg, #fefce8 0%, #dcfce7 55%, #bbf7d0 100%);
        overflow: hidden; min-height: 88vh;
        display: flex; align-items: center;
      }
      .hero-grid {
        position: relative; z-index: 2;
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 60px; align-items: center;
        max-width: 1100px; margin: 0 auto; width: 100%;
      }
      .hero-left  { display: flex; flex-direction: column; align-items: flex-start; }
      .hero-right { display: flex; justify-content: center; align-items: center; }

      .hero-badge {
        display: inline-block;
        background: linear-gradient(135deg, #14532d, #22c55e);
        padding: 7px 18px; border-radius: 50px;
        color: white; font-size: 12px; font-weight: 600;
        letter-spacing: 0.5px; margin-bottom: 20px;
      }
      .hero-title {
        font-size: 44px; font-weight: 800; color: #111827;
        line-height: 1.2; margin-bottom: 16px;
      }
      .hero-accent { color: #14532d; }
      .hero-desc {
        color: #4b5563; font-size: 15px; line-height: 1.8;
        max-width: 460px; margin-bottom: 36px;
      }
      .hero-btns { display: flex; gap: 14px; flex-wrap: wrap; }

      .btn-primary {
        padding: 14px 28px;
        background: linear-gradient(135deg, #14532d, #22c55e);
        border: none; color: white; border-radius: 12px;
        font-weight: 700; font-size: 15px; cursor: pointer;
        box-shadow: 0 4px 16px rgba(34,197,94,0.35);
        transition: all 0.2s; font-family: inherit;
      }
      .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(34,197,94,0.45); }

      .btn-secondary {
        padding: 14px 28px; border-radius: 12px;
        border: 2px solid #14532d; background: transparent;
        color: #14532d; font-weight: 700; font-size: 15px;
        cursor: pointer; transition: all 0.2s; font-family: inherit;
      }
      .btn-secondary:hover { background: #f0fdf4; border-color: #22c55e; }

      .logo-circle {
        width: 360px; height: 360px; border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.85) 40%, rgba(187,247,208,0.5) 100%);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 48px rgba(34,197,94,0.12);
      }
      .logo-circle img { width: 260px; height: 260px; object-fit: contain; }

      .blob { position: absolute; border-radius: 50%; z-index: 1; pointer-events: none; }
      .blob1 { width:500px; height:500px; top:-120px; right:-100px; background: radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 70%); }
      .blob2 { width:350px; height:350px; bottom:-80px; left:-80px; background: radial-gradient(circle, rgba(20,83,45,0.09) 0%, transparent 70%); }
      .blob3 { width:200px; height:200px; bottom:60px; right:30%; background: radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%); }

      /* KONTAK */
      .contact-section { padding: 80px 60px; background: #f9fafb; text-align: center; }
      .contact-grid {
        display: grid; grid-template-columns: 1fr 1.4fr;
        gap: 28px; max-width: 960px; margin: 0 auto; text-align: left;
      }
      .contact-card {
        background: #fff; border-radius: 20px; padding: 32px 28px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        display: flex; flex-direction: column; gap: 24px;
        transition: all 0.2s;
      }
      .contact-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
      .contact-item { display: flex; gap: 16px; align-items: flex-start; }
      .contact-icon {
        width: 44px; height: 44px; min-width: 44px;
        background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        border-radius: 12px; display: flex; align-items: center;
        justify-content: center; font-size: 20px;
      }
      .contact-label { font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0; }
      .contact-val   { font-size: 14px; color: #111827; font-weight: 500; line-height: 1.6; margin: 0; }
      .map-wrap { border-radius: 20px; overflow: hidden; height: 360px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
      .map-wrap iframe { width: 100%; height: 100%; border: 0; display: block; }
      .social-link {
        display: flex; align-items: center; gap: 8px;
        color: #14532d; font-weight: 600; font-size: 14px;
        text-decoration: none; transition: opacity 0.15s;
      }
      .social-link:hover { opacity: 0.7; }

      /* FOOTER */
      .footer { background: #111827; color: #9ca3af; padding: 28px 60px; text-align: center; font-size: 13px; }

      /* ── TABLET (max 1024px) ── */
      @media (max-width: 1024px) {
        .navbar { padding: 14px 32px; }
        .hero { padding: 60px 40px; min-height: auto; }
        .hero-title { font-size: 36px; }
        .logo-circle { width: 280px; height: 280px; }
        .logo-circle img { width: 200px; height: 200px; }
        .contact-section { padding: 60px 32px; }
        .footer { padding: 24px 32px; }
      }

      /* ── MOBILE (max 768px) ── */
      @media (max-width: 768px) {
        .navbar { padding: 12px 20px; }
        .nav-menu { display: none; }
        .hamburger { display: flex; }

        .hero { padding: 40px 20px 56px; min-height: auto; }
        .hero-grid { grid-template-columns: 1fr; gap: 28px; text-align: center; }
        .hero-left  { align-items: center; }
        .hero-right { order: -1; }
        .hero-title { font-size: 28px; }
        .hero-desc  { font-size: 14px; max-width: 100%; margin-bottom: 28px; }
        .hero-btns  { justify-content: center; }
        .btn-primary, .btn-secondary { padding: 12px 22px; font-size: 14px; }

        .logo-circle { width: 200px; height: 200px; }
        .logo-circle img { width: 140px; height: 140px; }
        .blob1 { width: 220px; height: 220px; top: -60px; right: -50px; }
        .blob2 { width: 160px; height: 160px; bottom: -40px; left: -40px; }
        .blob3 { display: none; }

        .contact-section { padding: 48px 20px; }
        .contact-grid { grid-template-columns: 1fr; gap: 20px; }
        .contact-card { padding: 24px 20px; }
        .map-wrap { height: 240px; }

        .footer { padding: 20px; font-size: 12px; }
      }

      /* ── SMALL MOBILE (max 400px) ── */
      @media (max-width: 400px) {
        .hero-title { font-size: 22px; }
        .hero-badge { font-size: 11px; padding: 6px 12px; }
        .logo-circle { width: 160px; height: 160px; }
        .logo-circle img { width: 110px; height: 110px; }
        .hero-btns { flex-direction: column; width: 100%; }
        .btn-primary, .btn-secondary { width: 100%; text-align: center; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  function scrollTo(id) {
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }

  return (
    <div>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo-wrap">
          <img src="/logo-sibatamu.png" alt="logo" className="nav-logo-img"
            onError={e => e.target.style.display = "none"} />
          <div>
            <div className="nav-brand-name">SIBATAMU-SPP</div>
            <div className="nav-brand-sub">Madrasah Tarbiyatul Mubalighin</div>
          </div>
        </div>

        <div className="nav-menu">
          <button className="nav-link" onClick={() => scrollTo("beranda")}>🏠 Beranda</button>
          <button className="nav-link" onClick={() => scrollTo("kontak")}>📞 Kontak</button>
          <button className="nav-login-btn" onClick={() => router.push("/login")}>Login</button>
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="menu">
          <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <button className="mobile-link" onClick={() => scrollTo("beranda")}>🏠 Beranda</button>
        <button className="mobile-link" onClick={() => scrollTo("kontak")}>📞 Kontak</button>
        <button className="mobile-login-btn" onClick={() => router.push("/login")}>🚀 Login Sekarang</button>
      </div>

      {/* HERO */}
      <section id="beranda" className="hero">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
        <div className="hero-grid">
          <div className="hero-left hero-text-anim">
            <span className="hero-badge">🌿 SISTEM TERPERCAYA & MODERN</span>
            <h1 className="hero-title">
              Kelola Pembayaran<br />
              <span className="hero-accent">SPP Lebih Mudah</span>
            </h1>
            <p className="hero-desc">
              Platform pembayaran SPP digital yang transparan, efisien, dan mudah
              digunakan untuk seluruh civitas Madrasah Tarbiyatul Mubalighin Sumberjo.
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => router.push("/login")}>🚀 Login Sekarang</button>
              <button className="btn-secondary" onClick={() => scrollTo("kontak")}>📞 Hubungi Kami</button>
            </div>
          </div>

          <div className="hero-right hero-logo-anim">
            <div className="logo-circle">
              <img className="float-logo" src="/logo-sibatamu.png" alt="SIBATAMU Logo" />
            </div>
          </div>
        </div>
      </section>

      {/* KONTAK */}
      <section id="kontak" className="contact-section">
        <h2 className="section-title">📞 Kontak Kami</h2>
        <p className="section-sub">Hubungi kami untuk informasi lebih lanjut tentang sistem SPP Digital.</p>
        <div className="contact-grid">
          <div className="contact-card">
            {[
              { icon: "📍", label: "Alamat", val: "Ds. Sumberjo, Kec. Sanankulon,\nKab. Blitar, Jawa Timur" },
              { icon: "📧", label: "Email", val: "madrasahtaribiyatulsumberjo@gmail.com" },
              { icon: "📱", label: "Telepon / WhatsApp", val: "08xxxxxxxxxx" },
            ].map((item, i) => (
              <div key={i} className="contact-item">
                <div className="contact-icon">{item.icon}</div>
                <div>
                  <p className="contact-label">{item.label}</p>
                  <p className="contact-val" style={{ whiteSpace: "pre-line" }}>{item.val}</p>
                </div>
              </div>
            ))}
            <div className="contact-item">
              <div className="contact-icon">📲</div>
              <div>
                <p className="contact-label">Media Sosial</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:6 }}>
                  {[
                    { icon:"📸", label:"Instagram", href:"https://instagram.com/" },
                    { icon:"📘", label:"Facebook",  href:"https://facebook.com/" },
                    { icon:"▶️", label:"YouTube",   href:"https://youtube.com/" },
                  ].map((s, i) => (
                    <a key={i} href={s.href} target="_blank" rel="noreferrer" className="social-link">
                      {s.icon} {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="map-wrap">
            <iframe
              title="Lokasi Madrasah"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.8!2d112.1623!3d-8.0512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e78f2e1c3b8b1e5%3A0xabcdef1234567890!2sSumberjo%2C%20Sanankulon%2C%20Blitar%2C%20Jawa%20Timur!5e0!3m2!1sid!2sid!4v1746000000000!5m2!1sid!2sid"
              allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        🌿 © 2026 Madrasah Tarbiyatul Mubalighin Sumberjo. All rights reserved.
      </footer>
    </div>
  );
}