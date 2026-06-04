import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 3; i <= currentYear + 1; i++) {
    years.push(`${i}/${i + 1}`)
  }
  return years.reverse()
}

const currentMonth = new Date().getMonth()
const currentYear  = new Date().getFullYear()
const defaultAcademicYear = currentMonth >= 6
  ? `${currentYear}/${currentYear + 1}`
  : `${currentYear - 1}/${currentYear}`

export default function RekapPembayaran() {
  const [classes, setClasses]           = useState([])
  const [academicYears]                 = useState(generateAcademicYears())
  const [filter, setFilter]             = useState({ academicYear: defaultAcademicYear, classId: "" })
  const [kolom, setKolom]               = useState([])
  const [santri, setSantri]             = useState([])
  const [loading, setLoading]           = useState(false)
  const [searched, setSearched]         = useState(false)

  useEffect(() => {
    fetch("/api/classes/list").then(r => r.json()).then(setClasses)
  }, [])

  async function handleSearch() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.academicYear) params.append("academicYear", filter.academicYear)
      if (filter.classId)      params.append("classId", filter.classId)

      const res  = await fetch(`/api/reports/rekap-pembayaran?${params}`)
      const json = await res.json()
      setKolom(json.kolom   || [])
      setSantri(json.santri || [])
      setSearched(true)
    } catch {
      alert("Gagal mengambil data")
    } finally {
      setLoading(false)
    }
  }

  async function exportExcel() {
    const XLSX = await import("xlsx")
    const header = ["No", "Nama Santri", "Kelas", ...kolom.map(k => k.label), "Total Tagihan", "Lunas", "Belum"]
    const rows = santri.map((s, i) => [
      i + 1,
      s.name,
      s.kelas,
      ...kolom.map(k => s.tagihan[k.key] === "PAID" ? "✓" : s.tagihan[k.key] === "UNPAID" ? "✗" : "-"),
      s.totalTagihan,
      s.lunas,
      s.belum,
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Pembayaran")
    XLSX.writeFile(wb, `Rekap_Pembayaran_${filter.academicYear?.replace("/","_")}.xlsx`)
  }

  const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID")

  // Summary
  const totalSantri  = santri.length
  const totalLunas   = santri.reduce((s, x) => s + x.lunas,  0)
  const totalBelum   = santri.reduce((s, x) => s + x.belum,  0)
  const totalTagihan = santri.reduce((s, x) => s + x.totalTagihan, 0)

  return (
    <AdminLayout>
      <style jsx>{`
        .page { padding: 10px 0 40px; }
        .title { margin-bottom: 22px; }
        .title h2 { font-size: 28px; margin: 0; color: #153728; }
        .title p  { margin-top: 4px; color: #7d9889; }

        .card { background: #fff; border-radius: 16px; border: 1px solid #e5ebe7; padding: 20px; margin-bottom: 18px; }

        .filter-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .filter-actions { display: flex; justify-content: flex-end; margin-top: 14px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 13px; font-weight: 600; color: #53705f; }
        .field select { height: 44px; border-radius: 10px; border: 1px solid #dfe7e2; padding: 0 12px; font-size: 14px; outline: none; background: #fff; }
        .btn { height: 44px; border: none; border-radius: 10px; background: #3a8f50; color: white; padding: 0 32px; font-weight: 600; cursor: pointer; font-size: 14px; }
        .btn:hover { background: #2d733e; }
        .btn:disabled { opacity: .6; cursor: not-allowed; }

        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
        .sum-card { background: white; border-radius: 14px; border: 1px solid #e4e9e6; padding: 18px; }
        .sum-card h3 { margin: 0; color: #789080; font-size: 13px; font-weight: 600; }
        .sum-card p  { margin: 6px 0 0; font-size: 22px; font-weight: 800; color: #132f22; }
        .sum-card.red p  { color: #dc2626; }
        .sum-card.grn p  { color: #16a34a; }

        .export { display: flex; gap: 10px; margin-bottom: 14px; }
        .btn-export { border: none; padding: 9px 16px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px; }
        .excel { background: #e8f5e9; color: #2e7d32; }
        .print { background: #e3f2fd; color: #1565c0; }

        .table-wrap { background: white; border-radius: 16px; border: 1px solid #e4e9e6; overflow: hidden; }
        .table-header { padding: 16px 20px; font-size: 17px; font-weight: 700; border-bottom: 1px solid #edf2ef; color: #153728; display: flex; justify-content: space-between; align-items: center; }
        .table-scroll { overflow-x: auto; }

        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f7faf8; padding: 11px 12px; font-size: 11px; color: #53705f; font-weight: 700; border: 1px solid #e4e9e6; white-space: nowrap; text-align: center; }
        th.left { text-align: left; }
        td { padding: 11px 12px; border: 1px solid #edf2ef; color: #333; text-align: center; vertical-align: middle; }
        td.left { text-align: left; }
        tr:hover td { background: #f7fdf9; }

        .cell-lunas { color: #16a34a; font-weight: 700; font-size: 16px; }
        .cell-belum { color: #dc2626; font-weight: 700; font-size: 16px; }
        .cell-kosong { color: #94a3b8; font-size: 14px; }

        tfoot td { background: #f7faf8; font-weight: 700; font-size: 12px; }

        @media print {
          .no-print { display: none !important; }
          .page { padding: 0; }
        }
      `}</style>

      <div className="page">
        <div className="title">
          <h2>📊 Rekap Pembayaran Santri</h2>
          <p>Rekapan semua tagihan per santri berdasarkan tahun ajaran</p>
        </div>

        {/* FILTER */}
        <div className="card no-print">
          <div className="filter-grid">
            <div className="field">
              <label>Tahun Ajaran</label>
              <select value={filter.academicYear} onChange={e => setFilter({...filter, academicYear: e.target.value})}>
                <option value="">-- Pilih Tahun Ajaran --</option>
                {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Kelas</label>
              <select value={filter.classId} onChange={e => setFilter({...filter, classId: e.target.value})}>
                <option value="">-- Semua Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn" onClick={handleSearch} disabled={loading}>
              {loading ? "Memuat..." : "Tampilkan Rekap"}
            </button>
          </div>
        </div>

        {searched && (
          <>
            {/* SUMMARY */}
            <div className="summary">
              <div className="sum-card"><h3>Total Santri</h3><p>{totalSantri}</p></div>
              <div className="sum-card"><h3>Total Tagihan</h3><p>{rp(totalTagihan)}</p></div>
              <div className="sum-card grn"><h3>Total Lunas</h3><p>{totalLunas}</p></div>
              <div className="sum-card red"><h3>Total Belum Bayar</h3><p>{totalBelum}</p></div>
            </div>

            {/* EXPORT */}
            <div className="export no-print">
              <button className="btn-export excel" onClick={exportExcel}>📊 Export Excel</button>
              <button className="btn-export print" onClick={() => window.print()}>🖨️ Cetak</button>
            </div>

            {/* TABEL */}
            <div className="table-wrap">
              <div className="table-header">
                <span>Rekap — {filter.academicYear || "Semua Tahun"}</span>
                <span style={{fontSize:13, color:"#64748b", fontWeight:400}}>
                  {totalSantri} santri · {kolom.length} jenis tagihan
                </span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th className="left" style={{minWidth:40}}>No</th>
                      <th className="left" style={{minWidth:180}}>Nama Santri</th>
                      <th className="left" style={{minWidth:110}}>Kelas</th>
                      {kolom.map(k => (
                        <th key={k.key} style={{minWidth:80}}>{k.label}</th>
                      ))}
                      <th style={{minWidth:110}}>Total Tagihan</th>
                      <th style={{minWidth:60}}>Lunas</th>
                      <th style={{minWidth:60}}>Belum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {santri.length === 0 ? (
                      <tr>
                        <td colSpan={kolom.length + 6} style={{padding:40, color:"#94a3b8"}}>
                          Belum ada data tagihan
                        </td>
                      </tr>
                    ) : santri.map((s, i) => (
                      <tr key={s.id}>
                        <td className="left">{i + 1}</td>
                        <td className="left" style={{fontWeight:600}}>{s.name}</td>
                        <td className="left">{s.kelas}</td>
                        {kolom.map(k => (
                          <td key={k.key}>
                            {s.tagihan[k.key] === "PAID"
                              ? <span className="cell-lunas">✓</span>
                              : s.tagihan[k.key] === "UNPAID"
                              ? <span className="cell-belum">✗</span>
                              : <span className="cell-kosong">—</span>
                            }
                          </td>
                        ))}
                        <td style={{fontWeight:600}}>{rp(s.totalTagihan)}</td>
                        <td><span style={{color:"#16a34a", fontWeight:700}}>{s.lunas}</span></td>
                        <td><span style={{color:"#dc2626", fontWeight:700}}>{s.belum}</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="left">Total Lunas per Tagihan</td>
                      {kolom.map(k => {
                        const lunas = santri.filter(s => s.tagihan[k.key] === "PAID").length
                        const total = santri.filter(s => s.tagihan[k.key] !== undefined).length
                        return (
                          <td key={k.key}>
                            <span style={{color:"#16a34a"}}>{lunas}</span>
                            <span style={{color:"#94a3b8"}}>/{total}</span>
                          </td>
                        )
                      })}
                      <td>{rp(totalTagihan)}</td>
                      <td style={{color:"#16a34a"}}>{totalLunas}</td>
                      <td style={{color:"#dc2626"}}>{totalBelum}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* LEGEND */}
            <div style={{display:"flex", gap:16, fontSize:13, color:"#64748b", marginTop:10}}>
              <span><span style={{color:"#16a34a", fontWeight:700}}>✓</span> = Sudah Lunas</span>
              <span><span style={{color:"#dc2626", fontWeight:700}}>✗</span> = Belum Bayar</span>
              <span><span style={{color:"#94a3b8"}}>—</span> = Tidak Ada Tagihan</span>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}