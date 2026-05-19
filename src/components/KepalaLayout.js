import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/router"
import Link from "next/link"
import { useState, useEffect } from "react"

const menuItems = [
  { href: "/kepala/dashboard", icon: "🏠", label: "Dashboard" },
  {
    href: "/kepala/laporan",
    icon: "📊",
    label: "Laporan",
    children: [
      { href: "/kepala/laporan/rekap-pembayaran", icon: "✅", label: "Rekap Pembayaran" },
      { href: "/kepala/laporan/data-santri", icon: "🎓", label: "Data Santri" },
      { href: "/kepala/laporan/pengeluaran", icon: "💸", label: "Laporan Pengeluaran" },
    ]
  },
]

export default function KepalaLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [openMenu, setOpenMenu] = useState(false)
  const [openLaporan, setOpenLaporan] = useState(false)

  const currentPath = router.pathname
  const isLaporanActive = currentPath.startsWith("/kepala/laporan")

  // ✅ FIX redirect (jangan langsung di render)
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
    } else if (session.user.role !== "KEPALA") {
      router.push("/login")
    }
  }, [session, status])

  // ✅ Auto buka submenu kalau di halaman laporan
  useEffect(() => {
    if (isLaporanActive) setOpenLaporan(true)
  }, [isLaporanActive])

  if (status === "loading") {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f8faf8"
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) return null

  const getTitle = () => {
    if (currentPath === "/kepala/dashboard") return "Dashboard"
    if (currentPath === "/kepala/laporan/rekap-pembayaran") return "Rekap Pembayaran"
    if (currentPath === "/kepala/laporan/data-santri") return "Data Santri"
    if (currentPath === "/kepala/laporan/pengeluaran") return "Laporan Pengeluaran"
    return "Kepala Madrasah"
  }

  return (
    <div className="admin-layout">
      {/* OVERLAY */}
      <div
        className={`overlay ${openMenu ? "show" : ""}`}
        onClick={() => setOpenMenu(false)}
      />

      {/* SIDEBAR */}
      <aside className={`sidebar ${openMenu ? "show" : ""}`}>
        <div className="sidebar-brand">
          <img src="/logo-sibatamu.png" alt="logo" width={36} />
          <div className="brand-text">
            <span className="brand-name">SIBATAMU-SPP</span>
            <span className="brand-sub">Tarbiyatul Mubalighin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Menu</span>

          {/* DASHBOARD */}
          <Link href="/kepala/dashboard" className={`nav-item ${currentPath === "/kepala/dashboard" ? "active" : ""}`}>
            <span className="nav-icon">🏠</span> Dashboard
          </Link>

          {/* LAPORAN */}
          <button
            className={`nav-parent ${isLaporanActive ? "active" : ""}`}
            onClick={() => setOpenLaporan(!openLaporan)}
          >
            <div className="nav-parent-left">
              <span className="nav-icon">📊</span> Laporan
            </div>
            <span className={`nav-arrow ${openLaporan ? "open" : ""}`}>▼</span>
          </button>

          <div className={`submenu ${openLaporan ? "open" : ""}`}>
            {menuItems[1].children.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`submenu-item ${currentPath === item.href ? "active" : ""}`}
              >
                <span className="submenu-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* FOOTER */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {session?.user?.name?.[0]?.toUpperCase() || "K"}
            </div>
            <div className="user-info">
              <div className="user-name">{session?.user?.name}</div>
              <div className="user-role">Kepala Madrasah</div>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setOpenMenu(!openMenu)}>☰</button>
            <span className="topbar-title">{getTitle()}</span>
          </div>

          <div className="topbar-right">
            <span className="role-badge">👑 Kepala Madrasah</span>
            <span className="topbar-date">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
              })}
            </span>
          </div>
        </div>

        <div className="page-content">{children}</div>
      </div>

      {/* STYLE (ringkas, tetap bisa pakai style kamu lama kalau mau) */}
      <style jsx>{`
        .admin-layout { display: flex; }
        .sidebar { width: 240px; background: #fff; position: fixed; height: 100%; }
        .main-content { margin-left: 240px; width: 100%; }
        .nav-item, .submenu-item { display: block; padding: 10px; }
        .active { background: #dcfce7; }
        .submenu { display: ${openLaporan ? "block" : "none"}; }
      `}</style>
    </div>
  )
}