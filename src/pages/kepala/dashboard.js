// pages/kepala/dashboard.js
import { useEffect, useState } from "react"
import KepalaLayout from "@/components/KepalaLayout"

export default function KepalaDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/kepala/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const rp = n => "Rp " + Number(n || 0).toLocaleString("id-ID")

  return (
    <KepalaLayout>
      <style jsx>{`
        .page-wrapper { padding: 8px 0 40px; }
        .page-header { margin-bottom: 28px; }
        .page-header h2 { font-size: 20px; font-weight: 700; color: #1a3d28; margin: 0 0 4px; }
        .page-header span { font-size: 13px; color: #7a9a85; }

        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }

        .stat-card {
          background: #fff; border: 1px solid #e4e9e6; border-radius: 16px;
          padding: 20px; position: relative; overflow: hidden;
        }
        .stat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #3a8f50, #22c55e);
          border-radius: 16px 16px 0 0;
        }
        .stat-card.red::before { background: linear-gradient(90deg, #d32f2f, #ef5350); }
        .stat-card.blue::before { background: linear-gradient(90deg, #1565c0, #1976d2); }
        .stat-card.amber::before { background: linear-gradient(90deg, #b07800, #f59e0b); }

        .stat-icon { font-size: 28px; margin-bottom: 10px; }
        .stat-label { font-size: 11px; font-weight: 700; color: #8aab96; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .stat-val { font-size: 24px; font-weight: 800; color: #1a3d28; }
        .stat-sub { font-size: 12px; color: #9ab5a3; margin-top: 4px; }

        .section-card {
          background: #fff; border: 1px solid #e4e9e6;
          border-radius: 16px; overflow: hidden; margin-bottom: 16px;
        }
        .section-header {
          background: #f7faf8; border-bottom: 1.5px solid #e4e9e6;
          padding: 14px 20px; display: flex; align-items: center; gap: 8px;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a8f50; }
        .section-header span { font-size: 12px; font-weight: 700; color: #3a8f50; text-transform: uppercase; letter-spacing: 0.5px; }

        .quick-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 16px; }
        .quick-link {
          display: flex; align-items: center; gap: 12px; padding: 14px 16px;
          background: #f7faf8; border: 1px solid #e4e9e6; border-radius: 12px;
          text-decoration: none; transition: 0.15s; color: #1a3d28;
        }
        .quick-link:hover { background: #edf7ef; border-color: #c3dfc9; transform: translateY(-1px); }
        .quick-link-icon { font-size: 24px; }
        .quick-link-label { font-size: 13px; font-weight: 600; }
        .quick-link-sub { font-size: 11px; color: #9ab5a3; margin-top: 2px; }

        .loading-box { padding: 60px; text-align: center; color: #9ab5a3; }

        @media (max-width: 768px) {
          .stat-grid { grid-template-columns: 1fr 1fr; }
          .quick-links { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page-wrapper">
        <div className="page-header">
          <h2>Dashboard Kepala Madrasah</h2>
          <span>Ringkasan data dan laporan madrasah</span>
        </div>

        {loading ? (
          <div className="loading-box">Memuat data...</div>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-icon">👩‍🎓</div>
                <div className="stat-label">Total Santri</div>
                <div className="stat-val">{stats?.totalSantri || 0}</div>
                <div className="stat-sub">Santri aktif</div>
              </div>
              <div className="stat-card blue">
                <div className="stat-icon">🧑‍🏫</div>
                <div className="stat-label">Total Ustadz</div>
                <div className="stat-val">{stats?.totalUstadz || 0}</div>
                <div className="stat-sub">Pengajar aktif</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-label">Pemasukan Bulan Ini</div>
                <div className="stat-val" style={{ fontSize: 16 }}>{rp(stats?.pemasukanBulanIni || 0)}</div>
                <div className="stat-sub">Pembayaran sukses</div>
              </div>
              <div className="stat-card red">
                <div className="stat-icon">📋</div>
                <div className="stat-label">Tagihan Belum Bayar</div>
                <div className="stat-val">{stats?.tagihanUnpaid || 0}</div>
                <div className="stat-sub">{rp(stats?.totalUnpaid || 0)}</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <div className="dot" />
                <span>Akses Laporan</span>
              </div>
              <div className="quick-links">
                {[
                  { href: "/kepala/reports/pembayaran", icon: "📈", label: "Laporan Pembayaran", sub: "Ringkasan pemasukan" },
                  { href: "/kepala/reports/rekap-pembayaran", icon: "✅", label: "Rekap Pembayaran", sub: "Status sudah/belum bayar" },
                  { href: "/kepala/reports/rekap-santri", icon: "🎓", label: "Rekap Santri", sub: "Data santri per tahun ajaran" },
                  { href: "/kepala/reports/absensi", icon: "📋", label: "Absensi Santri", sub: "Cetak lembar absensi" },
                ].map(item => (
                  <a key={item.href} href={item.href} className="quick-link">
                    <div className="quick-link-icon">{item.icon}</div>
                    <div>
                      <div className="quick-link-label">{item.label}</div>
                      <div className="quick-link-sub">{item.sub}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </KepalaLayout>
  )
}