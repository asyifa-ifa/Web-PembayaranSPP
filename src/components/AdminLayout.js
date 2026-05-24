// src/components/AdminLayout.js
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";

// DEFINE PROFESIONAL SVG ICONS FOR SIDEBAR
const ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  students: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  ustadz: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-10-10-10z" />
    </svg>
  ),
  accounts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  paymentTypes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  ),
  payments: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  manual: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  pengeluaran: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="23" y1="18" x2="1" y2="18" /><polyline points="17 6 23 12 17 18" /><polyline points="7 12 1 12 7 18" />
    </svg>
  ),
  notifications: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  reports: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  dot: (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
      <circle cx="4" cy="4" r="3" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
};

const menuItems = [
  { href: "/admin/dashboard",       icon: ICONS.dashboard,    label: "Dashboard" },
  { href: "/admin/students",        icon: ICONS.students,     label: "Data Santri" },
  { href: "/admin/ustadz",          icon: ICONS.ustadz,       label: "Data Ustadz" },
  { href: "/admin/accounts",        icon: ICONS.accounts,     label: "Akun Santri" },
  { href: "/admin/payment-types",   icon: ICONS.paymentTypes,  label: "Jenis Tagihan" },
  { href: "/admin/payments",        icon: ICONS.payments,     label: "Pembayaran Santri" },
  { href: "/admin/payments/manual", icon: ICONS.manual,       label: "Pembayaran Tunai" },
  { href: "/admin/pengeluaran",     icon: ICONS.pengeluaran,  label: "Pengeluaran" },
  { href: "/admin/notifications",   icon: ICONS.notifications, label: "Notifikasi Email" },
];

const laporanItems = [
  { href: "/admin/reports/rekap-pembayaran",   icon: ICONS.dot, label: "Rekap Pembayaran" },
  { href: "/admin/reports/rekap-santri",       icon: ICONS.dot, label: "Rekap Santri" },
  { href: "/admin/reports/absensi",            icon: ICONS.dot, label: "Absensi Santri" },
];

const topbarTitles = {
  "/admin/dashboard":                  "Dashboard Overview",
  "/admin/students":                   "Manajemen Data Santri",
  "/admin/ustadz":                     "Manajemen Data Ustadz",
  "/admin/accounts":                   "Pengaturan Akun Santri",
  "/admin/payment-types":              "Konfigurasi Jenis Tagihan",
  "/admin/payments":                   "Catatan Pembayaran Santri",
  "/admin/payments/manual":            "Entri Pembayaran Tunai",
  "/admin/pengeluaran":                "Log Pengeluaran Kas",
  "/admin/notifications":              "Pusat Notifikasi Email",
  "/admin/reports":                    "Laporan & Rekapitulasi",
  "/admin/reports/rekap-pembayaran":   "Laporan Rekap Pembayaran",
  "/admin/reports/rekap-santri":       "Laporan Rekapitulasi Santri",
  "/admin/reports/absensi":            "Laporan Absensi Santri",
};

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(false);
  const [openLaporan, setOpenLaporan] = useState(false);

  if (status === "loading") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f6f8f6", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div className="spinner" />
        <p style={{ color:"#14532d", fontSize:13, fontWeight:600, marginTop:16, letterSpacing:"0.05em" }}>MEMUAT SISTEM...</p>
      </div>
      <style jsx>{`
        .spinner { width: 32px; height: 32px; border: 3px solid #e2ece2; border-top-color: #14532d; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  if (!session) { router.push("/login"); return null; }

  const currentPath = router.pathname;
  const isLaporanActive = currentPath.startsWith("/admin/reports");

  const getTitle = () => {
    if (topbarTitles[currentPath]) return topbarTitles[currentPath];
    const match = Object.keys(topbarTitles)
      .sort((a, b) => b.length - a.length)
      .find(k => currentPath.startsWith(k + "/"));
    return match ? topbarTitles[match] : "Admin Panel";
  };

  return (
    <>
      <style global jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f6f8f6; -webkit-font-smoothing: antialiased; }

        .admin-layout { display: flex; min-height: 100vh; }

        .sidebar {
          width: 260px; min-width: 260px; background: #ffffff;
          border-right: 1px solid #eef2ee; display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; height: 100vh; overflow-y: auto;
          z-index: 50; transition: transform 0.3s cubic-bezier(.16,1,0.3,1);
          box-shadow: 4px 0 24px rgba(20,83,45,0.03);
        }

        .sidebar-brand {
          padding: 24px 22px; border-bottom: 1px solid #f4f7f4;
          display: flex; align-items: center; gap: 12px;
        }

        .brand-logo { width: 38px; height: 38px; object-fit: contain; }

        .brand-logo-fallback {
          width: 38px; height: 38px;
          background: linear-gradient(135deg,#14532d,#1e6b3c);
          border-radius: 10px; display: flex; align-items: center;
          justify-content: center; color: white; font-size: 16px; flex-shrink: 0;
        }

        .brand-text { display: flex; flex-direction: column; line-height: 1.25; }
        .brand-name { font-size: 14px; font-weight: 800; color: #14532d; letter-spacing: -0.3px; }
        .brand-sub { font-size: 11px; color: #869286; font-weight: 500; }

        .sidebar-nav { flex: 1; padding: 20px 14px; display: flex; flex-direction: column; gap: 4px; }

        .nav-section-label {
          font-size: 10px; font-weight: 700; color: #a2b0a2;
          text-transform: uppercase; letter-spacing: 1px; padding: 14px 10px 6px;
        }

        .nav-item {
          display: flex; align-items: center; gap: 12px; padding: 11px 14px;
          border-radius: 10px; color: #556055; font-size: 13.5px; font-weight: 500;
          text-decoration: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
          border: none; background: transparent; width: 100%; text-align: left;
        }
        .nav-item:hover { background: #f4f8f4; color: #14532d; }
        .nav-item.active {
          background: #14532d;
          color: #ffffff; font-weight: 600;
          box-shadow: 0 4px 12px rgba(20,83,45,0.15);
        }

        .nav-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; opacity: 0.8; }
        .nav-item.active .nav-icon { opacity: 1; }

        .nav-parent {
          display: flex; align-items: center; gap: 12px; padding: 11px 14px;
          border-radius: 10px; color: #556055; font-size: 13.5px; font-weight: 500;
          cursor: pointer; border: none; background: transparent; width: 100%;
          text-align: left; transition: all 0.2s; justify-content: space-between;
        }
        .nav-parent:hover { background: #f4f8f4; color: #14532d; }
        .nav-parent.active {
          background: #e9f0e9; color: #14532d; font-weight: 600;
        }

        .nav-parent-left { display: flex; align-items: center; gap: 12px; }
        .nav-arrow { font-size: 9px; color: #869286; transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .nav-arrow.open { transform: rotate(180deg); }

        .submenu {
          display: flex; flex-direction: column; gap: 2px;
          margin-left: 20px; padding-left: 8px; border-left: 1px dashed #cedbd0;
          overflow: hidden; max-height: 0; transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .submenu.open { max-height: 400px; margin-top: 4px; margin-bottom: 4px; }

        .submenu-item {
          display: flex; align-items: center; gap: 10px; padding: 8px 14px;
          border-radius: 8px; color: #667566; font-size: 13px; font-weight: 500;
          text-decoration: none; transition: all 0.15s ease;
        }
        .submenu-item:hover { background: #f4f8f4; color: #14532d; }
        .submenu-item.active { background: #e9f0e9; color: #14532d; font-weight: 600; }
        .submenu-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        .sidebar-footer { padding: 18px 14px; border-top: 1px solid #f4f7f4; background: #fafbfa; }

        .user-card {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          background: #ffffff; border-radius: 12px; margin-bottom: 12px;
          border: 1px solid #eef2ee;
        }
        .user-avatar {
          width: 36px; height: 36px;
          background: linear-gradient(135deg,#14532d,#22c55e);
          border-radius: 10px; display: flex; align-items: center;
          justify-content: center; color: white; font-weight: 700; font-size: 14px; flex-shrink: 0;
        }
        .user-info { flex: 1; overflow: hidden; }
        .user-name { font-size: 13px; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-role { font-size: 11px; color: #869286; font-weight: 500; margin-top: 1px; }

        .logout-btn {
          width: 100%; padding: 11px; background: #fff1f2; border: 1px solid #ffe4e6;
          color: #e11d48; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .logout-btn:hover { background: #ffe4e6; border-color: #fecdd3; transform: translateY(-1px); }

        .main-content { flex: 1; margin-left: 260px; min-height: 100vh; background: #f6f8f6; }

        .topbar {
          background: #ffffff; border-bottom: 1px solid #eef2ee;
          padding: 0 40px; height: 64px; display: flex; align-items: center;
          justify-content: space-between; position: sticky; top: 0; z-index: 40;
          box-shadow: 0 1px 4px rgba(20,83,45,0.01);
        }
        .topbar-left { display: flex; align-items: center; gap: 16px; }
        .hamburger {
          display: none; background: #f4f8f4; border: 1px solid #d8ebd8;
          color: #14532d; width: 38px; height: 38px; border-radius: 10px;
          font-size: 20px; cursor: pointer; align-items: center; justify-content: center;
        }
        .topbar-title { font-size: 16px; font-weight: 700; color: #111827; letter-spacing: -0.2px; }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .topbar-date {
          font-size: 12.5px; color: #556055; background: #f4f8f4;
          border: 1px solid #e9f0e9; padding: 6px 14px; border-radius: 8px; font-weight: 600;
        }

        .page-content { padding: 32px 40px; }

        .overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(15,33,15,0.2); z-index: 40; backdrop-filter: blur(4px);
        }

        @media (max-width: 1024px) {
          .sidebar { transform: translateX(-100%); box-shadow: none; }
          .sidebar.show { transform: translateX(0); box-shadow: 12px 0 40px rgba(0,0,0,0.1); }
          .main-content { margin-left: 0; }
          .hamburger { display: flex; }
          .overlay.show { display: block; }
          .topbar { padding: 0 20px; }
          .page-content { padding: 24px 20px; }
        }
      `}</style>

      <div className="admin-layout">
        <div className={`overlay ${openMenu ? "show" : ""}`} onClick={() => setOpenMenu(false)} />

        <aside className={`sidebar ${openMenu ? "show" : ""}`}>
          <div className="sidebar-brand">
            <img src="/logo-sibatamu.png" alt="logo" className="brand-logo"
              onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
            <div className="brand-logo-fallback" style={{ display:"none" }}>🌿</div>
            <div className="brand-text">
              <span className="brand-name">SIBATAMU-SPP</span>
              <span className="brand-sub">Tarbiyatul Mubalighin</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {/* MENU UTAMA */}
            <span className="nav-section-label">Menu Utama</span>
            {menuItems.slice(0, 3).map(item => (
              <a key={item.href} href={item.href}
                className={`nav-item ${currentPath === item.href || currentPath.startsWith(item.href + "/") ? "active" : ""}`}
                onClick={() => setOpenMenu(false)}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            ))}

            {/* KEUANGAN */}
            <span className="nav-section-label" style={{ marginTop:12 }}>Keuangan</span>
            {menuItems.slice(3, 8).map(item => (
              <a key={item.href} href={item.href}
                className={`nav-item ${currentPath === item.href || currentPath.startsWith(item.href + "/") ? "active" : ""}`}
                onClick={() => setOpenMenu(false)}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            ))}

            {/* LAINNYA */}
            <span className="nav-section-label" style={{ marginTop:12 }}>Lainnya</span>

            <a href="/admin/notifications"
              className={`nav-item ${currentPath === "/admin/notifications" ? "active" : ""}`}
              onClick={() => setOpenMenu(false)}>
              <span className="nav-icon">{ICONS.notifications}</span>
              Notifikasi Email
            </a>

            <button
              className={`nav-parent ${isLaporanActive ? "active" : ""}`}
              onClick={() => setOpenLaporan(prev => !prev)}>
              <div className="nav-parent-left">
                <span className="nav-icon">{ICONS.reports}</span>
                Laporan
              </div>
              <span className={`nav-arrow ${openLaporan || isLaporanActive ? "open" : ""}`}>▼</span>
            </button>

            <div className={`submenu ${openLaporan || isLaporanActive ? "open" : ""}`}>
              {laporanItems.map(item => (
                <a key={item.href} href={item.href}
                  className={`submenu-item ${currentPath === item.href ? "active" : ""}`}
                  onClick={() => setOpenMenu(false)}>
                  <span className="submenu-icon" style={{ color: currentPath === item.href ? "#14532d" : "#cedbd0" }}>
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{session?.user?.name?.[0]?.toUpperCase() || "A"}</div>
              <div className="user-info">
                <div className="user-name">{session?.user?.name || "Admin"}</div>
                <div className="user-role">Administrator</div>
              </div>
            </div>
            <button className="logout-btn" onClick={() => signOut({ callbackUrl: "/" })}>
              {ICONS.logout}
              Keluar Aplikasi
            </button>
          </div>
        </aside>

        <div className="main-content">
          <div className="topbar">
            <div className="topbar-left">
              <button className="hamburger" onClick={() => setOpenMenu(!openMenu)}>☰</button>
              <span className="topbar-title">{getTitle()}</span>
            </div>
            <div className="topbar-right">
              <span className="topbar-date">
                {new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"short", year:"numeric" })}
              </span>
            </div>
          </div>
          <div className="page-content">{children}</div>
        </div>
      </div>
    </>
  );
}