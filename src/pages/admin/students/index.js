import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useRouter } from "next/router";

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState(""); // filter status baru
  const [updatingStatus, setUpdatingStatus] = useState(null); // id santri yg sedang diupdate
  const itemsPerPage = 10;

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
      .then((data) => {
        setStudents(data);
        setCurrentPage(1);
      })
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

  // Ubah status santri
  async function handleChangeStatus(id, newStatus) {
    setUpdatingStatus(id);
    try {
      const res = await fetch("/api/students/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      // Update lokal tanpa reload
      setStudents(prev =>
        prev.map(s => s.id === id ? { ...s, status: newStatus } : s)
      );
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setUpdatingStatus(null);
    }
  }

  // Filter: kelas + search + status
  const filteredStudents = students.filter(student => {
    const nameMatch = student.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const nisMatch = student.nis?.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = filterStatus ? student.status === filterStatus : true;
    return (nameMatch || nisMatch) && statusMatch;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  // Hitung jumlah per status untuk summary
  const countActive    = students.filter(s => s.status === "ACTIVE").length;
  const countGraduated = students.filter(s => s.status === "GRADUATED").length;
  const countDropped   = students.filter(s => s.status === "DROPPED").length;

  return (
    <AdminLayout>
      <style jsx>{`
        .page-wrapper { padding: 8px 0 40px; }

        .page-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
        }
        .page-header h2 { font-size: 20px; font-weight: 700; color: #1a3d28; margin: 0; }
        .page-header span { font-size: 13px; color: #7a9a85; display: block; }

        .btn-add {
          background: #3a8f50; color: white; padding: 9px 18px;
          border-radius: 8px; text-decoration: none; font-size: 14px;
          font-weight: 600; transition: background 0.2s; white-space: nowrap;
        }
        .btn-add:hover { background: #2e7340; }

        .btn-promote {
          background: #fff8e6; color: #b07800; border: 1.5px solid #e6d08a;
          padding: 9px 18px; border-radius: 8px; text-decoration: none;
          font-size: 14px; font-weight: 600; transition: background 0.2s; white-space: nowrap;
        }
        .btn-promote:hover { background: #fdf0c0; }

        .header-right { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

        /* Summary cards modern & profesional */
        .summary-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .summary-card {
          background: #ffffff;
          border: 1px solid #e4e9e6;
          border-radius: 14px;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }
        .summary-card:hover {
          border-color: #3a8f50;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(58, 143, 80, 0.08);
        }
        .summary-card.active-filter {
          border-color: #3a8f50;
          background: #f0fdf4;
          box-shadow: 0 4px 12px rgba(58, 143, 80, 0.06);
        }
        .summary-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b8c76;
          margin-bottom: 6px;
        }
        .summary-val {
          font-size: 28px;
          font-weight: 800;
          color: #1a3d28;
          line-height: 1;
        }

        /* Wrapper Ikon Pengganti Emoji */
        .summary-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-all { background: #f0f5f1; color: #3a8f50; }
        .icon-active { background: #edf7ef; color: #1a6b35; }
        .icon-graduated { background: #e3f0ff; color: #1565c0; }
        .icon-dropped { background: #fff0f0; color: #c62828; }

        .toolbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .toolbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .filter-select {
          padding: 8px 32px 8px 12px; border-radius: 8px;
          border: 1.5px solid #dde5e0; background: #fafcfb;
          font-size: 14px; color: #1a3d28; outline: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7a66' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center; cursor: pointer;
        }
        .filter-select:focus { border-color: #3a8f50; box-shadow: 0 0 0 3px rgba(58,143,80,0.1); }

        .search-input {
          padding: 8px 12px; border-radius: 8px; border: 1.5px solid #dde5e0;
          background: #fafcfb; font-size: 14px; color: #1a3d28; outline: none; width: 240px;
        }
        .search-input:focus { border-color: #3a8f50; box-shadow: 0 0 0 3px rgba(58,143,80,0.1); }

        .count-badge {
          font-size: 12px; color: #7a9a85; background: #f0f5f1;
          padding: 4px 10px; border-radius: 20px; border: 1px solid #dde5e0;
        }

        .table-card {
          background: #fff; border: 1px solid #e4e9e6;
          border-radius: 14px; overflow: hidden; margin-bottom: 20px;
        }
        .table-scroll { overflow-x: auto; }

        table { width: 100%; border-collapse: collapse; min-width: 1100px; }
        thead { background: #f7faf8; border-bottom: 1.5px solid #e4e9e6; }
        th {
          padding: 12px 14px; font-size: 11px; font-weight: 700;
          color: #5a7a66; text-transform: uppercase; letter-spacing: 0.5px;
          text-align: left; white-space: nowrap;
        }
        td {
          padding: 11px 14px; font-size: 13.5px; color: #2d4a35;
          border-bottom: 1px solid #f0f4f1; vertical-align: middle;
        }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: #f9fcfa; }

        .nis-badge {
          font-family: 'Courier New', monospace; font-size: 12px; font-weight: 700;
          background: #edf7ef; color: #2e6b3e; padding: 3px 8px;
          border-radius: 5px; border: 1px solid #c3dfc9; display: inline-block;
        }
        .nisn-badge {
          font-family: 'Courier New', monospace; font-size: 12px;
          background: #f1f5f9; color: #475569; padding: 3px 8px;
          border-radius: 5px; border: 1px solid #e2e8f0; display: inline-block;
        }
        .empty-val { color: #b0c4b8; font-size: 13px; }

        .badge-gender { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .badge-l { background: #e3f0ff; color: #2563a8; }
        .badge-p { background: #fde8f0; color: #a8256b; }

        .tahun-badge {
          display: inline-block; padding: 2px 8px; border-radius: 20px;
          font-size: 11px; font-weight: 600; background: #edf7ef;
          color: #2e6b3e; border: 1px solid #c3dfc9;
        }

        /* Status select dropdown di tabel */
        .status-select {
          padding: 4px 24px 4px 8px; border-radius: 20px;
          font-size: 11px; font-weight: 700; border: 1.5px solid;
          outline: none; cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235a7a66' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 7px center;
          transition: .15s; font-family: inherit;
        }
        .status-select.ACTIVE    { background-color: #edf7ef; color: #1a6b35; border-color: #c3dfc9; }
        .status-select.GRADUATED { background-color: #e3f0ff; color: #1565c0; border-color: #90caf9; }
        .status-select.DROPPED   { background-color: #fff0f0; color: #c62828; border-color: #fecaca; }
        .status-select:disabled  { opacity: .6; cursor: not-allowed; }

        .action-group { display: flex; gap: 6px; flex-wrap: wrap; }
        .btn-action {
          padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: 0.15s; border: 1.5px solid transparent; font-family: inherit;
        }
        .btn-detail { background: #f0f5f1; color: #3a8f50; border-color: #c3dfc9; }
        .btn-detail:hover { background: #e2f0e6; }
        .btn-edit   { background: #fff8e6; color: #b07800; border-color: #e6d08a; }
        .btn-edit:hover { background: #fdf0c0; }
        .btn-delete { background: #fff0f0; color: #d32f2f; border-color: #f5bebe; }
        .btn-delete:hover { background: #ffe0e0; }

        .empty-state { text-align: center; padding: 48px 20px; color: #9ab5a3; font-size: 14px; }

        .pagination-wrapper {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px; padding: 4px 5px;
        }
        .pagination-info { font-size: 13.5px; color: #5a7a66; }
        .pagination-buttons { display: flex; gap: 6px; align-items: center; }
        .btn-page {
          background: #fff; color: #2d4a35; border: 1.5px solid #dde5e0;
          padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-page:hover:not(:disabled) { background: #f0f5f1; border-color: #3a8f50; color: #3a8f50; }
        .btn-page.active { background: #3a8f50; color: white; border-color: #3a8f50; }
        .btn-page:disabled { background: #f4f7f5; color: #b0c4b8; border-color: #e4e9e6; cursor: not-allowed; }

        @media (max-width: 640px) {
          .page-header { flex-direction: column; align-items: flex-start; }
          .toolbar { flex-direction: column; align-items: flex-start; }
          .search-input { width: 100%; }
        }
      `}</style>

      <div className="page-wrapper">
        {/* HEADER */}
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

        {/* SUMMARY CARDS — klik untuk filter cepat */}
        <div className="summary-row">
          {[
            { 
              key: "", 
              label: "Total Santri", 
              val: students.length, 
              className: "icon-all",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              )
            },
            { 
              key: "ACTIVE", 
              label: "Santri Aktif", 
              val: countActive, 
              className: "icon-active",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              )
            },
            { 
              key: "GRADUATED", 
              label: "Santri Lulus", 
              val: countGraduated, 
              className: "icon-graduated",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                </svg>
              )
            },
            { 
              key: "DROPPED", 
              label: "Santri Nonaktif", 
              val: countDropped, 
              className: "icon-dropped",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              )
            },
          ].map(item => (
            <div
              key={item.key}
              className={`summary-card ${filterStatus === item.key ? "active-filter" : ""}`}
              onClick={() => { setFilterStatus(item.key); setCurrentPage(1); }}
            >
              <div>
                <div className="summary-label">{item.label}</div>
                <div className="summary-val">{item.val}</div>
              </div>
              <div className={`summary-icon-box ${item.className}`}>
                {item.icon}
              </div>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="toolbar-left">
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

            <input
              type="text"
              placeholder="Cari nama atau NIS santri..."
              className="search-input"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <span className="count-badge">{filteredStudents.length} santri ditemukan</span>
        </div>

        {/* TABEL */}
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>NIS</th>
                  <th>NISN</th>
                  <th>Nama</th>
                  <th>Kelas</th>
                  <th>JK</th>
                  <th>No HP</th>
                  <th>Email</th>
                  <th>Wali</th>
                  <th>TTL</th>
                  <th>Tahun Ajaran</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="13" className="empty-state">Memuat data...</td></tr>
                ) : currentStudents.length === 0 ? (
                  <tr><td colSpan="13" className="empty-state">Tidak ada data santri yang cocok.</td></tr>
                ) : currentStudents.map((s, i) => (
                  <tr key={s.id}>
                    <td>{indexOfFirstItem + i + 1}</td>
                    <td><span className="nis-badge">{s.nis || "-"}</span></td>
                    <td>
                      {s.nisn
                        ? <span className="nisn-badge">{s.nisn}</span>
                        : <span className="empty-val">-</span>}
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
                      {s.classHistories?.[0]?.academicYear
                        ? <span className="tahun-badge">{s.classHistories[0].academicYear}</span>
                        : s.entryYear
                          ? <span className="tahun-badge">{s.entryYear}</span>
                          : <span style={{ color: "#b0c4b8" }}>-</span>}
                    </td>

                    {/* KOLOM STATUS — dropdown langsung ubah */}
                    <td>
                      <select
                        className={`status-select ${s.status}`}
                        value={s.status}
                        disabled={updatingStatus === s.id}
                        onChange={e => handleChangeStatus(s.id, e.target.value)}
                      >
                        <option value="ACTIVE">🟢 Aktif</option>
                        <option value="GRADUATED">🎓 Lulus</option>
                        <option value="DROPPED">🔴 Nonaktif</option>
                      </select>
                    </td>

                    <td>
                      <div className="action-group">
                        <button className="btn-action btn-detail" onClick={() => router.push(`/admin/students/${s.id}`)}>Detail</button>
                        <button className="btn-action btn-edit" onClick={() => router.push(`/admin/students/edit?id=${s.id}`)}>Edit</button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(s.id)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        {!loading && filteredStudents.length > 0 && (
          <div className="pagination-wrapper">
            <div className="pagination-info">
              Menampilkan <b>{indexOfFirstItem + 1}</b> - <b>{Math.min(indexOfLastItem, filteredStudents.length)}</b> dari <b>{filteredStudents.length}</b> santri
            </div>
            <div className="pagination-buttons">
              <button className="btn-page" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                ‹ Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNum = index + 1;
                return (
                  <button key={pageNum} className={`btn-page ${currentPage === pageNum ? "active" : ""}`} onClick={() => setCurrentPage(pageNum)}>
                    {pageNum}
                  </button>
                );
              })}
              <button className="btn-page" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                Selanjutnya ›
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}