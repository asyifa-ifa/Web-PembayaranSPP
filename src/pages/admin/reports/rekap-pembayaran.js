// pages/admin/reports/rekap-pembayaran.js
import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

export default function RekapPembayaran() {
  const [classes, setClasses] = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [filter, setFilter] = useState({
    academicYear: "",
    classId: "",
    paymentTypeId: "",
    status: "", // PAID | UNPAID | ""
  })

  useEffect(() => {
    fetch("/api/classes/list").then(r => r.json()).then(setClasses).catch(() => {})
    fetch("/api/payment-types/list").then(r => r.json()).then(setPaymentTypes).catch(() => {})
  }, [])

  async function handleSearch() {
    setLoading(true)
    setSearched(false)
    try {
      const params = new URLSearchParams()
      if (filter.academicYear) params.append("academicYear", filter.academicYear)
      if (filter.classId) params.append("classId", filter.classId)
      if (filter.paymentTypeId) params.append("paymentTypeId", filter.paymentTypeId)
      if (filter.status) params.append("status", filter.status)

      const res = await fetch(`/api/reports/rekap-pembayaran?${params.toString()}`)
      const json = await res.json()
      setData(json)
      setSearched(true)
    } catch {
      alert("Gagal mengambil data")
    } finally {
      setLoading(false)
    }
  }

  const rp = n => "Rp " + Number(n || 0).toLocaleString("id-ID")

  const paidCount = data.filter(d => d.status === "PAID").length
  const unpaidCount = data.filter(d => d.status === "UNPAID").length
  const totalPaid = data.filter(d => d.status === "PAID").reduce((s, d) => s + (d.amount || 0), 0)
  const totalUnpaid = data.filter(d => d.status === "UNPAID").reduce((s, d) => s + (d.amount || 0), 0)

  async function exportExcel() {
    const XLSX = await import("xlsx")
    const rows = data.map((d, i) => ({
      "No": i + 1,
      "Nama Santri": d.student?.name || "-",
      "Kelas": d.student?.class?.name || "-",
      "Jenis Pembayaran": d.paymentType?.name || "-",
      "Jumlah": d.amount || 0,
      "Status": d.status === "PAID" ? "Sudah Bayar" : "Belum Bayar",
      "Tanggal": d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID") : "-",
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Pembayaran")
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] || "").length)) + 2
    }))
    ws["!cols"] = colWidths
    XLSX.writeFile(wb, `Rekap_Pembayaran.xlsx`)
  }

  async function exportPDF() {
    const jsPDFModule = await import("jspdf")
    const jsPDF = jsPDFModule.jsPDF
    await import("jspdf-autotable")
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("REKAP PEMBAYARAN SANTRI", 148, 15, { align: "center" })
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Madrasah Tarbiyatul Mubalighin`, 148, 22, { align: "center" })
    doc.setDrawColor(58, 143, 80)
    doc.setLineWidth(0.5)
    doc.line(14, 25, 283, 25)
    doc.autoTable({
      startY: 30,
      head: [["No", "Nama Santri", "Kelas", "Jenis Pembayaran", "Jumlah", "Status", "Tanggal"]],
      body: data.map((d, i) => [
        i + 1,
        d.student?.name || "-",
        d.student?.class?.name || "-",
        d.paymentType?.name || "-",
        rp(d.amount),
        d.status === "PAID" ? "✓ Sudah" : "✗ Belum",
        d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID") : "-",
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [58, 143, 80], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 250, 246] },
      bodyStyles: (row) => row.cells[5]?.raw?.includes("✗") ? { textColor: [211, 47, 47] } : {},
    })
    const finalY = doc.lastAutoTable.finalY + 6
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`Sudah Bayar: ${paidCount} (${rp(totalPaid)})   |   Belum Bayar: ${unpaidCount} (${rp(totalUnpaid)})`, 14, finalY)
    doc.save(`Rekap_Pembayaran.pdf`)
  }

  return (
    <AdminLayout>
      <style jsx>{`
        .page-wrapper { padding: 8px 0 40px; }
        .page-header { margin-bottom: 24px; }
        .page-header h2 { font-size: 20px; font-weight: 700; color: #1a3d28; margin: 0 0 4px; }
        .page-header span { font-size: 13px; color: #7a9a85; }

        .filter-card {
          background: #fff; border: 1px solid #e4e9e6;
          border-radius: 14px; padding: 20px; margin-bottom: 16px;
        }
        .filter-card-header {
          display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a8f50; }
        .filter-card-header span {
          font-size: 12px; font-weight: 700; color: #3a8f50;
          text-transform: uppercase; letter-spacing: 0.6px;
        }
        .filter-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
          align-items: end;
        }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 12px; font-weight: 600; color: #5a7a66; }
        .field select, .field input {
          border: 1.5px solid #dde5e0; border-radius: 8px;
          padding: 9px 12px; font-size: 13.5px; color: #1a3d28;
          background: #fafcfb; outline: none; font-family: inherit;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7a66' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center;
          padding-right: 30px;
          transition: border-color 0.2s;
        }
        .field select:focus, .field input:focus {
          border-color: #3a8f50; box-shadow: 0 0 0 3px rgba(58,143,80,0.1);
        }
        .field input { background-image: none; padding-right: 12px; }

        .btn-search {
          background: #3a8f50; color: #fff; border: none;
          padding: 10px 22px; border-radius: 8px; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          height: fit-content; align-self: end;
        }
        .btn-search:hover { background: #2e7340; }

        /* SUMMARY */
        .summary-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .sum-card {
          background: #fff; border: 1px solid #e4e9e6;
          border-radius: 12px; padding: 14px 20px; min-width: 150px;
        }
        .sum-label { font-size: 11px; font-weight: 600; color: #8aab96; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .sum-val { font-size: 22px; font-weight: 700; color: #1a3d28; }
        .sum-sub { font-size: 11px; color: #9ab5a3; margin-top: 2px; }

        .export-row { display: flex; gap: 10px; margin-bottom: 16px; }
        .btn-export { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; border: 1.5px solid transparent; }
        .btn-excel { background: #e8f5e9; color: #2e7340; border-color: #a5d6a7; }
        .btn-excel:hover { background: #c8e6c9; }
        .btn-pdf { background: #ffeaea; color: #c62828; border-color: #ef9a9a; }
        .btn-pdf:hover { background: #ffcdd2; }

        /* TABLE */
        .table-card { background: #fff; border: 1px solid #e4e9e6; border-radius: 14px; overflow: hidden; }
        .table-card-header {
          background: #f7faf8; border-bottom: 1.5px solid #e4e9e6;
          padding: 13px 20px; display: flex; align-items: center; gap: 8px;
        }
        .table-card-header span { font-size: 12px; font-weight: 700; color: #3a8f50; text-transform: uppercase; letter-spacing: 0.5px; }
        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 750px; }
        th { padding: 11px 14px; font-size: 11px; font-weight: 700; color: #5a7a66; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; white-space: nowrap; }
        td { padding: 10px 14px; font-size: 13.5px; color: #2d4a35; border-bottom: 1px solid #f0f4f1; vertical-align: middle; }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: #f9fcfa; }

        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .badge-paid { background: #edf7ef; color: #2e6b3e; border: 1px solid #c3dfc9; }
        .badge-unpaid { background: #fff0f0; color: #d32f2f; border: 1px solid #f5bebe; }

        .empty-state { text-align: center; padding: 60px 20px; color: #9ab5a3; font-size: 14px; }

        @media (max-width: 768px) {
          .filter-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="page-wrapper">
        <div className="page-header">
          <h2>Rekap Pembayaran</h2>
          <span>Filter dan export data pembayaran santri</span>
        </div>

        <div className="filter-card">
          <div className="filter-card-header">
            <div className="dot" />
            <span>Filter Data</span>
          </div>
          <div className="filter-grid">
            <div className="field">
              <label>Tahun Ajaran</label>
              <input
                placeholder="contoh: 2024/2025"
                value={filter.academicYear}
                onChange={e => setFilter(p => ({ ...p, academicYear: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Kelas</label>
              <select value={filter.classId} onChange={e => setFilter(p => ({ ...p, classId: e.target.value }))}>
                <option value="">-- Semua Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Jenis Pembayaran</label>
              <select value={filter.paymentTypeId} onChange={e => setFilter(p => ({ ...p, paymentTypeId: e.target.value }))}>
                <option value="">-- Semua Jenis --</option>
                {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
                <option value="">-- Semua Status --</option>
                <option value="PAID">✅ Sudah Bayar</option>
                <option value="UNPAID">❌ Belum Bayar</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn-search" onClick={handleSearch} disabled={loading}>
              {loading ? "Mencari..." : "Tampilkan"}
            </button>
          </div>
        </div>

        {searched && (
          <>
            <div className="summary-row">
              <div className="sum-card">
                <div className="sum-label">Total Tagihan</div>
                <div className="sum-val">{data.length}</div>
              </div>
              <div className="sum-card">
                <div className="sum-label">Sudah Bayar</div>
                <div className="sum-val" style={{ color: "#2e6b3e" }}>{paidCount}</div>
                <div className="sum-sub">{rp(totalPaid)}</div>
              </div>
              <div className="sum-card">
                <div className="sum-label">Belum Bayar</div>
                <div className="sum-val" style={{ color: "#d32f2f" }}>{unpaidCount}</div>
                <div className="sum-sub">{rp(totalUnpaid)}</div>
              </div>
            </div>

            {data.length > 0 && (
              <div className="export-row">
                <button className="btn-export btn-excel" onClick={exportExcel}>📊 Export Excel</button>
                <button className="btn-export btn-pdf" onClick={exportPDF}>📄 Export PDF</button>
              </div>
            )}

            <div className="table-card">
              <div className="table-card-header">
                <div className="dot" />
                <span>Hasil ({data.length} data)</span>
              </div>
              <div className="table-scroll">
                {data.length === 0 ? (
                  <div className="empty-state">Tidak ada data sesuai filter</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nama Santri</th>
                        <th>Kelas</th>
                        <th>Jenis Pembayaran</th>
                        <th>Jumlah</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((d, i) => (
                        <tr key={d.id}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{d.student?.name || "-"}</td>
                          <td>{d.student?.class?.name || "-"}</td>
                          <td>{d.paymentType?.name || "-"}</td>
                          <td style={{ fontWeight: 600 }}>{rp(d.amount)}</td>
                          <td>
                            {d.status === "PAID"
                              ? <span className="badge badge-paid">✓ Sudah Bayar</span>
                              : <span className="badge badge-unpaid">✗ Belum Bayar</span>}
                          </td>
                          <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString("id-ID") : "-"}</td>
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