// src/components/KepalaLayout.js
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";

const menuItems = [
  { href: "/kepala/dashboard", icon: "🏠", label: "Dashboard" },
  {
    href: "/kepala/laporan",
    icon: "📊",
    label: "Laporan",
    children: [
      { href: "/kepala/laporan/rekap-pembayaran", icon: "✅", label: "Rekap Pembayaran" },
      { href: "/kepala/laporan/data-santri",      icon: "🎓", label: "Data Santri" },
      { href: "/kepala/laporan/pengeluaran",      icon: "💸", label: "Laporan Pengeluaran" },
    ]
  },
];

export default function KepalaLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(false);
  const [openLaporan, setOpenLaporan] = useState(false);

  if (status === "loading") return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f8faf8", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🌿</div>
        <p style={{ color:"#6b7280", fontSize:14 }}>Memuat...</p>
      </div>
    </div>
  );

  if (!session) { router.push("/login"); return null; }
  if (session.user.role !== "KEPALA") { router.push("/login"); return null; }

  const currentPath = router.pathname;
  const isLaporanActive = currentPath.startsWith("/kepala/laporan");

  const getTitle = () => {
    if (currentPath === "/kepala/dashboard")                return "Dashboard"
    if (currentPath === "/kepala/laporan/rekap-pembayaran") return "Rekap Pembayaran"
    if (currentPath === "/kepala/laporan/data-santri")      return "Data Santri"
    if (currentPath === "/kepala/laporan/pengeluaran")      return "Laporan Pengeluaran"
    return "Kepala Madrasah"
  }

  return (
    <>
      <style global jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f4f6f4; }

        .admin-layout { display: flex; min-height: 100vh; }

        .sidebar {
          width: 248px; min-width: 248px; background: #ffffff;
          border-right: 1px solid #e8f0e8; display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; height: 100vh; overflow-y: auto;
          z-index: 50; transition: transform 0.3s cubic-bezier(.4,0,.2,1);
          box-shadow: 2px 0 20px rgba(20,83,45,0.06);
        }

        .sidebar-brand {
          padding: 24px 20px 20px; border-bottom: 1px solid #f0f4f0;
          display: flex; align-items: center; gap: 10px;
        }
        .brand-logo-fallback {
          width: 36px; height: 36px;
          background: linear-gradient(135deg,#14532d,#22c55e);
          border-radius: 10px; display: flex; align-items: center;
          justify-content: center; font-size: 18px; flex-shrink: 0;
        }
        .brand-text { display: flex; flex-direction: column; line-height: 1.3; }
        .brand-name { font-size: 14px; font-weight: 800; color: #14532d; letter-spacing: -0.3px; }
        .brand-sub  { font-size: 10px; color: #9ca3af; font-weight: 500; }

        .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 2px; }
        .nav-section-label {
          font-size: 10px; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.8px; padding: 12px 8px 6px;
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: 10px; color: #4b5563; font-size: 13.5px; font-weight: 500;
          text-decoration: none; transition: all 0.18s ease; cursor: pointer;
          border: none; background: transparent; width: 100%; text-align: left;
        }
        .nav-item:hover { background: #f0fdf4; color: #14532d; transform: translateX(2px); }
        .nav-item.active {
          background: linear-gradient(135deg, #dcfce7, #f0fdf4);
          color: #14532d; font-weight: 700; box-shadow: inset 3px 0 0 #22c55e;
        }
        .nav-icon { font-size: 16px; width: 22px; text-align: center; flex-shrink: 0; }

        .nav-parent {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: 10px; color: #4b5563; font-size: 13.5px; font-weight: 500;
          cursor: pointer; border: none; background: transparent; width: 100%;
          text-align: left; transition: all 0.18s ease; justify-content: space-between;
        }
        .nav-parent:hover { background: #f0fdf4; color: #14532d; }
        .nav-parent.active {
          background: linear-gradient(135deg, #dcfce7, #f0fdf4);
          color: #14532d; font-weight: 700; box-shadow: inset 3px 0 0 #22c55e;
        }
        .nav-parent-left { display: flex; align-items: center; gap: 10px; }
        .nav-arrow { font-size: 10px; color: #9ca3af; transition: transform 0.2s; }
        .nav-arrow.open { transform: rotate(180deg); }

        .submenu {
          display: flex; flex-direction: column; gap: 1px;
          margin-left: 12px; padding-left: 10px; border-left: 2px solid #d1fae5;
          overflow: hidden; max-height: 0; transition: max-height 0.25s ease;
        }
        .submenu.open { max-height: 300px; }
        .submenu-item {
          display: flex; align-items: center; gap: 8px; padding: 8px 10px;
          border-radius: 8px; color: #6b7280; font-size: 12.5px; font-weight: 500;
          text-decoration: none; transition: all 0.15s ease; margin-top: 2px;
        }
        .submenu-item:hover { background: #f0fdf4; color: #14532d; }
        .submenu-item.active { background: #dcfce7; color: #14532d; font-weight: 700; }
        .submenu-icon { font-size: 13px; width: 18px; text-align: center; flex-shrink: 0; }

        .sidebar-footer { padding: 16px 12px; border-top: 1px solid #f0f4f0; }
        .user-card {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          background: #f8faf8; border-radius: 12px; margin-bottom: 10px;
        }
        .user-avatar {
          width: 34px; height: 34px;
          background: linear-gradient(135deg,#14532d,#22c55e);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 800; font-size: 13px; flex-shrink: 0;
        }
        .user-info { flex: 1; overflow: hidden; }
        .user-name { font-size: 12.5px; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-role { font-size: 10.5px; color: #9ca3af; font-weight: 500; }
        .logout-btn {
          width: 100%; padding: 10px; background: #fff1f2; border: 1px solid #fecdd3;
          color: #e11d48; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.18s ease; font-family: inherit;
        }
        .logout-btn:hover { background: #ffe4e6; border-color: #fda4af; }

        .main-content { flex: 1; margin-left: 248px; min-height: 100vh; background: #f4f6f4; }

        .topbar {
          background: #ffffff; border-bottom: 1px solid #e8f0e8;
          padding: 0 32px; height: 60px; display: flex; align-items: center;
          justify-content: space-between; position: sticky; top: 0; z-index: 40;
          box-shadow: 0 1px 12px rgba(0,0,0,0.04);
        }
        .topbar-left { display: flex; align-items: center; gap: 12px; }
        .hamburger {
          display: none; background: #f0fdf4; border: 1px solid #bbf7d0;
          color: #14532d; width: 36px; height: 36px; border-radius: 8px;
          font-size: 18px; cursor: pointer; align-items: center; justify-content: center;
        }
        .topbar-title { font-size: 15px; font-weight: 700; color: #111827; }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .topbar-date {
          font-size: 12px; color: #6b7280; background: #f9fafb;
          border: 1px solid #f3f4f6; padding: 5px 12px; border-radius: 8px; font-weight: 500;
        }
        .role-badge {
          font-size: 11px; font-weight: 700; color: #b07800;
          background: #fff8e6; border: 1px solid #e6d08a;
          padding: 4px 10px; border-radius: 20px;
        }

        .page-content { padding: 28px 32px; }

        .overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.3); z-index: 40; backdrop-filter: blur(2px);
        }

        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.show { transform: translateX(0); }
          .main-content { margin-left: 0; }
          .hamburger { display: flex; }
          .overlay.show { display: block; }
          .page-content { padding: 20px 16px; }
          .topbar { padding: 0 16px; }
          .topbar-date { display: none; }
        }
        @media (max-width: 480px) {
          .role-badge { display: none; }
        }
      `}</style>

      <div className="admin-layout">
        <div className={`overlay ${openMenu ? "show" : ""}`} onClick={() => setOpenMenu(false)} />

        <aside className={`sidebar ${openMenu ? "show" : ""}`}>
          <div className="sidebar-brand">
            <img src="/logo-sibatamu.png" alt="logo" style={{ width:36, height:36, objectFit:"contain" }}
              onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
            <div className="brand-logo-fallback" style={{ display:"none" }}>🎓</div>
            <div className="brand-text">
              <span className="brand-name">SIBATAMU-SPP</span>
              <span className="brand-sub">Tarbiyatul Mubalighin</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <span className="nav-section-label">Menu</span>

            <a href="/kepala/dashboard"
              className={`nav-item ${currentPath === "/kepala/dashboard" ? "active" : ""}`}
              onClick={() => setOpenMenu(false)}>
              <span className="nav-icon">🏠</span> Dashboard
            </a>

            <button className={`nav-parent ${isLaporanActive ? "active" : ""}`}
              onClick={() => setOpenLaporan(p => !p)}>
              <div className="nav-parent-left">
                <span className="nav-icon">📊</span> Laporan
              </div>
              <span className={`nav-arrow ${openLaporan || isLaporanActive ? "open" : ""}`}>▼</span>
            </button>

            <div className={`submenu ${openLaporan || isLaporanActive ? "open" : ""}`}>
              {menuItems[1].children.map(item => (
                <a key={item.href} href={item.href}
                  className={`submenu-item ${currentPath === item.href ? "active" : ""}`}
                  onClick={() => setOpenMenu(false)}>
                  <span className="submenu-icon">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{session?.user?.name?.[0]?.toUpperCase() || "K"}</div>
              <div className="user-info">
                <div className="user-name">{session?.user?.name || "Kepala"}</div>
                <div className="user-role">Kepala Madrasah</div>
              </div>
            </div>
            <button className="logout-btn" onClick={() => signOut({ callbackUrl: "/" })}>🚪 Logout</button>
          </div>
        </aside>

        <div className="main-content">
          <div className="topbar">
            <div className="topbar-left">
              <button className="hamburger" onClick={() => setOpenMenu(!openMenu)}>☰</button>
              <span className="topbar-title">{getTitle()}</span>
            </div>
            <div className="topbar-right">
              <span className="role-badge">👑 Kepala Madrasah</span>
              <span className="topbar-date">
                {new Date().toLocaleDateString("id-ID", { weekday:"short", day:"numeric", month:"short", year:"numeric" })}
              </span>
            </div>
          </div>
          <div className="page-content">{children}</div>
        </div>
      </div>
    </>
  );
}