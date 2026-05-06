// pages/admin/laporan/absensi.js
import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

export default function AbsensiSantri() {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [waliKelas, setWaliKelas] = useState(null)
  const [kepala, setKepala] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({
    classId: "",
    tanggal: new Date().toISOString().slice(0, 10)
  })
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetch("/api/classes/list").then(r => r.json()).then(setClasses).catch(() => {})
    // Ambil kepala madrasah (jabatan mengandung "kepala")
    fetch("/api/ustadz/list")
      .then(r => r.json())
      .then(list => {
        const kep = list.find(u => u.jabatan?.toLowerCase().includes("kepala"))
        setKepala(kep || null)
      })
      .catch(() => {})
  }, [])

  async function handleSearch() {
    setLoading(true)
    setSearched(false)
    try {
      const url = `/api/students/list${filter.classId ? `?classId=${filter.classId}` : ""}`
      const res = await fetch(url)
      const json = await res.json()
      setStudents(json)

      // Cari wali kelas dari ustadz
      if (filter.classId) {
        const uRes = await fetch("/api/ustadz/list")
        const uList = await uRes.json()
        const wali = uList.find(u => String(u.classId) === String(filter.classId))
        setWaliKelas(wali || null)
      } else {
        setWaliKelas(null)
      }

      setSearched(true)
    } catch {
      alert("Gagal mengambil data")
    } finally {
      setLoading(false)
    }
  }

  const namaKelas = classes.find(c => String(c.id) === String(filter.classId))?.name || "Semua Kelas"

  const tanggalFormatted = filter.tanggal
    ? new Date(filter.tanggal).toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      })
    : "-"

  return (
    <AdminLayout>
      <style jsx>{`
        .page-wrapper { padding: 8px 0 40px; }
        .page-header { margin-bottom: 24px; }
        .page-header h2 { font-size: 20px; font-weight: 700; color: #1a3d28; margin: 0 0 4px; }
        .page-header span { font-size: 13px; color: #7a9a85; }

        .filter-card {
          background: #fff; border: 1px solid #e4e9e6;
          border-radius: 14px; padding: 20px; margin-bottom: 20px;
        }
        .filter-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a8f50; }
        .filter-card-header span { font-size: 12px; font-weight: 700; color: #3a8f50; text-transform: uppercase; letter-spacing: 0.6px; }
        .filter-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 12px; font-weight: 600; color: #5a7a66; }
        .field select, .field input {
          border: 1.5px solid #dde5e0; border-radius: 8px; padding: 9px 12px;
          font-size: 13.5px; color: #1a3d28; background: #fafcfb; outline: none;
          font-family: inherit; transition: border-color 0.2s;
        }
        .field select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7a66' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px;
        }
        .field select:focus, .field input:focus {
          border-color: #3a8f50; box-shadow: 0 0 0 3px rgba(58,143,80,0.1);
        }

        .btn-search {
          background: #3a8f50; color: #fff; border: none;
          padding: 10px 22px; border-radius: 8px; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .btn-search:hover { background: #2e7340; }
        .btn-print {
          background: #fff8e6; color: #b07800; border: 1.5px solid #e6d08a;
          padding: 10px 20px; border-radius: 8px; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: inherit; transition: 0.15s;
        }
        .btn-print:hover { background: #fdf0c0; }

        /* WALI KELAS INFO */
        .wali-info {
          background: #edf7ef; border: 1px solid #c3dfc9; border-radius: 10px;
          padding: 12px 16px; margin-bottom: 16px; display: flex;
          align-items: center; gap: 10px;
        }
        .wali-info span { font-size: 13px; color: #2e6b3e; }
        .wali-info strong { font-weight: 700; }

        /* ABSENSI CARD */
        .absensi-card {
          background: #fff; border: 1px solid #e4e9e6;
          border-radius: 14px; overflow: hidden;
        }
        .absensi-header {
          background: #f7faf8; border-bottom: 1.5px solid #e4e9e6;
          padding: 16px 20px; display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 10px;
        }
        .absensi-header-left h3 { font-size: 15px; font-weight: 700; color: #1a3d28; margin: 0 0 2px; }
        .absensi-header-left span { font-size: 12px; color: #7a9a85; }

        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 650px; }
        thead { background: #f7faf8; }
        th { padding: 11px 14px; font-size: 11px; font-weight: 700; color: #5a7a66; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid #e4e9e6; white-space: nowrap; }
        td { padding: 11px 14px; font-size: 13.5px; color: #2d4a35; border-bottom: 1px solid #f0f4f1; vertical-align: middle; }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: #f9fcfa; }

        .absen-box { width: 32px; height: 32px; border: 1.5px solid #dde5e0; border-radius: 6px; display: inline-block; }
        .ket-box { width: 80px; height: 32px; border: 1.5px solid #dde5e0; border-radius: 6px; display: inline-block; }
        .ttd-box { width: 60px; height: 32px; border: 1.5px solid #dde5e0; border-radius: 6px; display: inline-block; }

        .keterangan-footer {
          padding: 12px 20px; border-top: 1px solid #f0f4f1;
          display: flex; gap: 20px; font-size: 11px; color: #9ab5a3;
        }
        .keterangan-footer span strong { color: #5a7a66; }

        /* TTD SECTION */
        .ttd-section {
          display: flex; justify-content: flex-end; gap: 60px;
          padding: 24px 32px 16px; border-top: 1px solid #f0f4f1;
          flex-wrap: wrap;
        }
        .ttd-box-person { text-align: center; min-width: 140px; }
        .ttd-box-person .ttd-label { font-size: 12px; font-weight: 600; color: #5a7a66; margin-bottom: 60px; }
        .ttd-box-person .ttd-name { font-size: 13px; font-weight: 700; color: #1a3d28; border-top: 1.5px solid #1a3d28; padding-top: 6px; }
        .ttd-box-person .ttd-jabatan { font-size: 11px; color: #7a9a85; margin-top: 2px; }

        .empty-state { text-align: center; padding: 60px 20px; color: #9ab5a3; font-size: 14px; }

        /* ===== PRINT STYLES ===== */
        @media print {
          .no-print { display: none !important; }
          .page-wrapper { padding: 0; }
          .absensi-card { border: none; border-radius: 0; box-shadow: none; }

          .print-header { display: block !important; text-align: center; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #000; }
          .print-header h2 { font-size: 15px; font-weight: 800; margin: 0 0 4px; }
          .print-header p { font-size: 11px; margin: 2px 0; }
          .print-wali { display: block !important; font-size: 11px; margin-bottom: 10px; }

          table { min-width: unset; }
          th, td { font-size: 10px; padding: 6px 8px; }
          .absen-box { width: 22px; height: 22px; }
          .ket-box { width: 50px; height: 22px; }
          .ttd-box { width: 50px; height: 22px; }
          tbody tr:hover { background: transparent; }

          .ttd-section { padding: 20px 24px 12px; }
          .ttd-box-person .ttd-label { font-size: 10px; margin-bottom: 50px; }
          .ttd-box-person .ttd-name { font-size: 11px; }
          .ttd-box-person .ttd-jabatan { font-size: 10px; }

          .keterangan-footer { padding: 8px 16px; font-size: 10px; }
        }

        .print-header { display: none; }
        .print-wali { display: none; }
      `}</style>

      <div className="page-wrapper">
        <div className="page-header no-print">
          <h2>Absensi Santri</h2>
          <span>Cetak lembar absensi per kelas</span>
        </div>

        {/* FILTER */}
        <div className="filter-card no-print">
          <div className="filter-card-header">
            <div className="dot" />
            <span>Pilih Kelas & Tanggal</span>
          </div>
          <div className="filter-row">
            <div className="field">
              <label>Kelas</label>
              <select value={filter.classId} onChange={e => setFilter(p => ({ ...p, classId: e.target.value }))} style={{ minWidth: 180 }}>
                <option value="">-- Semua Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tanggal</label>
              <input type="date" value={filter.tanggal} onChange={e => setFilter(p => ({ ...p, tanggal: e.target.value }))} />
            </div>
            <button className="btn-search" onClick={handleSearch} disabled={loading}>
              {loading ? "Memuat..." : "Tampilkan"}
            </button>
            {searched && students.length > 0 && (
              <button className="btn-print" onClick={() => window.print()}>
                🖨️ Cetak
              </button>
            )}
          </div>
        </div>

        {/* WALI KELAS INFO (screen only) */}
        {searched && waliKelas && (
          <div className="wali-info no-print">
            <span>📚</span>
            <span>Wali Kelas <strong>{namaKelas}</strong>: <strong>{waliKelas.name}</strong>
              {waliKelas.jabatan ? ` — ${waliKelas.jabatan}` : ""}
            </span>
          </div>
        )}

        {/* PRINT HEADER */}
        {searched && (
          <>
            <div className="print-header">
              <h2>DAFTAR ABSENSI SANTRI</h2>
              <p>Madrasah Tarbiyatul Mubalighin</p>
              <p>Kelas: {namaKelas} &nbsp;|&nbsp; Tanggal: {tanggalFormatted}</p>
              <p>Jumlah Santri: {students.length} orang</p>
            </div>
            {waliKelas && (
              <div className="print-wali">
                Wali Kelas: <strong>{waliKelas.name}</strong>
              </div>
            )}
          </>
        )}

        {/* TABLE */}
        {searched && (
          <div className="absensi-card">
            <div className="absensi-header no-print">
              <div className="absensi-header-left">
                <h3>{namaKelas}</h3>
                <span>{tanggalFormatted} · {students.length} santri{waliKelas ? ` · Wali: ${waliKelas.name}` : ""}</span>
              </div>
            </div>

            <div className="table-scroll">
              {students.length === 0 ? (
                <div className="empty-state">Tidak ada santri di kelas ini</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Nama Santri</th>
                      <th>NISN</th>
                      <th style={{ width: 45, textAlign: "center" }}>H</th>
                      <th style={{ width: 45, textAlign: "center" }}>S</th>
                      <th style={{ width: 45, textAlign: "center" }}>I</th>
                      <th style={{ width: 45, textAlign: "center" }}>A</th>
                      <th>Keterangan</th>
                      <th style={{ width: 80, textAlign: "center" }}>TTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td style={{ fontSize: 12, color: "#9ab5a3" }}>{s.nisn}</td>
                        <td style={{ textAlign: "center" }}><span className="absen-box" /></td>
                        <td style={{ textAlign: "center" }}><span className="absen-box" /></td>
                        <td style={{ textAlign: "center" }}><span className="absen-box" /></td>
                        <td style={{ textAlign: "center" }}><span className="absen-box" /></td>
                        <td><span className="ket-box" /></td>
                        <td style={{ textAlign: "center" }}><span className="ttd-box" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {students.length > 0 && (
              <>
                <div className="keterangan-footer">
                  <span><strong>H</strong> = Hadir</span>
                  <span><strong>S</strong> = Sakit</span>
                  <span><strong>I</strong> = Izin</span>
                  <span><strong>A</strong> = Alpa</span>
                </div>

                {/* TTD KEPALA & WALI KELAS */}
                <div className="ttd-section">
                  <div className="ttd-box-person">
                    <div className="ttd-label">Kepala Madrasah</div>
                    <div className="ttd-name">{kepala?.name || "___________________"}</div>
                    <div className="ttd-jabatan">{kepala?.jabatan || "Kepala Madrasah"}</div>
                  </div>
                  <div className="ttd-box-person">
                    <div className="ttd-label">Wali Kelas {namaKelas}</div>
                    <div className="ttd-name">{waliKelas?.name || "___________________"}</div>
                    <div className="ttd-jabatan">{waliKelas?.jabatan || "Wali Kelas"}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}