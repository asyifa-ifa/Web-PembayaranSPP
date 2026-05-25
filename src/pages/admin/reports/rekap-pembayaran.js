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

export default function RekapPembayaran() {
  const [classes, setClasses] = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activeTab, setActiveTab] = useState("detail") // "detail" | "spp"

  // Rekap SPP state
  const [rekapSPP, setRekapSPP] = useState(null)
  const [loadingSPP, setLoadingSPP] = useState(false)
  const [searchedSPP, setSearchedSPP] = useState(false)
  const [filterSPP, setFilterSPP] = useState({ academicYear: "", classId: "" })

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const defaultAcademicYear = currentMonth >= 6
    ? `${currentYear}/${currentYear + 1}`
    : `${currentYear - 1}/${currentYear}`

  const [academicYears] = useState(generateAcademicYears())

  const [filter, setFilter] = useState({
    academicYear: defaultAcademicYear,
    classId: "",
    paymentTypeId: "",
    status: "",
  })

  useEffect(() => {
    fetch("/api/classes/list").then(r => r.json()).then(setClasses)
    fetch("/api/payment-types").then(r => r.json()).then(setPaymentTypes)
  }, [])

  async function handleSearch() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.academicYear) params.append("academicYear", filter.academicYear)
      if (filter.classId) params.append("classId", filter.classId)
      if (filter.paymentTypeId) params.append("paymentTypeId", filter.paymentTypeId)
      if (filter.status) params.append("status", filter.status)

      const res = await fetch(`/api/reports/rekap-pembayaran?${params.toString()}`)
      const json = await res.json()
      if (Array.isArray(json)) {
        setData(json)
      } else {
        alert("Error: " + (json.message || "Gagal mengambil data"))
        setData([])
      }
      setSearched(true)
    } catch (err) {
      alert("Gagal mengambil data")
      setData([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSearchSPP() {
    if (!filterSPP.academicYear) return alert("Pilih tahun ajaran dulu")
    setLoadingSPP(true)
    try {
      const params = new URLSearchParams()
      params.append("academicYear", filterSPP.academicYear)
      if (filterSPP.classId) params.append("classId", filterSPP.classId)

      const res = await fetch(`/api/reports/rekap-spp?${params.toString()}`)
      const json = await res.json()
      setRekapSPP(json)
      setSearchedSPP(true)
    } catch (err) {
      alert("Gagal mengambil data rekap SPP")
    } finally {
      setLoadingSPP(false)
    }
  }

  function cetakRekapSPP() {
    window.print()
  }

  const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID")
  const totalAll = data.reduce((s, d) => s + Number(d.amount || 0), 0)
  const grouped = paymentTypes.map(pt => {
    const items = data.filter(d => d.paymentType?.id === pt.id)
    return {
      name: pt.name,
      total: items.reduce((s, d) => s + Number(d.amount || 0), 0),
      count: items.length,
    }
  })

  async function exportExcel() {
    const XLSX = await import("xlsx")
    const rows = data.map((d, i) => ({
      No: i + 1,
      "Nama Santri": d.student?.name || "-",
      Kelas: d.student?.class?.name || "-",
      "Jenis Pembayaran": d.paymentType?.name || "-",
      Jumlah: d.amount || 0,
      Status: d.status === "PAID" ? "Sudah Bayar" : "Belum Bayar",
      Tanggal: d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID") : "-",
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Pembayaran")
    XLSX.writeFile(wb, "Rekap_Pembayaran.xlsx")
  }

  async function exportPDF() {
    const jsPDFModule = await import("jspdf")
    const jsPDF = jsPDFModule.jsPDF
    await import("jspdf-autotable")
    const doc = new jsPDF({ orientation: "landscape" })
    doc.setFontSize(16)
    doc.text("REKAP PEMBAYARAN SANTRI", 148, 15, { align: "center" })
    if (typeof doc.autoTable === "function") {
      doc.autoTable({
        startY: 25,
        head: [["No", "Nama", "Kelas", "Jenis", "Jumlah", "Status"]],
        body: data.map((d, i) => [
          i + 1,
          d.student?.name || "-",
          d.student?.class?.name || "-",
          d.paymentType?.name || "-",
          rp(d.amount),
          d.status === "PAID" ? "Sudah" : "Belum",
        ]),
      })
      doc.save("Rekap_Pembayaran.pdf")
    } else {
      alert("Gagal memuat ekspor PDF.")
    }
  }

  return (
    <AdminLayout>
      <style jsx>{`
        .page { padding: 10px 0 40px; }
        .title { margin-bottom: 22px; }
        .title h2 { font-size: 32px; margin: 0; color: #153728; }
        .title p { margin-top: 4px; color: #7d9889; }
        .card { background: #fff; border-radius: 18px; border: 1px solid #e5ebe7; padding: 22px; margin-bottom: 20px; }
        .filter-container { display: flex; flex-direction: column; gap: 16px; }
        .filter-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .filter-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .filter-actions { display: flex; justify-content: flex-end; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 13px; font-weight: 600; color: #53705f; }
        .field input, .field select { height: 44px; border-radius: 10px; border: 1px solid #dfe7e2; padding: 0 12px; font-size: 14px; outline: none; background-color: #fff; }
        .btn { height: 44px; border: none; border-radius: 10px; background: #3a8f50; color: white; padding: 0 32px; font-weight: 600; cursor: pointer; }
        .btn:hover { background: #2d733e; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
        .sum-card { background: white; border-radius: 16px; border: 1px solid #e4e9e6; padding: 20px; }
        .sum-card h3 { margin: 0; color: #789080; font-size: 14px; }
        .sum-card h1 { margin: 8px 0 0; font-size: 34px; color: #132f22; }
        .table-card { background: white; border-radius: 16px; border: 1px solid #e4e9e6; overflow: hidden; margin-bottom: 20px; }
        .table-header { padding: 16px 20px; font-size: 18px; font-weight: 700; border-bottom: 1px solid #edf2ef; color: #153728; display: flex; justify-content: space-between; align-items: center; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f7faf8; padding: 12px 14px; font-size: 12px; text-align: center; color: #53705f; font-weight: 600; border: 1px solid #e4e9e6; }
        th.left { text-align: left; }
        td { padding: 12px 14px; border: 1px solid #edf2ef; font-size: 13px; color: #333; text-align: center; }
        td.left { text-align: left; }
        .badge-paid { background: #e8f5e9; color: #2e7d32; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
        .badge-unpaid { background: #ffebee; color: #c62828; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
        .export { display: flex; gap: 10px; margin-bottom: 20px; }
        .btn-export { border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .excel { background: #e8f5e9; color: #2e7d32; }
        .pdf { background: #ffebee; color: #c62828; }
        .print { background: #e3f2fd; color: #1565c0; }

        /* TAB */
        .tab-wrapper { display: flex; background: #f1f5f1; border-radius: 12px; padding: 4px; gap: 4px; margin-bottom: 20px; }
        .tab-btn { flex: 1; padding: 10px; border-radius: 9px; border: none; font-weight: 600; font-size: 14px; cursor: pointer; transition: all .2s; background: transparent; color: #64748b; }
        .tab-btn.active { background: white; color: #2e6b3e; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

        /* REKAP SPP TABLE */
        .rekap-table-wrap { overflow-x: auto; }
        .rekap-table th { min-width: 80px; font-size: 11px; }
        .rekap-table td { font-size: 12px; }
        .cell-lunas { color: #16a34a; font-weight: 700; font-size: 16px; }
        .cell-belum { color: #dc2626; font-weight: 700; font-size: 16px; }
        .cell-kosong { color: #94a3b8; font-size: 14px; }

        /* Summary rekap */
        .rekap-summary { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
        .rekap-sum-item { font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }

        @media print {
          .no-print { display: none !important; }
          .page { padding: 0; }
          .card { border: none; padding: 0; }
        }
      `}</style>

      <div className="page">
        <div className="title">
          <h2>📊 Dashboard Laporan</h2>
          <p>Rekapan pembayaran & data santri</p>
        </div>

        {/* TAB SELECTOR */}
        <div className="tab-wrapper no-print">
          <button
            className={`tab-btn ${activeTab === "detail" ? "active" : ""}`}
            onClick={() => setActiveTab("detail")}
          >
            📋 Detail Pembayaran
          </button>
          <button
            className={`tab-btn ${activeTab === "spp" ? "active" : ""}`}
            onClick={() => setActiveTab("spp")}
          >
            📅 Rekap SPP Per Bulan
          </button>
        </div>

        {/* ===== TAB 1: DETAIL PEMBAYARAN ===== */}
        {activeTab === "detail" && (
          <>
            <div className="card no-print">
              <div className="filter-container">
                <div className="filter-grid">
                  <div className="field">
                    <label>Tahun Ajaran</label>
                    <select value={filter.academicYear} onChange={(e) => setFilter({ ...filter, academicYear: e.target.value })}>
                      <option value="">-- Pilih Tahun Ajaran --</option>
                      {academicYears.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Kelas</label>
                    <select value={filter.classId} onChange={(e) => setFilter({ ...filter, classId: e.target.value })}>
                      <option value="">-- Semua Kelas --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Jenis Pembayaran</label>
                    <select value={filter.paymentTypeId} onChange={(e) => setFilter({ ...filter, paymentTypeId: e.target.value })}>
                      <option value="">-- Semua Jenis --</option>
                      {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                      <option value="">-- Semua Status --</option>
                      <option value="PAID">Sudah Bayar</option>
                      <option value="UNPAID">Belum Bayar</option>
                    </select>
                  </div>
                </div>
                <div className="filter-actions">
                  <button className="btn" onClick={handleSearch} disabled={loading}>
                    {loading ? "Memuat..." : "Tampilkan Laporan"}
                  </button>
                </div>
              </div>
            </div>

            {searched && (
              <>
                <div className="summary">
                  <div className="sum-card"><h3>Total Pembayaran</h3><h1>{rp(totalAll)}</h1></div>
                  <div className="sum-card"><h3>Transaksi</h3><h1>{data.length}</h1></div>
                  <div className="sum-card"><h3>Santri</h3><h1>{[...new Set(data.map(d => d.student?.id))].length}</h1></div>
                </div>

                <div className="table-card">
                  <div className="table-header">Rincian Per Kategori</div>
                  <table>
                    <thead><tr><th className="left">Kategori</th><th>Transaksi</th><th>Total</th></tr></thead>
                    <tbody>
                      {grouped.map((g, i) => (
                        <tr key={i}><td className="left">{g.name}</td><td>{g.count}</td><td>{rp(g.total)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {data.length > 0 && (
                  <div className="export no-print">
                    <button className="btn-export excel" onClick={exportExcel}>📊 Export Excel</button>
                    <button className="btn-export pdf" onClick={exportPDF}>📄 Export PDF</button>
                  </div>
                )}

                <div className="table-card">
                  <div className="table-header">Detail Pembayaran Santri</div>
                  <table>
                    <thead>
                      <tr>
                        <th className="left">#</th>
                        <th className="left">Nama Santri</th>
                        <th className="left">Kelas</th>
                        <th className="left">Jenis</th>
                        <th>Jumlah</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((d, i) => (
                        <tr key={d.id}>
                          <td className="left">{i + 1}</td>
                          <td className="left">{d.student?.name || "-"}</td>
                          <td className="left">{d.student?.class?.name || "-"}</td>
                          <td className="left">{d.paymentType?.name || "-"}</td>
                          <td>{rp(d.amount)}</td>
                          <td>{d.status === "PAID" ? <span className="badge-paid">✓ Sudah Bayar</span> : <span className="badge-unpaid">✗ Belum Bayar</span>}</td>
                          <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID") : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== TAB 2: REKAP SPP PER BULAN ===== */}
        {activeTab === "spp" && (
          <>
            <div className="card no-print">
              <div className="filter-container">
                <div className="filter-grid-2">
                  <div className="field">
                    <label>Tahun Ajaran <span style={{color:"#ef4444"}}>*</span></label>
                    <select value={filterSPP.academicYear} onChange={e => setFilterSPP({...filterSPP, academicYear: e.target.value})}>
                      <option value="">-- Pilih Tahun Ajaran --</option>
                      {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Kelas</label>
                    <select value={filterSPP.classId} onChange={e => setFilterSPP({...filterSPP, classId: e.target.value})}>
                      <option value="">-- Semua Kelas --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="filter-actions">
                  <button className="btn" onClick={handleSearchSPP} disabled={loadingSPP}>
                    {loadingSPP ? "Memuat..." : "Tampilkan Rekap SPP"}
                  </button>
                </div>
              </div>
            </div>

            {searchedSPP && rekapSPP && (
              <>
                <div className="export no-print">
                  <button className="btn-export print" onClick={cetakRekapSPP}>🖨️ Cetak Rekap</button>
                </div>

                {/* Header cetak */}
                <div style={{textAlign:"center", marginBottom:16, display:"none"}} className="print-header">
                  <h2 style={{margin:0}}>REKAP SPP SANTRI</h2>
                  <p style={{margin:"4px 0"}}>Madrasah Tarbiyatul Mubalighin Sumberjo</p>
                  <p style={{margin:0}}>Tahun Ajaran {filterSPP.academicYear} {filterSPP.classId ? `— ${classes.find(c=>String(c.id)===filterSPP.classId)?.name}` : "— Semua Kelas"}</p>
                </div>

                <div className="table-card">
                  <div className="table-header">
                    <span>Rekap SPP — {filterSPP.academicYear}</span>
                    <span style={{fontSize:13, color:"#64748b", fontWeight:400}}>
                      {rekapSPP.santri?.length || 0} santri · {rekapSPP.bulan?.length || 0} bulan
                    </span>
                  </div>
                  <div className="rekap-table-wrap">
                    <table className="rekap-table">
                      <thead>
                        <tr>
                          <th className="left" style={{minWidth:40}}>No</th>
                          <th className="left" style={{minWidth:180}}>Nama Santri</th>
                          <th className="left" style={{minWidth:100}}>Kelas</th>
                          {rekapSPP.bulan?.map(bln => (
                            <th key={bln}>{bln}</th>
                          ))}
                          <th>Lunas</th>
                          <th>Belum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rekapSPP.santri?.length === 0 ? (
                          <tr><td colSpan={rekapSPP.bulan?.length + 5} style={{textAlign:"center", padding:40, color:"#94a3b8"}}>Belum ada data tagihan SPP</td></tr>
                        ) : rekapSPP.santri?.map((s, i) => {
                          const lunasCount = rekapSPP.bulan?.filter(b => s.bulan[b] === "PAID").length || 0
                          const belumCount = rekapSPP.bulan?.filter(b => s.bulan[b] === "UNPAID").length || 0
                          return (
                            <tr key={s.id}>
                              <td className="left">{i + 1}</td>
                              <td className="left" style={{fontWeight:600}}>{s.name}</td>
                              <td className="left">{s.kelas}</td>
                              {rekapSPP.bulan?.map(bln => (
                                <td key={bln}>
                                  {s.bulan[bln] === "PAID"
                                    ? <span className="cell-lunas">✓</span>
                                    : s.bulan[bln] === "UNPAID"
                                    ? <span className="cell-belum">✗</span>
                                    : <span className="cell-kosong">—</span>
                                  }
                                </td>
                              ))}
                              <td><span style={{color:"#16a34a", fontWeight:700}}>{lunasCount}</span></td>
                              <td><span style={{color:"#dc2626", fontWeight:700}}>{belumCount}</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{background:"#f7faf8"}}>
                          <td colSpan={3} className="left" style={{fontWeight:700, fontSize:12}}>Total Lunas per Bulan</td>
                          {rekapSPP.bulan?.map(bln => {
                            const lunas = rekapSPP.santri?.filter(s => s.bulan[bln] === "PAID").length || 0
                            const total = rekapSPP.santri?.filter(s => s.bulan[bln] !== undefined).length || 0
                            return (
                              <td key={bln} style={{fontWeight:700, fontSize:11}}>
                                <span style={{color:"#16a34a"}}>{lunas}</span>
                                <span style={{color:"#94a3b8"}}>/{total}</span>
                              </td>
                            )
                          })}
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Legend */}
                <div style={{display:"flex", gap:16, fontSize:13, color:"#64748b", marginTop:8}}>
                  <span><span style={{color:"#16a34a", fontWeight:700}}>✓</span> = Sudah Lunas</span>
                  <span><span style={{color:"#dc2626", fontWeight:700}}>✗</span> = Belum Bayar</span>
                  <span><span style={{color:"#94a3b8"}}>—</span> = Tidak Ada Tagihan</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}