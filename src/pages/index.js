// src/pages/index.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // State pemicu animasi transisi keluar

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { overflow-x: hidden; font-family: 'Segoe UI', sans-serif; }

      @keyframes fadeSlideLeft {
        from { opacity: 0; transform: translateX(-40px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes fadeSlideRight {
        from { opacity: 0; transform: translateX(40px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes floatChar {
        0%   { transform: translateY(0px); }
        50%  { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }

      /* ANIMASI SAPUAN TRANSISI DARI KIRI KE KANAN (SMOOTH & ELEGAN) */
      @keyframes slideOutOverlay {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(0); }
      }

      .page-transition-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #14532d, #16a34a);
        z-index: 9999;
        transform: translateX(-100%); /* Default sembunyi di luar layar sebelah kiri */
        pointer-events: none;
      }

      .page-transition-overlay.active {
        pointer-events: auto;
        /* Menggunakan cubic-bezier penutup layar yang sangat halus */
        animation: slideOutOverlay 0.5s cubic-bezier(0.76, 0, 0.24, 1) forwards;
      }

      .hero-text-anim { animation: fadeSlideLeft 0.9s cubic-bezier(.22,.68,0,1.2) both; }
      .hero-logo-anim { animation: fadeSlideRight 0.9s cubic-bezier(.22,.68,0,1.2) 0.2s both; }
      .float-char { animation: floatChar 5s ease-in-out infinite; }

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
        position: relative; padding: 80px 80px 0;
        background: linear-gradient(135deg, #fefce8 0%, #dcfce7 55%, #bbf7d0 100%);
        overflow: hidden; min-height: 88vh;
        display: flex; align-items: flex-end;
      }
      .hero-grid {
        position: relative; z-index: 2;
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 60px; align-items: flex-end;
        max-width: 1100px; margin: 0 auto; width: 100%;
      }
      .hero-left {
        display: flex; flex-direction: column; align-items: flex-start;
        padding-bottom: 80px;
      }
      .hero-right { display: flex; justify-content: center; align-items: flex-end; }

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

      /* HERO CHARACTER */
      .hero-char-img {
        width: 100%;
        max-width: 500px;
        height: auto;
        object-fit: contain;
        object-position: bottom;
        display: block;
        filter: drop-shadow(0 -8px 32px rgba(34,197,94,0.35));
        -webkit-mask-image: linear-gradient(to top, transparent 0%, rgba(0,0,0,0.6) 20%, black 40%);
        mask-image: linear-gradient(to top, transparent 0%, rgba(0,0,0,0.6) 20%, black 40%);
      }

      .blob { position: absolute; border-radius: 50%; z-index: 1; pointer-events: none; }
      .blob1 { width:500px; height:500px; top:-120px; right:-100px; background: radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 70%); }
      .blob2 { width:350px; height:350px; bottom:-80px; left:-80px; background: radial-gradient(circle, rgba(20,83,45,0.09) 0%, transparent 70%); }
      .blob3 { width:200px; height:200px; bottom:60px; right:30%; background: radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%); }

      /* KONTAK */
      .contact-section { padding: 80px 60px; background: #f9fafb; text-align: center; }
      .section-title { font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 8px; }
      .section-sub { color: #6b7280; font-size: 15px; margin-bottom: 40px; }
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
        display: flex; align-items: center; gap: 10px;
        color: #14532d; font-weight: 600; font-size: 14px;
        text-decoration: none; transition: opacity 0.15s;
        padding: 6px 0;
      }
      .social-link:hover { opacity: 0.7; }
      .social-icon {
        width: 32px; height: 32px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .social-icon-ig  { background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
      .social-icon-fb  { background: #1877f2; }
      .social-icon-yt  { background: #ff0000; }

      /* FOOTER */
      .footer { background: #111827; color: #9ca3af; padding: 28px 60px; text-align: center; font-size: 13px; }

      /* ==========================================================================
         MEDIA QUERIES - OPTIMASI RESPONSIVITAS TOTAL
         ========================================================================== */

      /* TABLET */
      @media (max-width: 1024px) {
        .navbar { padding: 14px 32px; }
        .hero { padding: 60px 40px 40px; min-height: auto; }
        .hero-left { padding-bottom: 40px; }
        .hero-title { font-size: 36px; }
        .hero-char-img { max-width: 380px; }
        .contact-section { padding: 60px 32px; }
        .footer { padding: 24px 32px; }
      }

      /* MOBILE STANDARD */
      @media (max-width: 768px) {
        .navbar { padding: 12px 20px; }
        .nav-menu { display: none; }
        
        /* Optimasi Hitbox Tombol Hamburger (UX Minimal 44px) */
        .hamburger { 
          display: flex; 
          width: 44px; 
          height: 44px; 
          align-items: center; 
          justify-content: center; 
        }

        .hero { 
          padding: 40px 20px 40px; 
          min-height: auto; 
          align-items: center; 
          position: relative;
        }
        .hero-grid { grid-template-columns: 1fr; gap: 32px; text-align: center; }
        .hero-left  { align-items: center; padding-bottom: 0; order: 1; }
        .hero-right { order: 0; display: flex; justify-content: center; }
        .hero-title { font-size: 30px; }
        .hero-desc  { font-size: 14px; max-width: 100%; margin-bottom: 24px; }
        .hero-btns  { justify-content: center; margin-bottom: 16px; width: 100%; }
        .btn-primary, .btn-secondary { padding: 12px 24px; font-size: 14px; }
        
        .hero-char-img {
          max-width: 280px;
          -webkit-mask-image: linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) 15%, black 35%);
          mask-image: linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) 15%, black 35%);
        }

        /* Mengunci Blob agar tidak bocor menabrak section Kontak */
        .blob1 { width: 220px; height: 220px; top: -40px; right: -40px; }
        .blob2 { width: 160px; height: 160px; bottom: 0; left: -40px; }
        .blob3 { display: none; }

        .contact-section { padding: 48px 20px; }
        .contact-grid { grid-template-columns: 1fr; gap: 24px; }
        .contact-card { padding: 24px 20px; }
        .map-wrap { height: 280px; width: 100%; }

        .footer { padding: 20px; font-size: 12px; }
      }

      /* SMALL MOBILE (Layar Kecil / iPhone Lama) */
      @media (max-width: 400px) {
        .hero-title { font-size: 24px; }
        .hero-badge { font-size: 11px; padding: 6px 14px; }
        .hero-char-img { max-width: 220px; }
        .hero-btns { flex-direction: column; width: 100%; gap: 10px; }
        .btn-primary, .btn-secondary { width: 100%; text-align: center; box-sizing: border-box; }
        .contact-card { padding: 20px 16px; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Fungsi memicu animasi sapuan horizontal ke kanan, lalu berpindah halaman
  const handleNavigateToLogin = () => {
    setMenuOpen(false);
    setIsTransitioning(true);
    setTimeout(() => {
      router.push("/login");
    }, 450); 
  };

  function scrollTo(id) {
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }

  const IconInstagram = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );

  const IconFacebook = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  const IconYoutube = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );

  const socialMedias = [
    {
      icon: <IconInstagram />,
      iconClass: "social-icon social-icon-ig",
      label: "Instagram",
      handle: "@tarmub_sumberjo",
      href: "https://instagram.com/tarmub_sumberjo",
    },
    {
      icon: <IconFacebook />,
      iconClass: "social-icon social-icon-fb",
      label: "Facebook",
      handle: "tarmub_sumberjo",
      href: "https://facebook.com/tarmub_sumberjo",
    },
    {
      icon: <IconYoutube />,
      iconClass: "social-icon social-icon-yt",
      label: "YouTube",
      handle: "Santri Tarbiyah",
      href: "https://youtube.com/@SantriTarbiyah",
    },
  ];

  return (
    <div>
      {/* OVERLAY HIT BOX ANIMASI TRANSISI HORIZONTAL */}
      <div className={`page-transition-overlay ${isTransitioning ? "active" : ""}`} />

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
          <button className="nav-login-btn" onClick={handleNavigateToLogin}>Login</button>
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
        <button className="mobile-login-btn" onClick={handleNavigateToLogin}>🚀 Login Sekarang</button>
      </div>

      {/* HERO */}
      <section id="beranda" className="hero">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
        <div className="hero-grid">

          {/* TEKS KIRI */}
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
              <button className="btn-primary" onClick={handleNavigateToLogin}>🚀 Login Sekarang</button>
              <button className="btn-secondary" onClick={() => scrollTo("kontak")}>📞 Hubungi Kami</button>
            </div>
          </div>

          {/* GAMBAR KARAKTER SANTRI - KANAN */}
          <div className="hero-right hero-logo-anim">
            <img
              className="hero-char-img float-char"
              src="/logo-sibatamu.png"
              alt="Santri Madrasah Tarbiyatul Mubalighin Sumberjo"
              onError={e => e.target.style.display = "none"}
            />
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

            {/* SOSIAL MEDIA */}
            <div className="contact-item">
              <div className="contact-icon">📲</div>
              <div style={{ width: "100%" }}>
                <p className="contact-label">Media Sosial</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {socialMedias.map((s, i) => (
                    <a key={i} href={s.href} target="_blank" rel="noreferrer" className="social-link">
                      <span className={s.iconClass}>
                        {s.icon}
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{s.label}</span>
                        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>{s.handle}</span>
                      </span>
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