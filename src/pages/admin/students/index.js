import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useRouter } from "next/router";

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/classes/list")
      .then(res => res.json())
      .then(setClasses)
      .catch(() => {});

    loadStudents();
  }, []);

  function loadStudents(classId = "") {
    setLoading(true);
    fetch(`/api/students/list${classId ? `?classId=${classId}` : ""}`)
      .then(res => res.json())
      .then(setStudents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handleDelete(id) {
    if (!confirm("Yakin ingin menghapus santri ini?")) return;
    try {
      const res = await fetch("/api/students/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  return (
    <AdminLayout>
      <style jsx>{`
        .page-wrapper {
          padding: 8px 0 40px;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .page-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1a3d28;
          margin: 0;
        }

        .page-header span {
          font-size: 13px;
          color: #7a9a85;
          display: block;
        }

        .btn-add {
          background: #3a8f50;
          color: white;
          padding: 9px 18px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .btn-add:hover { background: #2e7340; }

        .btn-promote {
          background: #fff8e6;
          color: #b07800;
          border: 1.5px solid #e6d08a;
          padding: 9px 18px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .btn-promote:hover { background: #fdf0c0; }

        .header-right {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 8px 32px 8px 12px;
          border-radius: 8px;
          border: 1.5px solid #dde5e0;
          background: #fafcfb;
          font-size: 14px;
          color: #1a3d28;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7a66' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          cursor: pointer;
        }
        .filter-select:focus {
          border-color: #3a8f50;
          box-shadow: 0 0 0 3px rgba(58,143,80,0.1);
        }

        .count-badge {
          font-size: 12px;
          color: #7a9a85;
          background: #f0f5f1;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid #dde5e0;
        }

        .table-card {
          background: #fff;
          border: 1px solid #e4e9e6;
          border-radius: 14px;
          overflow: hidden;
        }

        .table-scroll {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        thead {
          background: #f7faf8;
          border-bottom: 1.5px solid #e4e9e6;
        }

        th {
          padding: 12px 14px;
          font-size: 11px;
          font-weight: 700;
          color: #5a7a66;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: left;
          white-space: nowrap;
        }

        td {
          padding: 11px 14px;
          font-size: 13.5px;
          color: #2d4a35;
          border-bottom: 1px solid #f0f4f1;
          vertical-align: middle;
        }

        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: #f9fcfa; }

        .nis-cell {
          font-family: monospace;
          font-size: 12px;
          background: #f1f5f9;
          color: #475569;
          padding: 3px 8px;
          border-radius: 5px;
          display: inline-block;
        }

        .nisn-sub {
          font-size: 11px;
          color: #9ab5a3;
          margin-top: 2px;
        }

        .badge-gender {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge-l {
          background: #e3f0ff;
          color: #2563a8;
        }
        .badge-p {
          background: #fde8f0;
          color: #a8256b;
        }

        .tahun-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          background: #edf7ef;
          color: #2e6b3e;
          border: 1px solid #c3dfc9;
        }

        .action-group {
          display: flex;
          gap: 6px;
        }

        .btn-action {
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: 0.15s;
          border: 1.5px solid transparent;
          font-family: inherit;
        }
        .btn-detail {
          background: #f0f5f1;
          color: #3a8f50;
          border-color: #c3dfc9;
        }
        .btn-detail:hover { background: #e2f0e6; }

        .btn-edit {
          background: #fff8e6;
          color: #b07800;
          border-color: #e6d08a;
        }
        .btn-edit:hover { background: #fdf0c0; }

        .btn-delete {
          background: #fff0f0;
          color: #d32f2f;
          border-color: #f5bebe;
        }
        .btn-delete:hover { background: #ffe0e0; }

        .empty-state {
          text-align: center;
          padding: 48px 20px;
          color: #9ab5a3;
          font-size: 14px;
        }

        @media (max-width: 640px) {
          .page-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="page-wrapper">
        <div className="page-header">
          <div>
            <h2>Daftar Santri</h2>
            <span>Kelola data seluruh santri terdaftar</span>
          </div>
          <div className="header-right">
            <a href="/admin/students/promote" className="btn-promote">🎓 Naik Kelas</a>
            <a href="/admin/students/new" className="btn-add">+ Tambah Santri</a>
          </div>
        </div>

        <div className="toolbar">
          <select
            className="filter-select"
            value={selectedClass}
            onChange={e => {
              setSelectedClass(e.target.value);
              loadStudents(e.target.value);
            }}
          >
            <option value="">-- Semua Kelas --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="count-badge">{students.length} santri</span>
        </div>

        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>NIS</th>        {/* ← diubah dari NISN */}
                  <th>Nama</th>
                  <th>Kelas</th>
                  <th>JK</th>
                  <th>No HP</th>
                  <th>Email</th>
                  <th>Wali</th>
                  <th>TTL</th>
                  <th>Tahun Ajaran</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className="empty-state">Memuat data...</td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="empty-state">
                      Tidak ada santri{selectedClass ? " di kelas ini" : ""}.
                    </td>
                  </tr>
                ) : students.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>
                      {/* Tampilkan NIS, NISN sebagai sub-info jika ada */}
                      <span className="nis-cell">{s.nis || "-"}</span>
                      {s.nisn && <div className="nisn-sub">NISN: {s.nisn}</div>}
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.class?.name ?? "-"}</td>
                    <td>
                      <span className={`badge-gender ${s.gender === "L" ? "badge-l" : "badge-p"}`}>
                        {s.gender === "L" ? "L" : "P"}
                      </span>
                    </td>
                    <td>{s.phone || "-"}</td>
                    <td>{s.email || "-"}</td>
                    <td>{s.guardian || "-"}</td>
                    <td>
                      {s.birthplace && s.birthdate
                        ? `${s.birthplace}, ${new Date(s.birthdate).toLocaleDateString("id-ID")}`
                        : "-"}
                    </td>
                    <td>
                      {s.entryYear
                        ? <span className="tahun-badge">{s.entryYear}</span>
                        : <span style={{ color: "#b0c4b8" }}>-</span>}
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="btn-action btn-detail"
                          onClick={() => router.push(`/admin/students/${s.id}`)}
                        >Detail</button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => router.push(`/admin/students/edit?id=${s.id}`)}
                        >Edit</button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(s.id)}
                        >Hapus</button>
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
  );
}