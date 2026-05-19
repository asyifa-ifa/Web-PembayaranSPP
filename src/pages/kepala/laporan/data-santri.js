import { useEffect, useState } from "react"
import KepalaLayout from "@/components/KepalaLayout"

export default function DataSantri() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState("")
  const [search, setSearch]   = useState("")

  // ✅ ambil daftar kelas (FIX)
  useEffect(() => {
    fetch("/api/classes/list")
      .then(r => r.json())
      .then(d => setClasses(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  // ✅ ambil data santri (FIX: tanpa academicYear)
  useEffect(() => {
    setLoading(true)

    const params = new URLSearchParams()
    if (classId) params.set("classId", classId)

    fetch(`/api/students/rekap?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        const raw = Array.isArray(d) ? d : []

        const mapped = raw.map(item => ({
          id: item.id,
          name: item.student?.name,
          nis: item.student?.nis,
          nisn: item.student?.nisn,
          gender: item.student?.gender,
          entryYear: item.student?.entryYear,
          class: item.class
        }))

        setData(mapped)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [classId])

  // ✅ search: nama + NIS + NISN
  const filtered = data.filter(r => {
    const nama = (r.name || "").toLowerCase()
    const nis  = (r.nis || "").toLowerCase()
    const nisn = (r.nisn || "").toLowerCase()
    const q    = search.toLowerCase()
    return nama.includes(q) || nis.includes(q) || nisn.includes(q)
  })

  const lakiLaki  = filtered.filter(r => r.gender === "L").length
  const perempuan = filtered.filter(r => r.gender === "P").length

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
        .filter-label { font-size: 12px; font-weight: 600; color: #6b7280; }
        select, .search-input {
          padding: 8px 12px; border: 1px solid #d1fae5; border-radius: 8px;
          font-size: 13px; background: #f7faf8; outline: none;
        }
        .search-input { flex: 1; }

        .summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .sum-card { background: #fff; border: 1px solid #e4e9e6; border-radius: 14px; padding: 16px; text-align: center; }
        .sum-card.green { border-top: 3px solid #22c55e; }
        .sum-card.blue { border-top: 3px solid #1976d2; }
        .sum-card.purple { border-top: 3px solid #7c3aed; }

        .card { background: #fff; border: 1px solid #e4e9e6; border-radius: 16px; overflow: hidden; }
        .card-header {
          background: #f7faf8; border-bottom: 1.5px solid #e4e9e6;
          padding: 13px 18px; display: flex; align-items: center; gap: 8px;
        }

        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 14px; border-bottom: 1px solid #f0f4f0; }

        .badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .badge.blue { background: #dbeafe; color: #1e40af; }
        .badge.pink { background: #fce7f3; color: #9d174d; }

        .empty { padding: 50px; text-align: center; color: #9ab5a3; }
        .loading-box { padding: 60px; text-align: center; color: #9ab5a3; }
      `}</style>

      <div className="wrap">
        <div className="page-title">🎓 Data Santri</div>
        <div className="page-sub">Daftar seluruh santri aktif</div>

        <div className="toolbar">
          <span className="filter-label">Filter:</span>
          <select value={classId} onChange={e => setClassId(e.target.value)}>
            <option value="">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
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
            <div>Total Santri</div>
            <div>{filtered.length}</div>
          </div>
          <div className="sum-card blue">
            <div>Laki-laki</div>
            <div>{lakiLaki}</div>
          </div>
          <div className="sum-card purple">
            <div>Perempuan</div>
            <div>{perempuan}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span>Daftar Santri</span>
          </div>

          {loading ? (
            <div className="loading-box">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">Tidak ada data santri ditemukan.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIS</th>
                  <th>NISN</th>
                  <th>Nama</th>
                  <th>Kelas</th>
                  <th>L/P</th>
                  <th>Tahun</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id}>
                    <td>{i + 1}</td>
                    <td>{row.nis || "-"}</td>
                    <td>{row.nisn || "-"}</td>
                    <td>{row.name}</td>
                    <td>{row.class?.name || "-"}</td>
                    <td>
                      <span className={`badge ${row.gender === "L" ? "blue" : "pink"}`}>
                        {row.gender}
                      </span>
                    </td>
                    <td>{row.entryYear || "-"}</td>
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