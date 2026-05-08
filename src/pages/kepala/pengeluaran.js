// pages/kepala/laporan/pengeluaran.js
import { useEffect, useState } from "react"
import KepalaLayout from "@/components/KepalaLayout"

export default function LaporanPengeluaran() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan]     = useState(new Date().getMonth() + 1)
  const [tahun, setTahun]     = useState(new Date().getFullYear())
  const [search, setSearch]   = useState("")

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ bulan, tahun })

    // ✅ Panggil API reports yang sudah ada di admin
    fetch(`/api/reports/pengeluaran?${params.toString()}`)
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : d?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [bulan, tahun])

  const namaBulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]
  const tahunOpts = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const filtered = data.filter(r => {
    const ket = (r.keterangan || r.description || r.kategori || "").toLowerCase()
    return ket.includes(search.toLowerCase())
  })

  const totalKeluar = filtered.reduce((s, r) => s + Number(r.jumlah || r.amount || r.nominal || 0), 0)
  const rp = n => "Rp " + Number(n || 0).toLocaleString("id-ID")

  return (
    <KepalaLayout>
      <style jsx>{`
        .wrap { padding: 4px 0 40px; }
        .page-title { font-size: 18px; font-weight: 700; color: #1a3d28; margin-bottom: 4px; }
        .page-sub   { font-size: 13px; color: #7a9a85; margin-bottom: 20px; }

        .toolbar {
          display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
          background: #fff; border: 1px solid #e4e9e6; border-radius: 14px;
          padding: 14px 16px; margin-bottom: 20px;
        }
        .filter-label { font-size: 12px; font-weight: 600; color: #6b7280; white-space: nowrap; }
        select, .search-input {
          padding: 8px 12px; border: 1px solid #d1fae5; border-radius: 8px;
          font-size: 13px; color: #1a3d28; font-family: inherit; background: #f7faf8; outline: none;
        }
        select { cursor: pointer; }
        select:focus, .search-input:focus { border-color: #22c55e; }
        .search-input { flex: 1; min-width: 160px; }

        .summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .sum-card {
          background: #fff; border: 1px solid #e4e9e6; border-radius: 14px;
          padding: 16px; text-align: center;
        }
        .sum-card.red   { border-top: 3px solid #ef4444; }
        .sum-card.blue  { border-top: 3px solid #1976d2; }
        .sum-card.amber { border-top: 3px solid #f59e0b; }
        .sum-icon  { font-size: 22px; margin-bottom: 6px; }
        .sum-label { font-size: 11px; font-weight: 700; color: #9ab5a3; text-transform: uppercase; letter-spacing: 0.4px; }
        .sum-val   { font-size: 20px; font-weight: 800; color: #1a3d28; margin-top: 4px; }

        .card { background: #fff; border: 1px solid #e4e9e6; border-radius: 16px; overflow: hidden; }
        .card-header {
          background: #f7faf8; border-bottom: 1.5px solid #e4e9e6;
          padding: 13px 18px; display: flex; align-items: center; gap: 8px;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a8f50; }
        .card-title { font-size: 12px; font-weight: 700; color: #3a8f50; text-transform: uppercase; letter-spacing: 0.5px; }

        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 480px; }
        th {
          background: #f7faf8; font-size: 11px; font-weight: 700; color: #6b7280;
          text-transform: uppercase; letter-spacing: 0.4px; padding: 12px 14px;
          border-bottom: 1.5px solid #e4e9e6; text-align: left; white-space: nowrap;
        }
        td { padding: 12px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f0f4f0; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f9fdfb; }

        .badge {
          display: inline-block; padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 700;
        }
        .badge.red    { background: #fee2e2; color: #b91c1c; }
        .badge.amber  { background: #fef3c7; color: #92400e; }

        .tfoot-row td {
          font-weight: 800; color: #1a3d28; background: #f0fdf4;
          border-top: 2px solid #bbf7d0; font-size: 13.5px;
        }

        .empty { padding: 50px; text-align: center; color: #9ab5a3; font-size: 14px; }
        .loading-box { padding: 60px; text-align: center; color: #9ab5a3; }

        @media (max-width: 768px) {
          .summary-row { grid-template-columns: 1fr 1fr; }
          .toolbar { flex-direction: column; align-items: stretch; }
          .search-input { min-width: unset; }
          .sum-val { font-size: 16px; }
        }
        @media (max-width: 480px) {
          .summary-row { grid-template-columns: 1fr; }
          .page-title { font-size: 16px; }
        }
      `}</style>

      <div className="wrap">
        <div className="page-title">💸 Laporan Pengeluaran</div>
        <div className="page-sub">Ringkasan pengeluaran madrasah per bulan</div>

        <div className="toolbar">
          <span className="filter-label">Periode:</span>
          <select value={bulan} onChange={e => setBulan(Number(e.target.value))}>
            {namaBulan.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
          </select>
          <select value={tahun} onChange={e => setTahun(Number(e.target.value))}>
            {tahunOpts.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <input
            className="search-input"
            placeholder="🔍 Cari keterangan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="summary-row">
          <div className="sum-card red">
            <div className="sum-icon">💸</div>
            <div className="sum-label">Total Pengeluaran</div>
            <div className="sum-val">{rp(totalKeluar)}</div>
          </div>
          <div className="sum-card blue">
            <div className="sum-icon">🧾</div>
            <div className="sum-label">Jumlah Transaksi</div>
            <div className="sum-val">{filtered.length}</div>
          </div>
          <div className="sum-card amber">
            <div className="sum-icon">📅</div>
            <div className="sum-label">Periode</div>
            <div className="sum-val" style={{ fontSize: 14 }}>{namaBulan[bulan - 1]} {tahun}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="dot" />
            <span className="card-title">Detail Pengeluaran — {namaBulan[bulan - 1]} {tahun}</span>
          </div>
          {loading ? (
            <div className="loading-box">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">Tidak ada data pengeluaran untuk periode ini.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Kategori</th>
                    <th>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={row.id || i}>
                      <td>{i + 1}</td>
                      <td>
                        {row.tanggal || row.date
                          ? new Date(row.tanggal || row.date).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })
                          : "-"}
                      </td>
                      <td style={{ fontWeight: 500 }}>{row.keterangan || row.description || "-"}</td>
                      <td>
                        {(row.kategori || row.category) ? (
                          <span className="badge amber">{row.kategori || row.category}</span>
                        ) : "-"}
                      </td>
                      <td style={{ fontWeight: 700, color: "#dc2626" }}>
                        {rp(row.jumlah || row.amount || row.nominal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="tfoot-row">
                    <td colSpan={4} style={{ textAlign: "right" }}>Total Pengeluaran</td>
                    <td>{rp(totalKeluar)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </KepalaLayout>
  )
}