// pages/admin/laporan/rekap-santri.js
import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

export default function RekapSantri() {
  const [academicYears, setAcademicYears] = useState([])
  const [selectedYear, setSelectedYear] = useState("")
  const [customYear, setCustomYear] = useState("")
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetch("/api/students/academic-years")
      .then(r => r.json())
      .then(years => {
        setAcademicYears(years)
        if (years.length > 0) setSelectedYear(years[0])
      })
      .catch(() => {})
  }, [])

  async function handleSearch() {
    const year = customYear.trim() || selectedYear
    if (!year) return alert("Pilih atau masukkan tahun ajaran")

    setLoading(true)
    setSearched(false)
    try {
      const res = await fetch(`/api/students/rekap?academicYear=${encodeURIComponent(year)}`)
      const json = await res.json()
      setData(json)
      setSearched(true)
    } catch {
      alert("Gagal mengambil data")
    } finally {
      setLoading(false)
    }
  }

  const activeYear = customYear.trim() || selectedYear

  // Ringkasan per kelas
  const perKelas = data.reduce((acc, row) => {
    const nama = row.class?.name || "-"
    if (!acc[nama]) acc[nama] = { name: nama, total: 0, L: 0, P: 0 }
    acc[nama].total++
    if (row.student?.gender === "L") acc[nama].L++
    else acc[nama].P++
    return acc
  }, {})

  const totalL = data.filter(r => r.student?.gender === "L").length
  const totalP = data.filter(r => r.student?.gender === "P").length

  // =====================
  // EXPORT EXCEL
  // =====================
  async function exportExcel() {
    const XLSX = await import("xlsx")

    const rows = data.map((r, i) => ({
      "No": i + 1,
      "NISN": r.student?.nisn || "-",
      "Nama Santri": r.student?.name || "-",
      "Kelas": r.class?.name || "-",
      "Jenis Kelamin": r.student?.gender === "L" ? "Laki-laki" : "Perempuan",
      "Nama Wali": r.student?.guardian || "-",
      "Tahun Masuk": r.student?.entryYear || "-",
      "Status": r.student?.status === "ACTIVE" ? "Aktif" : r.student?.status === "GRADUATED" ? "Lulus" : "Keluar",
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Rekap ${activeYear}`)

    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] || "").length)) + 2
    }))
    ws["!cols"] = colWidths

    XLSX.writeFile(wb, `Rekap_Santri_${activeYear.replace("/", "-")}.xlsx`)
  }

  // =====================
  // EXPORT PDF
  // =====================
  async function exportPDF() {
    const jsPDFModule = await import("jspdf")
    const jsPDF = jsPDFModule.jsPDF
    await import("jspdf-autotable")

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("REKAP DATA SANTRI", 148, 15, { align: "center" })
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(`Tahun Ajaran: ${activeYear}`, 148, 22, { align: "center" })
    doc.text(`Madrasah Tarbiyatul Mubalighin`, 148, 28, { align: "center" })

    doc.setDrawColor(58, 143, 80)
    doc.setLineWidth(0.5)
    doc.line(14, 31, 283, 31)

    doc.autoTable({
      startY: 35,
      head: [["No", "NISN", "Nama Santri", "Kelas", "JK", "Wali", "Thn Masuk", "Status"]],
      body: data.map((r, i) => [
        i + 1,
        r.student?.nisn || "-",
        r.student?.name || "-",
        r.class?.name || "-",
        r.student?.gender === "L" ? "L" : "P",
        r.student?.guardian || "-",
        r.student?.entryYear || "-",
        r.student?.status === "ACTIVE" ? "Aktif" : r.student?.status === "GRADUATED" ? "Lulus" : "Keluar",
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [58, 143, 80], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 250, 246] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 28 },
        2: { cellWidth: 55 },
        3: { cellWidth: 35 },
        4: { cellWidth: 12 },
        5: { cellWidth: 40 },
        6: { cellWidth: 22 },
        7: { cellWidth: 18 },
      },
    })

    const finalY = doc.lastAutoTable.finalY + 6
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`Total Santri: ${data.length}  |  Laki-laki: ${totalL}  |  Perempuan: ${totalP}`, 14, finalY)

    doc.save(`Rekap_Santri_${activeYear.replace("/", "-")}.pdf`)
  }

  return (
    <AdminLayout>
      <style jsx>{`
        .page-wrapper { padding: 8px 0 40px; }

        .page-header { margin-bottom: 24px; }
        .page-header h2 {
          font-size: 20px; font-weight: 700; color: #1a3d28; margin: 0 0 4px;
        }
        .page-header span { font-size: 13px; color: #7a9a85; }

        /* FILTER CARD */
        .filter-card {
          background: #fff;
          border: 1px solid #e4e9e6;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .filter-card-header {
          display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a8f50; }
        .filter-card-header span {
          font-size: 12px; font-weight: 700; color: #3a8f50;
          text-transform: uppercase; letter-spacing: 0.6px;
        }

        .filter-row {
          display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;
        }

        .filter-group { display: flex; flex-direction: column; gap: 6px; }
        .filter-group label { font-size: 12px; font-weight: 600; color: #5a7a66; }

        .filter-select, .filter-input {
          border: 1.5px solid #dde5e0; border-radius: 8px;
          padding: 9px 12px; font-size: 14px; color: #1a3d28;
          background: #fafcfb; outline: none; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .filter-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7a66' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center;
          padding-right: 32px; cursor: pointer;
        }
        .filter-select:focus, .filter-input:focus {
          border-color: #3a8f50; box-shadow: 0 0 0 3px rgba(58,143,80,0.1);
        }
        .filter-input::placeholder { color: #b0c4b8; font-size: 13px; }

        .divider-or {
          font-size: 12px; color: #9ab5a3; font-weight: 600;
          padding-bottom: 10px;
        }

        .btn-search {
          background: #3a8f50; color: #fff; border: none;
          padding: 10px 22px; border-radius: 8px; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          transition: background 0.2s;
        }
        .btn-search:hover { background: #2e7340; }
        .btn-search:disabled { opacity: 0.6; cursor: not-allowed; }

        /* SUMMARY */
        .summary-row {
          display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
        }

        .sum-card {
          background: #fff; border: 1px solid #e4e9e6; border-radius: 12px;
          padding: 14px 20px; min-width: 130px;
        }
        .sum-card .sum-label {
          font-size: 11px; font-weight: 600; color: #8aab96;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .sum-card .sum-val {
          font-size: 22px; font-weight: 700; color: #1a3d28;
        }
        .sum-card .sum-sub { font-size: 11px; color: #9ab5a3; margin-top: 2px; }

        /* EXPORT BUTTONS */
        .export-row {
          display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;
        }

        .btn-export {
          padding: 8px 16px; border-radius: 8px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          transition: 0.15s; border: 1.5px solid transparent;
        }
        .btn-excel {
          background: #e8f5e9; color: #2e7340; border-color: #a5d6a7;
        }
        .btn-excel:hover { background: #c8e6c9; }
        .btn-pdf {
          background: #ffeaea; color: #c62828; border-color: #ef9a9a;
        }
        .btn-pdf:hover { background: #ffcdd2; }

        /* PER KELAS */
        .kelas-grid {
          display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;
        }
        .kelas-badge {
          background: #f7faf8; border: 1px solid #e4e9e6; border-radius: 10px;
          padding: 8px 14px; font-size: 12px;
        }
        .kelas-badge strong { color: #1a3d28; display: block; margin-bottom: 2px; }
        .kelas-badge span { color: #7a9a85; }

        /* TABLE */
        .table-card {
          background: #fff; border: 1px solid #e4e9e6;
          border-radius: 14px; overflow: hidden;
        }
        .table-card-header {
          background: #f7faf8; border-bottom: 1.5px solid #e4e9e6;
          padding: 13px 20px; display: flex; align-items: center; gap: 8px;
        }
        .table-card-header span {
          font-size: 12px; font-weight: 700; color: #3a8f50;
          text-transform: uppercase; letter-spacing: 0.5px;
        }

        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 750px; }

        th {
          padding: 11px 14px; font-size: 11px; font-weight: 700;
          color: #5a7a66; text-transform: uppercase; letter-spacing: 0.5px;
          text-align: left; white-space: nowrap;
        }
        td {
          padding: 10px 14px; font-size: 13.5px; color: #2d4a35;
          border-bottom: 1px solid #f0f4f1; vertical-align: middle;
        }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: #f9fcfa; }

        .badge {
          display: inline-block; padding: 2px 8px; border-radius: 20px;
          font-size: 11px; font-weight: 600;
        }
        .badge-l { background: #e3f0ff; color: #2563a8; }
        .badge-p { background: #fde8f0; color: #a8256b; }
        .badge-active { background: #edf7ef; color: #2e6b3e; border: 1px solid #c3dfc9; }
        .badge-dropped { background: #fff0f0; color: #d32f2f; border: 1px solid #f5bebe; }
        .badge-graduated { background: #e8f0ff; color: #2551a8; border: 1px solid #b8c9f5; }

        .empty-state {
          text-align: center; padding: 60px 20px; color: #9ab5a3; font-size: 14px;
        }
        .empty-state p { margin: 8px 0 0; font-size: 12px; }
      `}</style>

      <div className="page-wrapper">
        <div className="page-header">
          <h2>Rekap Santri Per Tahun Ajaran</h2>
          <span>Lihat dan export data santri berdasarkan tahun ajaran</span>
        </div>

        {/* FILTER */}
        <div className="filter-card">
          <div className="filter-card-header">
            <div className="dot" />
            <span>Pilih Tahun Ajaran</span>
          </div>
          <div className="filter-row">
            <div className="filter-group">
              <label>Dari data tersimpan</label>
              <select
                className="filter-select"
                value={selectedYear}
                onChange={e => { setSelectedYear(e.target.value); setCustomYear("") }}
                style={{ minWidth: 160 }}
              >
                <option value="">-- Pilih tahun --</option>
                {academicYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <span className="divider-or">atau</span>

            <div className="filter-group">
              <label>Ketik manual</label>
              <input
                className="filter-input"
                placeholder="contoh: 2024/2025"
                value={customYear}
                onChange={e => { setCustomYear(e.target.value); setSelectedYear("") }}
                style={{ width: 150 }}
              />
            </div>

            <button
              className="btn-search"
              onClick={handleSearch}
              disabled={loading || (!selectedYear && !customYear.trim())}
            >
              {loading ? "Mencari..." : "Tampilkan"}
            </button>
          </div>
        </div>

        {/* HASIL */}
        {searched && (
          <>
            {/* SUMMARY */}
            <div className="summary-row">
              <div className="sum-card">
                <div className="sum-label">Total Santri</div>
                <div className="sum-val">{data.length}</div>
                <div className="sum-sub">Tahun {activeYear}</div>
              </div>
              <div className="sum-card">
                <div className="sum-label">Laki-laki</div>
                <div className="sum-val" style={{ color: "#2563a8" }}>{totalL}</div>
              </div>
              <div className="sum-card">
                <div className="sum-label">Perempuan</div>
                <div className="sum-val" style={{ color: "#a8256b" }}>{totalP}</div>
              </div>
              <div className="sum-card">
                <div className="sum-label">Jumlah Kelas</div>
                <div className="sum-val">{Object.keys(perKelas).length}</div>
              </div>
            </div>

            {/* PER KELAS */}
            {Object.keys(perKelas).length > 0 && (
              <div className="kelas-grid">
                {Object.values(perKelas).map(k => (
                  <div key={k.name} className="kelas-badge">
                    <strong>{k.name}</strong>
                    <span>{k.total} santri · {k.L}L {k.P}P</span>
                  </div>
                ))}
              </div>
            )}

            {/* EXPORT */}
            {data.length > 0 && (
              <div className="export-row">
                <button className="btn-export btn-excel" onClick={exportExcel}>
                  📊 Export Excel
                </button>
                <button className="btn-export btn-pdf" onClick={exportPDF}>
                  📄 Export PDF
                </button>
              </div>
            )}

            {/* TABLE */}
            <div className="table-card">
              <div className="table-card-header">
                <div className="dot" />
                <span>Data Santri — {activeYear} ({data.length} santri)</span>
              </div>
              <div className="table-scroll">
                {data.length === 0 ? (
                  <div className="empty-state">
                    Tidak ada data santri untuk tahun ajaran <strong>{activeYear}</strong>
                    <p>Pastikan proses naik kelas sudah dilakukan untuk tahun ajaran ini</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>NISN</th>
                        <th>Nama Santri</th>
                        <th>Kelas</th>
                        <th>JK</th>
                        <th>Nama Wali</th>
                        <th>Thn Masuk</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((r, i) => (
                        <tr key={r.id}>
                          <td>{i + 1}</td>
                          <td>{r.student?.nisn || "-"}</td>
                          <td style={{ fontWeight: 600 }}>{r.student?.name || "-"}</td>
                          <td>{r.class?.name || "-"}</td>
                          <td>
                            <span className={`badge ${r.student?.gender === "L" ? "badge-l" : "badge-p"}`}>
                              {r.student?.gender === "L" ? "L" : "P"}
                            </span>
                          </td>
                          <td>{r.student?.guardian || "-"}</td>
                          <td>{r.student?.entryYear || "-"}</td>
                          <td>
                            {r.student?.status === "ACTIVE" && <span className="badge badge-active">Aktif</span>}
                            {r.student?.status === "DROPPED" && <span className="badge badge-dropped">Keluar</span>}
                            {r.student?.status === "GRADUATED" && <span className="badge badge-graduated">Lulus</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}