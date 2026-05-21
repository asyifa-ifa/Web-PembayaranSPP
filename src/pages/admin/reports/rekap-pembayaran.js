import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

// 🌟 Fungsi pembantu otomatis membuat daftar tahun ajaran berdasarkan waktu sistem saat ini
const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear() // Membaca tahun aktif sekarang
  const years = []
  
  // Mengambil rentang otomatis: 3 tahun ke belakang hingga 1 tahun ke depan
  for (let i = currentYear - 3; i <= currentYear + 1; i++) {
    years.push(`${i}/${i + 1}`)
  }
  
  return years.reverse() // Mengurutkan dari tahun terbaru di paling atas
}

export default function RekapPembayaran() {
  const [classes, setClasses] = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // 🌟 Mendapatkan Default Tahun Ajaran saat ini secara otomatis (jika masuk Juli, bergeser otomatis)
  const currentMonth = new Date().getMonth() // 0 = Januari, 6 = Juli
  const currentYear = new Date().getFullYear()
  const defaultAcademicYear = currentMonth >= 6 
    ? `${currentYear}/${currentYear + 1}` 
    : `${currentYear - 1}/${currentYear}`

  // 🌟 Inisialisasi daftar tahun otomatis ke dalam state
  const [academicYears] = useState(generateAcademicYears())

  const [filter, setFilter] = useState({
    academicYear: defaultAcademicYear, // Default langsung mengarah ke tahun ajaran yang sedang aktif
    classId: "",
    paymentTypeId: "",
    status: "",
  })

  useEffect(() => {
    fetch("/api/classes/list")
      .then(r => r.json())
      .then(setClasses)

    fetch("/api/payment-types")
      .then(r => r.json())
      .then(setPaymentTypes)
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
        console.error("API error:", json)
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

    const doc = new jsPDF({
      orientation: "landscape",
    })

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
      alert("Gagal memuat ekspor PDF. Silakan coba kembali.")
    }
  }

  return (
    <AdminLayout>
      <style jsx>{`
        .page {
          padding: 10px 0 40px;
        }

        .title {
          margin-bottom: 22px;
        }

        .title h2 {
          font-size: 32px;
          margin: 0;
          color: #153728;
        }

        .title p {
          margin-top: 4px;
          color: #7d9889;
        }

        .card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid #e5ebe7;
          padding: 22px;
          margin-bottom: 20px;
        }

        /* Pembungkus flex untuk menyatukan struktur grid filter dan tombol aksi */
        .filter-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        /* Memposisikan tombol tampilkan di pojok kanan bawah container filter */
        .filter-actions {
          display: flex;
          justify-content: flex-end;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field label {
          font-size: 13px;
          font-weight: 600;
          color: #53705f;
        }

        .field input,
        .field select {
          height: 44px;
          border-radius: 10px;
          border: 1px solid #dfe7e2;
          padding: 0 12px;
          font-size: 14px;
          outline: none;
          background-color: #fff;
        }

        .btn {
          height: 44px;
          border: none;
          border-radius: 10px;
          background: #3a8f50;
          color: white;
          padding: 0 32px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn:hover {
          background: #2d733e;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .sum-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e4e9e6;
          padding: 20px;
        }

        .sum-card h3 {
          margin: 0;
          color: #789080;
          font-size: 14px;
        }

        .sum-card h1 {
          margin: 8px 0 0;
          font-size: 34px;
          color: #132f22;
        }

        .table-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e4e9e6;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .table-header {
          padding: 16px 20px;
          font-size: 18px;
          font-weight: 700;
          border-bottom: 1px solid #edf2ef;
          color: #153728;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f7faf8;
          padding: 14px;
          font-size: 13px;
          text-align: left;
          color: #53705f;
          font-weight: 600;
        }

        td {
          padding: 14px;
          border-top: 1px solid #edf2ef;
          font-size: 14px;
          color: #333;
        }

        .badge-paid {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }

        .badge-unpaid {
          background: #ffebee;
          color: #c62828;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }

        .export {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .btn-export {
          border: none;
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .excel {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .pdf {
          background: #ffebee;
          color: #c62828;
        }
      `}</style>

      <div className="page">
        <div className="title">
          <h2>📊 Dashboard Laporan</h2>
          <p>Rekapan pembayaran & data santri</p>
        </div>

        <div className="card">
          <div className="filter-container">
            <div className="filter-grid">
              
              {/* 🌟 Berubah dari input teks biasa menjadi Dropdown Select otomatis */}
              <div className="field">
                <label>Tahun Ajaran</label>
                <select
                  value={filter.academicYear}
                  onChange={(e) => setFilter({ ...filter, academicYear: e.target.value })}
                >
                  <option value="">-- Pilih Tahun Ajaran --</option>
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Kelas</label>
                <select
                  value={filter.classId}
                  onChange={(e) => setFilter({ ...filter, classId: e.target.value })}
                >
                  <option value="">-- Semua Kelas --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Jenis Pembayaran</label>
                <select
                  value={filter.paymentTypeId}
                  onChange={(e) => setFilter({ ...filter, paymentTypeId: e.target.value })}
                >
                  <option value="">-- Semua Jenis --</option>
                  {paymentTypes.map(pt => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                  <option value="">-- Semua Status --</option>
                  <option value="PAID">Sudah Bayar</option>
                  <option value="UNPAID">Belum Bayar</option>
                </select>
              </div>
            </div>

            {/* 🌟 Posisi tombol dipindah ke area aksi kanan bawah agar struktur UI lebih bersih */}
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
              <div className="sum-card">
                <h3>Total Pembayaran</h3>
                <h1>{rp(totalAll)}</h1>
              </div>

              <div className="sum-card">
                <h3>Transaksi</h3>
                <h1>{data.length}</h1>
              </div>

              <div className="sum-card">
                <h3>Santri</h3>
                <h1>
                  {[...new Set(data.map(d => d.student?.id))].length}
                </h1>
              </div>
            </div>

            <div className="table-card">
              <div className="table-header">Rincian Pembayaran Per Kategori</div>
              <table>
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Transaksi</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((g, i) => (
                    <tr key={i}>
                      <td>{g.name}</td>
                      <td>{g.count}</td>
                      <td>{rp(g.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.length > 0 && (
              <div className="export">
                <button className="btn-export excel" onClick={exportExcel}>
                  📊 Export Excel
                </button>
                <button className="btn-export pdf" onClick={exportPDF}>
                  📄 Export PDF
                </button>
              </div>
            )}

            <div className="table-card">
              <div className="table-header">Detail Pembayaran Santri</div>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama Santri</th>
                    <th>Kelas</th>
                    <th>Jenis</th>
                    <th>Jumlah</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <tr key={d.id}>
                      <td>{i + 1}</td>
                      <td>{d.student?.name || "-"}</td>
                      <td>{d.student?.class?.name || "-"}</td>
                      <td>{d.paymentType?.name || "-"}</td>
                      <td>{rp(d.amount)}</td>
                      <td>
                        {d.status === "PAID" ? (
                          <span className="badge-paid">✓ Sudah Bayar</span>
                        ) : (
                          <span className="badge-unpaid">✗ Belum Bayar</span>
                        )}
                      </td>
                      <td>
                        {d.createdAt
                          ? new Date(d.createdAt).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}