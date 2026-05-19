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

    const params = new URLSearchParams({
      month: bulan,
      year: tahun
    })

    fetch(`/api/pengeluaran/list?${params.toString()}`)
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))

  }, [bulan, tahun])

  const namaBulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]
  const tahunOpts = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const filtered = data.filter(r => {
    const text = (r.title || r.note || "").toLowerCase()
    return text.includes(search.toLowerCase())
  })

  const totalKeluar = filtered.reduce((s, r) => s + Number(r.amount || 0), 0)
  const rp = n => "Rp " + Number(n || 0).toLocaleString("id-ID")

  return (
    <KepalaLayout>
      <style jsx>{`
        .wrap { padding: 4px 0 40px; }

        .page-title { font-size: 18px; font-weight: 700; color: #1a3d28; margin-bottom: 4px; }
        .page-sub   { font-size: 13px; color: #7a9a85; margin-bottom: 20px; }

        .toolbar {
          display: flex; gap: 10px; flex-wrap: wrap;
          background: #fff; border: 1px solid #e4e9e6;
          border-radius: 14px; padding: 14px 16px; margin-bottom: 20px;
        }

        select, input {
          padding: 8px 12px;
          border: 1px solid #d1fae5;
          border-radius: 8px;
          font-size: 13px;
          background: #f7faf8;
          outline: none;
        }

        input { flex: 1; }

        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .card-box {
          background: #fff;
          border-radius: 14px;
          padding: 16px;
          text-align: center;
          border: 1px solid #e4e9e6;
        }

        .card-box.red { border-top: 3px solid #ef4444; }
        .card-box.blue { border-top: 3px solid #1976d2; }
        .card-box.orange { border-top: 3px solid #f59e0b; }

        .card-title { font-size: 12px; color: #9ab5a3; font-weight: 700; }
        .card-value { font-size: 18px; font-weight: 800; margin-top: 4px; }

        .card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e4e9e6;
          overflow: hidden;
        }

        .card-header {
          padding: 14px 18px;
          border-bottom: 1px solid #e4e9e6;
          font-weight: 700;
          color: #3a8f50;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f7faf8;
          font-size: 12px;
          padding: 12px;
          text-align: left;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #f0f4f0;
        }

        tr:hover td {
          background: #f9fdfb;
        }

        .empty, .loading {
          padding: 50px;
          text-align: center;
          color: #9ab5a3;
        }

        .amount {
          color: #dc2626;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .summary { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 480px) {
          .summary { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wrap">
        <div className="page-title">💸 Laporan Pengeluaran</div>
        <div className="page-sub">Ringkasan pengeluaran per bulan</div>

        {/* TOOLBAR */}
        <div className="toolbar">
          <select value={bulan} onChange={e => setBulan(Number(e.target.value))}>
            {namaBulan.map((n, i) => (
              <option key={i} value={i + 1}>{n}</option>
            ))}
          </select>

          <select value={tahun} onChange={e => setTahun(Number(e.target.value))}>
            {tahunOpts.map(y => (
              <option key={y}>{y}</option>
            ))}
          </select>

          <input
            placeholder="🔍 Cari keterangan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* SUMMARY */}
        <div className="summary">
          <div className="card-box red">
            <div className="card-title">TOTAL</div>
            <div className="card-value">{rp(totalKeluar)}</div>
          </div>

          <div className="card-box blue">
            <div className="card-title">TRANSAKSI</div>
            <div className="card-value">{filtered.length}</div>
          </div>

          <div className="card-box orange">
            <div className="card-title">PERIODE</div>
            <div className="card-value">
              {namaBulan[bulan - 1]} {tahun}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="card">
          <div className="card-header">Detail Pengeluaran</div>

          {loading ? (
            <div className="loading">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">Tidak ada data pengeluaran</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id}>
                    <td>{i + 1}</td>
                    <td>
                      {row.date
                        ? new Date(row.date).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td>{row.title}</td>
                    <td className="amount">{rp(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </KepalaLayout>
  )
}