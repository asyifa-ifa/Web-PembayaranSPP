// pages/admin/ustadz/index.js
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/components/AdminLayout"

export default function UstadzList() {
  const router = useRouter()
  const [ustadzList, setUstadzList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ustadz/list")
      .then(r => r.json())
      .then(setUstadzList)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id, name) {
    if (!confirm(`Yakin ingin menghapus ustadz "${name}"?`)) return
    try {
      const res = await fetch(`/api/ustadz/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      setUstadzList(prev => prev.filter(u => u.id !== id))
    } catch (e) {
      alert("Error: " + e.message)
    }
  }

  return (
    <AdminLayout>
      <style jsx>{`
        .page-wrapper { padding: 8px 0 40px; }

        .page-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
        }
        .page-header h2 { font-size: 20px; font-weight: 700; color: #1a3d28; margin: 0 0 4px; }
        .page-header span { font-size: 13px; color: #7a9a85; }

        .btn-add {
          background: #3a8f50; color: white; padding: 9px 18px;
          border-radius: 8px; text-decoration: none; font-size: 14px;
          font-weight: 600; transition: background 0.2s; white-space: nowrap;
        }
        .btn-add:hover { background: #2e7340; }

        .table-card {
          background: #fff; border: 1px solid #e4e9e6;
          border-radius: 14px; overflow: hidden;
        }
        .table-card-header {
          background: #f7faf8; border-bottom: 1.5px solid #e4e9e6;
          padding: 13px 20px; display: flex; align-items: center; gap: 8px;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a8f50; }
        .table-card-header span { font-size: 12px; font-weight: 700; color: #3a8f50; text-transform: uppercase; letter-spacing: 0.5px; }

        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 750px; }
        th { padding: 11px 14px; font-size: 11px; font-weight: 700; color: #5a7a66; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; white-space: nowrap; }
        td { padding: 11px 14px; font-size: 13.5px; color: #2d4a35; border-bottom: 1px solid #f0f4f1; vertical-align: middle; }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: #f9fcfa; }

        .badge-mapel {
          display: inline-block; padding: 2px 8px; border-radius: 20px;
          font-size: 11px; font-weight: 600; background: #edf7ef;
          color: #2e6b3e; border: 1px solid #c3dfc9; margin: 2px 2px 2px 0;
        }

        .badge-wali {
          display: inline-block; padding: 2px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 600; background: #fff8e6;
          color: #b07800; border: 1px solid #e6d08a;
        }

        .action-group { display: flex; gap: 6px; }
        .btn-action { padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: 0.15s; border: 1.5px solid transparent; font-family: inherit; }
        .btn-edit { background: #fff8e6; color: #b07800; border-color: #e6d08a; }
        .btn-edit:hover { background: #fdf0c0; }
        .btn-delete { background: #fff0f0; color: #d32f2f; border-color: #f5bebe; }
        .btn-delete:hover { background: #ffe0e0; }

        .empty-state { text-align: center; padding: 60px 20px; color: #9ab5a3; font-size: 14px; }
      `}</style>

      <div className="page-wrapper">
        <div className="page-header">
          <div>
            <h2>Data Ustadz</h2>
            <span>Kelola data pengajar madrasah</span>
          </div>
          <a href="/admin/ustadz/new" className="btn-add">+ Tambah Ustadz</a>
        </div>

        <div className="table-card">
          <div className="table-card-header">
            <div className="dot" />
            <span>Daftar Ustadz ({ustadzList.length})</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama</th>
                  <th>Jabatan</th>
                  <th>Mata Pelajaran</th>
                  <th>Wali Kelas</th>
                  <th>No HP</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="empty-state">Memuat data...</td></tr>
                ) : ustadzList.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">Belum ada data ustadz</td></tr>
                ) : ustadzList.map((u, i) => (
                  <tr key={u.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.jabatan || <span style={{ color: "#b0c4b8" }}>-</span>}</td>
                    <td>
                      {u.subjects?.length > 0
                        ? u.subjects.map((s, idx) => <span key={idx} className="badge-mapel">{s}</span>)
                        : <span style={{ color: "#b0c4b8" }}>-</span>}
                    </td>
                    <td>
                      {u.class
                        ? <span className="badge-wali">📚 {u.class.name}</span>
                        : <span style={{ color: "#b0c4b8" }}>-</span>}
                    </td>
                    <td>{u.phone || <span style={{ color: "#b0c4b8" }}>-</span>}</td>
                    <td>
                      <div className="action-group">
                        <button className="btn-action btn-edit" onClick={() => router.push(`/admin/ustadz/edit?id=${u.id}`)}>Edit</button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(u.id, u.name)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}