// pages/kepala/laporan/data-santri.js
import { useEffect, useState } from "react"
import KepalaLayout from "@/components/KepalaLayout"

export default function DataSantri() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState("")
  const [search, setSearch]   = useState("")

  useEffect(() => {
    fetch("/api/classes")
      .then(r => r.json())
      .then(d => setClasses(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (classId) params.set("classId", classId)

    fetch(`/api/reports/rekap-santri?${params.toString()}`)
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : d?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [classId])

  // ✅ FIX: tambah NIS ke pencarian
  const filtered = data.filter(r => {
    const nama = (r.name || r.nama || "").toLowerCase()
    const nis  = (r.nis || "").toLowerCase()
    const nisn = (r.nisn || "").toLowerCase()
    const q    = search.toLowerCase()
    return nama.includes(q) || nis.includes(q) || nisn.includes(q)
  })

  const lakiLaki   = filtered.filter(r => r.gender === "L" || r.jenisKelamin === "L").length
  const perempuan  = filtered.filter(r => r.gender === "P" || r.jenisKelamin === "P").length

  return (
    <KepalaLayout>
      <style jsx>{`
        /* 🔥 TIDAK DIUBAH SAMA SEKALI */
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
        .sum-card.green  { border-top: 3px solid #22c55e; }
        .sum-card.blue   { border-top: 3px solid #1976d2; }
        .sum-card.purple { border-top: 3px solid #7c3aed; }
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
        .badge.blue  { background: #dbeafe; color: #1e40af; }
        .badge.pink  { background: #fce7f3; color: #9d174d; }

        .empty { padding: 50px; text-align: center; color: #9ab5a3; font-size: 14px; }
        .loading-box { padding: 60px; text-align: center; color: #9ab5a3; }
      `}</style>

      <div className="wrap">
        <div className="page-title">🎓 Data Santri</div>
        <div className="page-sub">Daftar seluruh santri aktif</div>

        <div className="toolbar">
          <span className="filter-label">Filter:</span>
          <select value={classId} onChange={e => setClassId(e.target.value)}>
            <option value="">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            className="search-input"
            placeholder="🔍 Cari nama / NIS / NISN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="summary-row">
          <div className="sum-card green">
            <div className="sum-icon">👩‍🎓</div>
            <div className="sum-label">Total Santri</div>
            <div className="sum-val">{filtered.length}</div>
          </div>
          <div className="sum-card blue">
            <div className="sum-icon">👦</div>
            <div className="sum-label">Laki-laki</div>
            <div className="sum-val">{lakiLaki}</div>
          </div>
          <div className="sum-card purple">
            <div className="sum-icon">👧</div>
            <div className="sum-label">Perempuan</div>
            <div className="sum-val">{perempuan}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="dot" />
            <span className="card-title">Daftar Santri</span>
          </div>

          {loading ? (
            <div className="loading-box">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">Tidak ada data santri ditemukan.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>NIS</th> {/* ✅ TAMBAH */}
                    <th>NISN</th>
                    <th>Nama Santri</th>
                    <th>Kelas</th>
                    <th>L/P</th>
                    <th>Tahun Masuk</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const gender = row.gender || row.jenisKelamin
                    return (
                      <tr key={row.id || i}>
                        <td>{i + 1}</td>

                        {/* ✅ NIS (WAJIB) */}
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                          {row.nis || "-"}
                        </td>

                        {/* ✅ NISN OPTIONAL */}
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                          {row.nisn || "-"}
                        </td>

                        <td style={{ fontWeight: 600 }}>
                          {row.name || row.nama || "-"}
                        </td>

                        <td>{row.class?.name || row.kelas || "-"}</td>

                        <td>
                          <span className={`badge ${gender === "L" ? "blue" : "pink"}`}>
                            {gender === "L" ? "👦 L" : gender === "P" ? "👧 P" : "-"}
                          </span>
                        </td>

                        <td>{row.entryYear || row.tahunMasuk || "-"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </KepalaLayout>
  )
}