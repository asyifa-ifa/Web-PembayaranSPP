import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:ital,wght@0,600;0,700;1,600&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; font-size: 16px; }
      body {
        overflow-x: hidden;
        font-family: 'Plus Jakarta Sans', sans-serif;
        background: #f7fdf9;
        color: #1a2e1f;
        -webkit-font-smoothing: antialiased;
      }

      /* ── ANIMATIONS ── */
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(32px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(-1deg); }
        50%       { transform: translateY(-14px) rotate(1deg); }
      }
      @keyframes shimmer {
        0%   { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes pulse-ring {
        0%   { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-12px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .anim-1 { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.1s both; }
      .anim-2 { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.25s both; }
      .anim-3 { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.4s both; }
      .anim-4 { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.55s both; }
      .anim-img { animation: fadeIn 0.9s ease 0.3s both; }
      .float-img { animation: float 6s ease-in-out infinite; }

      /* ── NAVBAR ── */
      .navbar {
        position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
        display: flex; justify-content: space-between; align-items: center;
        padding: 0 clamp(16px, 5vw, 64px);
        height: 64px;
        transition: all 0.3s ease;
      }
      .navbar.scrolled {
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(16px);
        box-shadow: 0 2px 24px rgba(20,83,45,0.08);
      }
      .navbar:not(.scrolled) {
        background: transparent;
      }

      .nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
      .nav-logo-img { height: 36px; width: auto; object-fit: contain; }
      .nav-brand-text { display: flex; flex-direction: column; line-height: 1.1; }
      .nav-brand-name {
        font-family: 'Lora', serif;
        font-weight: 700; font-size: 15px; color: #14532d;
      }
      .nav-brand-sub { font-size: 10px; color: #6b7280; font-weight: 500; }

      .nav-links { display: flex; align-items: center; gap: 8px; }
      .nav-link {
        padding: 8px 16px; border-radius: 8px;
        border: none; background: none;
        font-family: inherit; font-size: 14px; font-weight: 600;
        color: #374151; cursor: pointer; transition: all 0.15s;
      }
      .nav-link:hover { background: #f0fdf4; color: #14532d; }
      .nav-cta {
        padding: 10px 22px; border-radius: 10px; border: none;
        background: linear-gradient(135deg, #14532d 0%, #22c55e 100%);
        color: white; font-family: inherit; font-size: 14px; font-weight: 700;
        cursor: pointer; transition: all 0.2s;
        box-shadow: 0 4px 16px rgba(34,197,94,0.3);
      }
      .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(34,197,94,0.4); }

      .hamburger {
        display: none; flex-direction: column; justify-content: center;
        gap: 5px; width: 40px; height: 40px;
        background: none; border: none; cursor: pointer; padding: 8px;
        border-radius: 8px; transition: background 0.15s;
      }
      .hamburger:hover { background: #f0fdf4; }
      .hamburger span {
        display: block; height: 2px; background: #14532d;
        border-radius: 2px; transition: all 0.3s;
        transform-origin: center;
      }
      .hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
      .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
      .hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

      /* ── MOBILE DRAWER ── */
      .drawer-overlay {
        display: none; position: fixed; inset: 0; z-index: 998;
        background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
      }
      .drawer-overlay.open { display: block; animation: fadeIn 0.2s ease; }
      .drawer {
        position: fixed; top: 0; right: -100%; width: min(80vw, 300px);
        height: 100%; z-index: 999; background: #fff;
        padding: 80px 24px 32px;
        display: flex; flex-direction: column; gap: 8px;
        transition: right 0.35s cubic-bezier(.4,0,.2,1);
        box-shadow: -8px 0 40px rgba(0,0,0,0.12);
      }
      .drawer.open { right: 0; }
      .drawer-link {
        width: 100%; padding: 14px 16px; border-radius: 10px;
        border: none; background: none;
        font-family: inherit; font-size: 15px; font-weight: 600;
        color: #374151; cursor: pointer; text-align: left;
        transition: all 0.15s;
      }
      .drawer-link:hover { background: #f0fdf4; color: #14532d; }
      .drawer-cta {
        margin-top: 8px; padding: 14px 16px; border-radius: 12px; border: none;
        background: linear-gradient(135deg, #14532d, #22c55e);
        color: white; font-family: inherit; font-size: 15px; font-weight: 700;
        cursor: pointer; text-align: center;
        box-shadow: 0 4px 16px rgba(34,197,94,0.3);
      }
      .drawer-divider { height: 1px; background: #f3f4f6; margin: 4px 0; }

      /* ── HERO ── */
      .hero {
        min-height: 100vh;
        padding-top: 64px;
        background: linear-gradient(160deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%);
        position: relative; overflow: hidden;
        display: flex; align-items: center;
      }

      /* decorative blobs */
      .blob {
        position: absolute; border-radius: 50%;
        pointer-events: none; z-index: 0;
      }
      .blob-1 {
        width: clamp(300px, 50vw, 700px);
        height: clamp(300px, 50vw, 700px);
        top: -15%; right: -10%;
        background: radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%);
      }
      .blob-2 {
        width: clamp(200px, 35vw, 500px);
        height: clamp(200px, 35vw, 500px);
        bottom: -10%; left: -8%;
        background: radial-gradient(circle, rgba(20,83,45,0.1) 0%, transparent 70%);
      }
      .blob-3 {
        width: clamp(100px, 20vw, 280px);
        height: clamp(100px, 20vw, 280px);
        top: 30%; left: 35%;
        background: radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%);
      }

      /* decorative ring */
      .deco-ring {
        position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
        border: 1.5px solid rgba(34,197,94,0.2);
      }
      .ring-1 { width: 120px; height: 120px; top: 15%; right: 18%; animation: spin-slow 20s linear infinite; }
      .ring-2 { width: 60px; height: 60px; bottom: 25%; left: 12%; animation: spin-slow 14s linear infinite reverse; }

      .hero-inner {
        position: relative; z-index: 1;
        width: 100%; max-width: 1200px;
        margin: 0 auto;
        padding: clamp(32px, 6vw, 80px) clamp(16px, 5vw, 64px);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: clamp(32px, 5vw, 80px);
        align-items: center;
      }

      .hero-left { display: flex; flex-direction: column; gap: 20px; }

      .hero-badge {
        display: inline-flex; align-items: center; gap: 8px;
        background: linear-gradient(135deg, #14532d, #166534);
        padding: 8px 18px; border-radius: 50px;
        color: white; font-size: 12px; font-weight: 700;
        letter-spacing: 0.5px; width: fit-content;
        box-shadow: 0 4px 16px rgba(20,83,45,0.25);
        position: relative;
      }
      .hero-badge::before {
        content: '';
        position: absolute; inset: -2px; border-radius: 52px;
        background: linear-gradient(135deg, rgba(34,197,94,0.4), transparent);
        z-index: -1;
      }
      .badge-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #4ade80; position: relative;
      }
      .badge-dot::after {
        content: ''; position: absolute; inset: -3px; border-radius: 50%;
        background: rgba(74,222,128,0.4);
        animation: pulse-ring 1.5s ease-out infinite;
      }

      .hero-title {
        font-family: 'Lora', serif;
        font-size: clamp(28px, 4.5vw, 56px);
        font-weight: 700; line-height: 1.15;
        color: #0f2415;
      }
      .hero-accent {
        background: linear-gradient(135deg, #14532d, #22c55e);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero-desc {
        font-size: clamp(14px, 1.5vw, 16px);
        color: #4b5563; line-height: 1.85;
        max-width: 480px;
      }

      .hero-stats {
        display: flex; gap: clamp(16px, 3vw, 32px);
        flex-wrap: wrap;
      }
      .stat-item { display: flex; flex-direction: column; gap: 2px; }
      .stat-num {
        font-family: 'Lora', serif;
        font-size: clamp(20px, 2.5vw, 28px);
        font-weight: 700; color: #14532d;
      }
      .stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
      .stat-divider { width: 1px; background: #d1fae5; align-self: stretch; }

      .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
      .btn-primary {
        display: inline-flex; align-items: center; gap: 8px;
        padding: clamp(12px, 1.5vw, 15px) clamp(20px, 2.5vw, 30px);
        background: linear-gradient(135deg, #14532d 0%, #16a34a 100%);
        border: none; color: white; border-radius: 12px;
        font-family: inherit; font-weight: 700;
        font-size: clamp(13px, 1.2vw, 15px);
        cursor: pointer; transition: all 0.2s;
        box-shadow: 0 6px 20px rgba(20,83,45,0.3);
      }
      .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(20,83,45,0.4); }
      .btn-primary:active { transform: translateY(0); }

      .btn-secondary {
        display: inline-flex; align-items: center; gap: 8px;
        padding: clamp(12px, 1.5vw, 15px) clamp(20px, 2.5vw, 30px);
        border: 2px solid #14532d; border-radius: 12px;
        background: rgba(255,255,255,0.8); color: #14532d;
        font-family: inherit; font-weight: 700;
        font-size: clamp(13px, 1.2vw, 15px);
        cursor: pointer; transition: all 0.2s;
        backdrop-filter: blur(8px);
      }
      .btn-secondary:hover { background: #f0fdf4; transform: translateY(-2px); }

      /* hero image */
      .hero-right {
        display: flex; justify-content: center; align-items: flex-end;
        position: relative;
      }
      .hero-img-wrap {
        position: relative; width: 100%; max-width: 520px;
      }
      .hero-img-bg {
        position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
        width: 90%; height: 85%;
        background: radial-gradient(ellipse at bottom, rgba(34,197,94,0.15) 0%, transparent 70%);
        border-radius: 50%;
        filter: blur(24px);
      }
      .hero-img {
        width: 100%; height: auto;
        object-fit: contain; object-position: bottom;
        display: block; position: relative; z-index: 1;
        -webkit-mask-image: linear-gradient(to bottom, black 0%, black 65%, rgba(0,0,0,0.4) 85%, transparent 100%);
        mask-image: linear-gradient(to bottom, black 0%, black 65%, rgba(0,0,0,0.4) 85%, transparent 100%);
        filter: drop-shadow(0 -4px 24px rgba(20,83,45,0.12));
      }

      /* floating cards */
      .float-card {
        position: absolute; z-index: 2;
        background: rgba(255,255,255,0.9);
        backdrop-filter: blur(12px);
        border-radius: 14px; padding: 12px 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        border: 1px solid rgba(255,255,255,0.8);
        display: flex; align-items: center; gap: 10px;
        animation: fadeUp 0.8s ease both;
      }
      .fc-left { left: -16px; top: 28%; animation-delay: 0.6s; }
      .fc-right { right: -8px; bottom: 28%; animation-delay: 0.8s; }
      .fc-icon { font-size: 24px; flex-shrink: 0; }
      .fc-label { font-size: 10px; color: #6b7280; font-weight: 600; }
      .fc-val { font-size: 15px; font-weight: 800; color: #14532d; }

      /* ── FEATURES STRIP ── */
      .features {
        background: #fff;
        padding: clamp(40px, 6vw, 80px) clamp(16px, 5vw, 64px);
      }
      .features-inner {
        max-width: 1100px; margin: 0 auto;
      }
      .section-tag {
        display: inline-block;
        background: #dcfce7; color: #14532d;
        padding: 5px 14px; border-radius: 20px;
        font-size: 12px; font-weight: 700; margin-bottom: 12px;
      }
      .section-title {
        font-family: 'Lora', serif;
        font-size: clamp(22px, 3vw, 36px);
        font-weight: 700; color: #0f2415;
        margin-bottom: 8px;
      }
      .section-sub {
        font-size: clamp(13px, 1.3vw, 15px);
        color: #6b7280; margin-bottom: clamp(28px, 4vw, 48px);
        max-width: 520px;
      }
      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
        gap: clamp(14px, 2vw, 24px);
      }
      .feat-card {
        padding: clamp(20px, 2.5vw, 28px);
        border-radius: 16px; border: 1px solid #e9f5ec;
        background: linear-gradient(135deg, #f9fefb, #f0fdf4);
        transition: all 0.2s;
      }
      .feat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(20,83,45,0.1); border-color: #bbf7d0; }
      .feat-icon {
        width: 48px; height: 48px; border-radius: 14px;
        background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; margin-bottom: 14px;
      }
      .feat-title { font-size: 15px; font-weight: 700; color: #0f2415; margin-bottom: 6px; }
      .feat-desc { font-size: 13px; color: #6b7280; line-height: 1.7; }

      /* ── CONTACT ── */
      .contact {
        padding: clamp(40px, 6vw, 80px) clamp(16px, 5vw, 64px);
        background: linear-gradient(160deg, #f7fdf9 0%, #f0fdf4 100%);
      }
      .contact-inner { max-width: 1100px; margin: 0 auto; }
      .contact-grid {
        display: grid;
        grid-template-columns: 1fr 1.3fr;
        gap: clamp(20px, 3vw, 40px);
        margin-top: clamp(28px, 4vw, 48px);
      }
      .contact-card {
        background: #fff; border-radius: 20px;
        padding: clamp(20px, 3vw, 36px);
        box-shadow: 0 4px 24px rgba(20,83,45,0.07);
        border: 1px solid #e9f5ec;
        display: flex; flex-direction: column; gap: 20px;
      }
      .contact-item { display: flex; gap: 14px; align-items: flex-start; }
      .contact-icon {
        width: 42px; height: 42px; min-width: 42px;
        background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        border-radius: 12px; display: flex;
        align-items: center; justify-content: center;
        font-size: 18px; flex-shrink: 0;
      }
      .contact-label {
        font-size: 10px; font-weight: 700; color: #9ca3af;
        text-transform: uppercase; letter-spacing: 0.6px;
        margin-bottom: 3px;
      }
      .contact-val { font-size: 13px; color: #1a2e1f; font-weight: 500; line-height: 1.6; }
      .contact-divider { height: 1px; background: #f0f5f1; }

      .social-links { display: flex; flex-direction: column; gap: 8px; }
      .social-link {
        display: flex; align-items: center; gap: 10px;
        text-decoration: none; padding: 8px 10px; border-radius: 10px;
        transition: background 0.15s;
      }
      .social-link:hover { background: #f0fdf4; }
      .social-icon {
        width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
      }
      .si-ig  { background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
      .si-fb  { background: #1877f2; }
      .si-yt  { background: #ff0000; }
      .social-name { font-size: 13px; font-weight: 700; color: #1a2e1f; }
      .social-handle { font-size: 11px; color: #6b7280; }

      .map-wrap {
        border-radius: 20px; overflow: hidden;
        height: clamp(260px, 40vw, 420px);
        box-shadow: 0 4px 24px rgba(20,83,45,0.08);
        border: 1px solid #e9f5ec;
      }
      .map-wrap iframe { width: 100%; height: 100%; border: 0; display: block; }

      /* ── FOOTER ── */
      .footer {
        background: #0a1f10;
        color: #6b7280; padding: clamp(24px, 3vw, 40px) clamp(16px, 5vw, 64px);
        text-align: center;
      }
      .footer-inner { max-width: 1100px; margin: 0 auto; }
      .footer-brand {
        font-family: 'Lora', serif;
        font-size: 18px; font-weight: 700; color: #4ade80; margin-bottom: 6px;
      }
      .footer-sub { font-size: 12px; color: #4b5563; margin-bottom: 16px; }
      .footer-divider { height: 1px; background: #1f3527; margin-bottom: 16px; }
      .footer-copy { font-size: 12px; color: #374151; }

      /* ── RESPONSIVE ── */
      @media (max-width: 1024px) {
        .hero-inner { gap: clamp(24px, 4vw, 48px); }
        .fc-left { left: -8px; }
        .fc-right { right: -4px; }
      }

      @media (max-width: 768px) {
        .nav-links { display: none; }
        .hamburger { display: flex; }

        .hero-inner {
          grid-template-columns: 1fr;
          text-align: center;
          padding-top: clamp(20px, 5vw, 40px);
        }
        .hero-left { align-items: center; order: 2; }
        .hero-right { order: 1; }
        .hero-desc { max-width: 100%; }
        .hero-badge { margin: 0 auto; }
        .hero-btns { justify-content: center; }
        .hero-stats { justify-content: center; }
        .hero-img-wrap { max-width: 340px; }

        .fc-left { left: 0; top: auto; bottom: 60%; }
        .fc-right { right: 0; }

        .contact-grid { grid-template-columns: 1fr; }

        .deco-ring { display: none; }
      }

      @media (max-width: 480px) {
        .hero-img-wrap { max-width: 260px; }
        .float-card { display: none; }
        .hero-stats { gap: 16px; }
        .stat-divider { display: none; }
      }

      @media (max-width: 360px) {
        .hero-title { font-size: 24px; }
        .hero-img-wrap { max-width: 220px; }
        .btn-primary, .btn-secondary { padding: 11px 18px; font-size: 13px; }
      }

      /* Prevent layout shift on very large screens */
      @media (min-width: 1400px) {
        .hero-inner { max-width: 1280px; }
        .hero-title { font-size: 60px; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  function scrollTo(id) {
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const features = [
    { icon: "💳", title: "Pembayaran Digital", desc: "Bayar SPP kapan saja dan di mana saja melalui berbagai metode pembayaran yang aman dan terpercaya." },
    { icon: "📊", title: "Laporan Realtime", desc: "Admin dapat memantau seluruh transaksi dan riwayat pembayaran secara langsung dan akurat." },
    { icon: "🔔", title: "Notifikasi Otomatis", desc: "Santri mendapat pengingat tagihan dan konfirmasi pembayaran melalui email secara otomatis." },
    { icon: "🔒", title: "Aman & Terpercaya", desc: "Sistem keamanan berlapis dengan enkripsi data dan verifikasi pembayaran melalui Midtrans." },
    { icon: "📱", title: "Ramah Mobile", desc: "Tampilan responsif yang nyaman digunakan dari smartphone, tablet, maupun komputer." },
    { icon: "🧾", title: "Cetak Kwitansi", desc: "Kwitansi pembayaran dapat dicetak langsung dari sistem sebagai bukti pembayaran resmi." },
  ];

  const contacts = [
    { icon: "📍", label: "Alamat", val: "Ds. Sumberjo, Kec. Sanankulon,\nKab. Blitar, Jawa Timur" },
    { icon: "📧", label: "Email", val: "madrasahtaribiyatulsumberjo@gmail.com" },
    { icon: "📱", label: "Telepon / WhatsApp", val: "08xxxxxxxxxx" },
  ];

  const socials = [
    { cls: "si-ig", label: "Instagram", handle: "@tarmub_sumberjo", href: "https://instagram.com/tarmub_sumberjo", icon: <IgIcon /> },
    { cls: "si-fb", label: "Facebook", handle: "tarmub_sumberjo", href: "https://facebook.com/tarmub_sumberjo", icon: <FbIcon /> },
    { cls: "si-yt", label: "YouTube", handle: "Santri Tarbiyah", href: "https://youtube.com/@SantriTarbiyah", icon: <YtIcon /> },
  ];

  return (
    <div>
      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-brand">
          <img src="/logo-sibatamu.png" alt="logo" className="nav-logo-img"
            onError={e => e.target.style.display = "none"} />
          <div className="nav-brand-text">
            <span className="nav-brand-name">SIBATAMU-SPP</span>
            <span className="nav-brand-sub">Madrasah Tarbiyatul Mubalighin</span>
          </div>
        </div>

        <div className="nav-links">
          <button className="nav-link" onClick={() => scrollTo("beranda")}>Beranda</button>
          <button className="nav-link" onClick={() => scrollTo("fitur")}>Fitur</button>
          <button className="nav-link" onClick={() => scrollTo("kontak")}>Kontak</button>
          <button className="nav-cta" onClick={() => router.push("/login")}>🚀 Login</button>
        </div>

        <button className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(o => !o)} aria-label="menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* MOBILE DRAWER */}
      <div className={`drawer-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
      <div className={`drawer ${menuOpen ? "open" : ""}`}>
        <button className="drawer-link" onClick={() => scrollTo("beranda")}>🏠 Beranda</button>
        <button className="drawer-link" onClick={() => scrollTo("fitur")}>✨ Fitur</button>
        <button className="drawer-link" onClick={() => scrollTo("kontak")}>📞 Kontak</button>
        <div className="drawer-divider" />
        <button className="drawer-cta" onClick={() => { setMenuOpen(false); router.push("/login"); }}>
          🚀 Login Sekarang
        </button>
      </div>

      {/* HERO */}
      <section id="beranda" className="hero">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="deco-ring ring-1" />
        <div className="deco-ring ring-2" />

        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-badge anim-1">
              <span className="badge-dot" />
              SISTEM TERPERCAYA & MODERN
            </div>

            <h1 className="hero-title anim-2">
              Kelola Pembayaran<br />
              <span className="hero-accent">SPP Lebih Mudah</span>
            </h1>

            <p className="hero-desc anim-3">
              Platform pembayaran SPP digital yang transparan, efisien, dan mudah
              digunakan untuk seluruh civitas Madrasah Tarbiyatul Mubalighin Sumberjo.
            </p>

            <div className="hero-stats anim-3">
              <div className="stat-item">
                <span className="stat-num">100%</span>
                <span className="stat-label">Digital</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-num">Realtime</span>
                <span className="stat-label">Konfirmasi</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-num">Aman</span>
                <span className="stat-label">Terenkripsi</span>
              </div>
            </div>

            <div className="hero-btns anim-4">
              <button className="btn-primary" onClick={() => router.push("/login")}>
                🚀 Login Sekarang
              </button>
              <button className="btn-secondary" onClick={() => scrollTo("kontak")}>
                📞 Hubungi Kami
              </button>
            </div>
          </div>

          <div className="hero-right anim-img">
            <div className="hero-img-wrap">
              <div className="hero-img-bg" />
              <img
                className="hero-img float-img"
                src="/gambar-santri.png"
                alt="Santri Madrasah"
                onError={e => e.target.style.display = "none"}
              />
              {/* Floating info cards */}
              <div className="float-card fc-left">
                <span className="fc-icon">✅</span>
                <div>
                  <div className="fc-label">Status</div>
                  <div className="fc-val">Pembayaran Sukses</div>
                </div>
              </div>
              <div className="float-card fc-right">
                <span className="fc-icon">💳</span>
                <div>
                  <div className="fc-label">Metode</div>
                  <div className="fc-val">Transfer / QRIS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fitur" className="features">
        <div className="features-inner">
          <div className="section-tag">✨ Keunggulan</div>
          <h2 className="section-title">Fitur Lengkap untuk Semua</h2>
          <p className="section-sub">Dirancang khusus untuk kemudahan pengelolaan SPP di lingkungan madrasah.</p>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feat-card">
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="kontak" className="contact">
        <div className="contact-inner">
          <div className="section-tag">📞 Kontak</div>
          <h2 className="section-title">Hubungi Kami</h2>
          <p className="section-sub">Kami siap membantu Anda. Jangan ragu untuk menghubungi kami.</p>
          <div className="contact-grid">
            <div className="contact-card">
              {contacts.map((c, i) => (
                <div key={i} className="contact-item">
                  <div className="contact-icon">{c.icon}</div>
                  <div>
                    <div className="contact-label">{c.label}</div>
                    <div className="contact-val" style={{ whiteSpace: "pre-line" }}>{c.val}</div>
                  </div>
                </div>
              ))}
              <div className="contact-divider" />
              <div className="contact-item">
                <div className="contact-icon">📲</div>
                <div style={{ width: "100%" }}>
                  <div className="contact-label">Media Sosial</div>
                  <div className="social-links">
                    {socials.map((s, i) => (
                      <a key={i} href={s.href} target="_blank" rel="noreferrer" className="social-link">
                        <span className={`social-icon ${s.cls}`}>{s.icon}</span>
                        <div>
                          <div className="social-name">{s.label}</div>
                          <div className="social-handle">{s.handle}</div>
                        </div>
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
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">SIBATAMU-SPP</div>
          <div className="footer-sub">Madrasah Tarbiyatul Mubalighin Sumberjo</div>
          <div className="footer-divider" />
          <div className="footer-copy">🌿 © 2026 Madrasah Tarbiyatul Mubalighin Sumberjo. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function IgIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function FbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
function YtIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}