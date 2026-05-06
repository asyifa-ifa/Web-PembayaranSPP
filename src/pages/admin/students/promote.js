// pages/admin/students/promote.js
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/components/AdminLayout"

export default function PromoteStudents() {
  const router = useRouter()
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [academicYear, setAcademicYear] = useState("")
  const [promotions, setPromotions] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/students/list").then(r => r.json()),
      fetch("/api/classes/list").then(r => r.json()),
    ]).then(([s, c]) => {
      const active = s.filter(st => st.status === "ACTIVE" || !st.status)
      setStudents(active)
      setClasses(c)

      const defaultPromotions = {}
      active.forEach(st => {
        defaultPromotions[st.id] = {
          newClassId: String(st.classId),
          status: "ACTIVE"
        }
      })
      setPromotions(defaultPromotions)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function handleChange(studentId, field, value) {
    setPromotions(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }))
  }

  function handleSelectAll(field, value) {
    setPromotions(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(id => {
        updated[id] = { ...updated[id], [field]: value }
      })
      return updated
    })
  }

  function handleYearChange(e) {
    const val = e.target.value
    setAcademicYear(val)
  }

  async function handleSubmit() {
    const yearVal = academicYear
    if (!yearVal || yearVal.length < 3) {
      alert("Masukkan tahun ajaran baru terlebih dahulu, contoh: 2025/2026")
      return
    }

    const confirmMsg = `Proses naik kelas untuk tahun ajaran ${yearVal}?\n\nData histori kelas akan disimpan.`
    if (!confirm(confirmMsg)) return

    setSaving(true)
    try {
      const payload = Object.entries(promotions).map(([studentId, data]) => ({
        studentId: parseInt(studentId),
        newClassId: parseInt(data.newClassId),
        status: data.status,
      }))

      const res = await fetch("/api/students/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYear: yearVal, promotions: payload }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      alert(`✅ ${data.message}`)
      router.push("/admin/students")
    } catch (e) {
      alert("Error: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  const activeCount = Object.values(promotions).filter(p => p.status === "ACTIVE").length
  const droppedCount = Object.values(promotions).filter(p => p.status === "DROPPED").length
  const graduatedCount = Object.values(promotions).filter(p => p.status === "GRADUATED").length

  const isReady = academicYear.length >= 3 && !saving

  return (
    <AdminLayout>
      <style jsx>{`
        .page-wrapper {
          padding: 8px 0 40px;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1a3d28;
          margin: 0 0 4px;
        }

        .page-header span {
          font-size: 13px;
          color: #7a9a85;
        }

        .year-card {
          background: #fff;
          border: 1px solid #e4e9e6;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .year-card label {
          font-size: 13px;
          font-weight: 600;
          color: #5a7a66;
          white-space: nowrap;
        }

        .year-input {
          border: 1.5px solid #dde5e0;
          border-radius: 8px;
          padding: 9px 14px;
          font-size: 15px;
          font-weight: 600;
          color: #1a3d28;
          outline: none;
          width: 160px;
          font-family: inherit;
          background: #fafcfb;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .year-input:focus {
          border-color: #3a8f50;
          box-shadow: 0 0 0 3px rgba(58,143,80,0.1);
        }

        .year-hint {
          font-size: 12px;
          color: #9ab5a3;
        }

        .summary {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .sum-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .sum-active { background: #edf7ef; color: #2e6b3e; border: 1px solid #c3dfc9; }
        .sum-dropped { background: #fff0f0; color: #d32f2f; border: 1px solid #f5bebe; }
        .sum-graduated { background: #e8f0ff; color: #2551a8; border: 1px solid #b8c9f5; }

        .table-card {
          background: #fff;
          border: 1px solid #e4e9e6;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .table-header {
          background: #f7faf8;
          border-bottom: 1.5px solid #e4e9e6;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .table-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a8f50; }

        .table-header span {
          font-size: 12px;
          font-weight: 700;
          color: #3a8f50;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .bulk-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .bulk-label {
          font-size: 11px;
          color: #7a9a85;
          font-weight: 600;
        }

        .bulk-btn {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid transparent;
          font-family: inherit;
          transition: 0.15s;
        }
        .bulk-active { background: #edf7ef; color: #2e6b3e; border-color: #c3dfc9; }
        .bulk-active:hover { background: #d6f0dc; }
        .bulk-dropped { background: #fff0f0; color: #d32f2f; border-color: #f5bebe; }
        .bulk-dropped:hover { background: #ffe0e0; }
        .bulk-graduated { background: #e8f0ff; color: #2551a8; border-color: #b8c9f5; }
        .bulk-graduated:hover { background: #d0e0ff; }

        .table-scroll { overflow-x: auto; }

        table { width: 100%; border-collapse: collapse; min-width: 700px; }

        th {
          padding: 11px 14px;
          font-size: 11px;
          font-weight: 700;
          color: #5a7a66;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: left;
          background: #f7faf8;
          border-bottom: 1px solid #e4e9e6;
          white-space: nowrap;
        }

        td {
          padding: 10px 14px;
          font-size: 13.5px;
          color: #2d4a35;
          border-bottom: 1px solid #f0f4f1;
          vertical-align: middle;
        }

        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: #f9fcfa; }

        .select-style {
          border: 1.5px solid #dde5e0;
          border-radius: 7px;
          padding: 6px 28px 6px 10px;
          font-size: 13px;
          color: #1a3d28;
          background: #fafcfb;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235a7a66' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.15s;
          width: 100%;
        }
        .select-style:focus { border-color: #3a8f50; }

        .actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .btn-save {
          background: #3a8f50;
          color: #fff;
          border: none;
          padding: 11px 28px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
          opacity: 1;
        }
        .btn-save:hover { background: #2e7340; }
        .btn-save-disabled {
          background: #a8c8b0;
          color: #fff;
          border: none;
          padding: 11px 28px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: not-allowed;
          font-family: inherit;
        }

        .btn-cancel {
          background: #fff;
          color: #5a7a66;
          border: 1.5px solid #dde5e0;
          padding: 11px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: 0.15s;
        }
        .btn-cancel:hover { border-color: #3a8f50; color: #3a8f50; }

        .empty { text-align: center; padding: 40px; color: #9ab5a3; font-size: 14px; }
      `}</style>

      <div className="page-wrapper">
        <div className="page-header">
          <h2>Proses Naik Kelas</h2>
          <span>Tentukan kelas baru untuk setiap santri di tahun ajaran berikutnya</span>
        </div>

        {/* INPUT TAHUN AJARAN BARU */}
        <div className="year-card">
          <label>Tahun Ajaran Baru</label>
          <input
            className="year-input"
            placeholder="2025/2026"
            value={academicYear}
            onChange={handleYearChange}
          />
          <span className="year-hint">
            {academicYear.length >= 3
              ? `✅ Tahun ajaran: ${academicYear}`
              : "Histori kelas tahun ini akan tersimpan untuk rekap"}
          </span>
        </div>

        {/* SUMMARY */}
        <div className="summary">
          <span className="sum-badge sum-active">✅ Aktif: {activeCount}</span>
          <span className="sum-badge sum-dropped">❌ Keluar: {droppedCount}</span>
          <span className="sum-badge sum-graduated">🎓 Lulus: {graduatedCount}</span>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <div className="table-header">
            <div className="table-header-left">
              <div className="dot" />
              <span>Daftar Santri Aktif ({students.length})</span>
            </div>
            <div className="bulk-actions">
              <span className="bulk-label">Tandai semua:</span>
              <button className="bulk-btn bulk-active" onClick={() => handleSelectAll("status", "ACTIVE")}>Aktif</button>
              <button className="bulk-btn bulk-dropped" onClick={() => handleSelectAll("status", "DROPPED")}>Keluar</button>
              <button className="bulk-btn bulk-graduated" onClick={() => handleSelectAll("status", "GRADUATED")}>Lulus</button>
            </div>
          </div>

          <div className="table-scroll">
            {loading ? (
              <p className="empty">Memuat data santri...</p>
            ) : students.length === 0 ? (
              <p className="empty">Tidak ada santri aktif</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama</th>
                    <th>Kelas Sekarang</th>
                    <th>Kelas Baru</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "#9ab5a3" }}>{s.nisn}</div>
                      </td>
                      <td>{s.class?.name ?? "-"}</td>
                      <td style={{ minWidth: 180 }}>
                        <select
                          className="select-style"
                          value={promotions[s.id]?.newClassId || ""}
                          onChange={e => handleChange(s.id, "newClassId", e.target.value)}
                        >
                          <option value="">-- Pilih --</option>
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <select
                          className="select-style"
                          value={promotions[s.id]?.status || "ACTIVE"}
                          onChange={e => handleChange(s.id, "status", e.target.value)}
                        >
                          <option value="ACTIVE">✅ Aktif</option>
                          <option value="DROPPED">❌ Keluar</option>
                          <option value="GRADUATED">🎓 Lulus</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => router.push("/admin/students")}
          >
            Batal
          </button>

          {/* Pakai dua tombol berbeda, bukan disabled */}
          {isReady ? (
            <button
              type="button"
              className="btn-save"
              onClick={handleSubmit}
            >
              {saving ? "Memproses..." : "Simpan Naik Kelas"}
            </button>
          ) : (
            <button
              type="button"
              className="btn-save-disabled"
            >
              Isi Tahun Ajaran Dulu
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}