// pages/kepala/laporan/rekap-pembayaran.js
import { useEffect, useState } from "react"
import KepalaLayout from "@/components/KepalaLayout"

export default function RekapPembayaran() {
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [classes, setClasses]   = useState([])
  const [payTypes, setPayTypes] = useState([])

  const [classId,       setClassId]       = useState("")
  const [paymentTypeId, setPaymentTypeId] = useState("")
  const [status,        setStatus]        = useState("")
  const [academicYear,  setAcademicYear]  = useState("")
  const [search,        setSearch]        = useState("")

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (classId)       params.set("classId", classId)
    if (paymentTypeId) params.set("paymentTypeId", paymentTypeId)
    if (status)        params.set("status", status)
    if (academicYear)  params.set("academicYear", academicYear)

    // ✅ Langsung panggil API yang sudah ada — tidak perlu duplikat
    fetch(`/api/reports/rekap-pembayaran?${params.toString()}`)
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [classId, paymentTypeId, status, academicYear])

  useEffect(() => {
    fetch("/api/kelas").then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : [])).catch(() => {})
    fetch("/api/payment-types").then(r => r.json()).then(d => setPayTypes(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const filtered = data.filter(row => {
    const nama = (row.student?.name || "").toLowerCase()
    return nama.includes(search.toLowerCase())
  })

  const sudahBayar = filtered.filter(r => r.status === "PAID").length
  const belumBayar = filtered.filter(r => r.status === "UNPAID").length
  const rp = n => "Rp " + Number(n || 0).toLocaleString("id-ID")

  const tahunList = [...new Set(data.map(r => r.student?.entryYear).filter(Boolean))].sort().reverse()

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
        .sum-card.green { border-top: 3px solid #22c55e; }
        .sum-card.red   { border-top: 3px solid #ef4444; }
        .sum-card.blue  { border-top: 3px solid #1976d2; }
        .sum-icon  { font-size: 22px; margin-bottom: 6px; }
        .sum-label { font-size: 11px; font-weight: 700; color: #9ab5a3; text-transform: uppercase; letter-spacing: 0.4px; }
        .sum-val   { font-size: 22px; font-weight: 800; color: #1a3d28; margin-top: 4px; }

        .card { background: #fff; border: 1px solid #e4e9e6; border-radius: 16px; overflow: hidden; }
        .card-header {
          background: #f7faf8; border-bottom: 1.5px solid #e4e9e6;
          padding: 13px 18px; display: flex; align-items: center; gap: 8px;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a8f50; }
        .card-title { font-size: 12px; font-weight: 700; color: #3a8f50; text-transform: uppercase; letter-spacing: 0.5px; }

        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 560px; }
        th {
          background: #f7faf8; font-size: 11px; font-weight: 700; color: #6b7280;
          text-transform: uppercase; letter-spacing: 0.4px; padding: 12px 14px;
          border-bottom: 1.5px solid #e4e9e6; text-align: left; white-space: nowrap;
        }
        td { padding: 12px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f0f4f0; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f9fdfb; }

        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
        }
        .badge.green { background: #dcfce7; color: #14532d; }
        .badge.red   { background: #fee2e2; color: #b91c1c; }
        .badge.gray  { background: #f3f4f6; color: #6b7280; }

        .empty { padding: 50px; text-align: center; color: #9ab5a3; font-size: 14px; }
        .loading-box { padding: 60px; text-align: center; color: #9ab5a3; }

        @media (max-width: 768px) {
          .summary-row { grid-template-columns: 1fr 1fr; }
          .toolbar { flex-direction: column; align-items: stretch; }
          .search-input { min-width: unset; }
        }
        @media (max-width: 480px) {
          .summary-row { grid-template-columns: 1fr; }
          .page-title { font-size: 16px; }
        }
      `}</style>

      <div className="wrap">
        <div className="page-title">✅ Rekap Pembayaran</div>
        <div className="page-sub">Status tagihan santri — sudah & belum bayar</div>

        <div className="toolbar">
          <span className="filter-label">Filter:</span>
          <select value={classId} onChange={e => setClassId(e.target.value)}>
            <option value="">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={paymentTypeId} onChange={e => setPaymentTypeId(e.target.value)}>
            <option value="">Semua Jenis</option>
            {payTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="PAID">Lunas</option>
            <option value="UNPAID">Belum Bayar</option>
          </select>
          <select value={academicYear} onChange={e => setAcademicYear(e.target.value)}>
            <option value="">Semua Tahun</option>
            {tahunList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            className="search-input"
            placeholder="🔍 Cari nama santri..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="summary-row">
          <div className="sum-card blue">
            <div className="sum-icon">🧾</div>
            <div className="sum-label">Total Tagihan</div>
            <div className="sum-val">{filtered.length}</div>
          </div>
          <div className="sum-card green">
            <div className="sum-icon">✅</div>
            <div className="sum-label">Sudah Bayar</div>
            <div className="sum-val">{sudahBayar}</div>
          </div>
          <div className="sum-card red">
            <div className="sum-icon">❌</div>
            <div className="sum-label">Belum Bayar</div>
            <div className="sum-val">{belumBayar}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="dot" />
            <span className="card-title">Detail Rekap Tagihan</span>
          </div>
          {loading ? (
            <div className="loading-box">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">Tidak ada data tagihan ditemukan.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Santri</th>
                    <th>NISN</th>
                    <th>Kelas</th>
                    <th>Jenis Pembayaran</th>
                    <th>Nominal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={row.id || i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{row.student?.name || "-"}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{row.student?.nisn || "-"}</td>
                      <td>{row.student?.class?.name || "-"}</td>
                      <td>{row.paymentType?.name || "-"}</td>
                      <td style={{ fontWeight: 700, color: "#14532d" }}>{rp(row.paymentType?.amount)}</td>
                      <td>
                        <span className={`badge ${row.status === "PAID" ? "green" : row.status === "UNPAID" ? "red" : "gray"}`}>
                          {row.status === "PAID" ? "✅ Lunas" : row.status === "UNPAID" ? "❌ Belum" : row.status || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </KepalaLayout>
  )
}