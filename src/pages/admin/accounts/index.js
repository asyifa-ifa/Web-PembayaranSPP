import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";

export default function AccountsPage() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedLoginId, setSelectedLoginId] = useState(null);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const itemsPerPage = 10;

  const fetchStudents = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/accounts");
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { setCurrentPage(1); }, [filterClass, filterYear, searchQuery]);

  const classOptions = [
    "ALL",
    ...Array.from(new Set(students.map(s => s.class?.name).filter(Boolean))).sort(),
  ];
  const yearOptions = [
    "ALL",
    ...Array.from(new Set(students.map(s => s.entryYear).filter(Boolean))).sort((a, b) => b - a),
  ];

  const filteredStudents = students.filter(s => {
    const matchClass  = filterClass === "ALL" || s.class?.name === filterClass;
    const matchYear   = filterYear  === "ALL" || s.entryYear   === filterYear;
    const matchSearch =
      searchQuery === "" ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.login?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchYear && matchSearch;
  });

  const indexOfLastItem  = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems     = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages       = Math.ceil(filteredStudents.length / itemsPerPage);

  // ── Statistik ──────────────────────────────────────────────
  const statsTotal  = students.length;
  const statsActive = students.filter(s => s.login?.isActive === true).length;

  // ── Handlers ───────────────────────────────────────────────
  const openCreateModal = (student) => {
  setSelectedStudent(student);
  setPassword("");
  setEmail("");
  setIsEdit(false);
  setShowModal(true);
};

  const submitCreate = async () => {
  await fetch("/api/admin/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId: selectedStudent.id, password, email }),
  });
  setShowModal(false);
  fetchStudents();
};

  const openEditModal = (student) => {
  setSelectedStudent(student);
  setSelectedLoginId(student.login.id);
  setPassword("");
  setEmail(student.login.email || "");  
  setIsEdit(true);
  setShowModal(true);
};

  const submitUpdate = async () => {
  await fetch(`/api/admin/accounts/${selectedLoginId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, email }),
  });
  setShowModal(false);
  fetchStudents();
};

  const deleteAccount = async (loginId) => {
    if (!confirm("Yakin ingin menghapus akun ini?")) return;
    await fetch(`/api/admin/accounts/${loginId}`, { method: "DELETE" });
    fetchStudents();
  };

  // Toggle Aktif / Nonaktif
  const handleUpdateStatus = async (loginId, isActive) => {
    setUpdatingId(loginId);
    try {
      const res = await fetch(`/api/admin/accounts/${loginId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status");
      // Update lokal tanpa reload
      setStudents(prev => prev.map(s =>
        s.login?.id === loginId
          ? { ...s, login: { ...s.login, isActive } }
          : s
      ));
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="page-wrapper">

        {/* HEADER */}
        <div className="page-header">
          <h1 className="page-title">Kelola Akun Santri</h1>
          <p className="page-subtitle">Manajemen hak akses & status login santri</p>
        </div>

        {/* STATS CARDS MODERN */}
        <div className="stats-grid">
          {[
            { 
              val: statsTotal, 
              label: "Total Santri", 
              cls: "stat-total",
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
              val: statsActive, 
              label: "Akun Aktif", 
              cls: "stat-active",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              )
            },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.val}</div>
              </div>
              <div className={`stat-icon-box ${s.cls}`}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* FILTER */}
        <div className="filter-bar">
          <div className="search-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-input"
              placeholder="Cari nama, NIS atau username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="filter-select" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            {classOptions.map(cls => (
              <option key={cls} value={cls}>{cls === "ALL" ? "Semua Kelas" : cls}</option>
            ))}
          </select>
          <select className="filter-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            {yearOptions.map(year => (
              <option key={year} value={year}>{year === "ALL" ? "Semua Angkatan" : `Angkatan ${year}`}</option>
            ))}
          </select>
        </div>

        {/* TABEL */}
        <div className="table-card">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"/>
              <p>Memuat data santri...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>Tidak ada data yang cocok</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{width:50}}>No</th>
                    <th>Nama Santri</th>
                    <th>Kelas</th>
                    <th>Angkatan</th>
                    <th>NIS / Username</th>
                    <th>Status Akses</th>
                    <th style={{textAlign:"center"}}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((s, i) => (
                    <tr key={s.id} className="table-row">
                      <td className="td-no">{indexOfFirstItem + i + 1}</td>
                      <td>
                        <div className="student-info">
                          <div className="avatar">{s.name?.charAt(0)?.toUpperCase()}</div>
                          <span className="student-name">{s.name}</span>
                        </div>
                      </td>
                      <td><span className="badge-class">{s.class?.name || "-"}</span></td>
                      <td className="td-year">{s.entryYear || "-"}</td>
                      <td>
                        <code className="username-code">{s.nis || "-"}</code>
                        {s.nisn && <div className="nisn-text">NISN: {s.nisn}</div>}
                      </td>
                      <td>
                        {s.login ? (
                          <select
                            className={`status-dropdown ${s.login.isActive ? "aktif" : "nonaktif"}`}
                            value={s.login.isActive ? "true" : "false"}
                            disabled={updatingId === s.login.id}
                            onChange={e => handleUpdateStatus(s.login.id, e.target.value === "true")}
                          >
                            <option value="true">🟢 Aktif</option>
                            <option value="false">🔴 Nonaktif</option>
                          </select>
                        ) : (
                          <span className="status-badge-none">Belum Ada Akun</span>
                        )}
                      </td>
                      <td>
                        <div className="action-group">
                          {s.login ? (
                            <>
                              <button className="action-btn reset" onClick={() => openEditModal(s)}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                                  <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                                </svg>
                                Reset
                              </button>
                              <button className="action-btn danger" onClick={() => deleteAccount(s.login.id)}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                                Hapus
                              </button>
                            </>
                          ) : (
                            <button className="action-btn create" onClick={() => openCreateModal(s)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="16"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                              </svg>
                              Buat Akun
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {!loading && filteredStudents.length > 0 && (
            <div className="table-footer-pagination">
              <div className="info-text">
                Menampilkan <strong>{indexOfFirstItem + 1}</strong> – <strong>{Math.min(indexOfLastItem, filteredStudents.length)}</strong> dari <strong>{filteredStudents.length}</strong> santri
              </div>
              <div className="pagination-controls">
                <button className="page-btn nav" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
                <button className="page-btn nav" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL BUAT / RESET PASSWORD */}
        {showModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-box">
              <div className="modal-header">
                <div className="modal-icon">{isEdit ? "🔑" : "👤"}</div>
                <div>
                  <h3 className="modal-title">{isEdit ? "Reset Akun" : "Buat Akun Baru"}</h3>
                  <p className="modal-subtitle">
                    {selectedStudent?.name}
                    {selectedStudent?.nis && <span className="modal-nis-badge">· {selectedStudent.nis}</span>}
                  </p>
                </div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              {/* INFO USERNAME */}
              {isEdit && selectedStudent?.login?.username && (
                <div className="modal-info">
                  <span>👤</span>
                  <span>Username: <code>{selectedStudent.login.username}</code></span>
                </div>
              )}
              {!isEdit && selectedStudent?.nis && (
                <div className="modal-info">
                  <span>🎫</span>
                  <span>Username otomatis akan digenerate</span>
                </div>
              )}

              <div className="modal-body">
                {/* EMAIL */}
                <label className="input-label">Email</label>
                <div className="input-wrap" style={{marginBottom: 14}}>
                  <input
                    type="email"
                    placeholder="Masukkan email..."
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="modal-input"
                  />
                </div>

                {/* PASSWORD */}
                <label className="input-label">Password {isEdit && <span style={{color:"#94a3b8", fontWeight:400}}>(kosongkan jika tidak diubah)</span>}</label>
                <div className="input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="modal-input"
                  />
                  <button className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-modal-cancel" onClick={() => setShowModal(false)}>Batal</button>
                <button
                  className="btn-modal-submit"
                  onClick={isEdit ? submitUpdate : submitCreate}
                  disabled={isEdit ? !email : (!password || !email)}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .page-wrapper { padding: 24px; max-width: 1280px; margin: 0 auto; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; }
        .page-header { margin-bottom: 24px; }
        .page-title { margin: 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -.5px; }
        .page-subtitle { margin: 4px 0 0; font-size: 13px; color: #64748b; }

        /* STATS GRIDS - Menggunakan 2 Kolom Seimbang */
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 16px; 
          margin-bottom: 24px; 
        }
        .stat-card { 
          background: white; 
          border-radius: 14px; 
          padding: 18px 22px; 
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0,0,0,.02); 
          border: 1px solid #e2e8f0; 
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card:hover { 
          transform: translateY(-2px); 
          border-color: #10b981;
          box-shadow: 0 6px 18px rgba(16,185,129,0.08); 
        }
        .stat-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
        .stat-value { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }
        
        /* Ikon Pengganti Emoji Modern */
        .stat-icon-box { 
          width: 46px; 
          height: 46px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border-radius: 12px; 
        }
        .stat-total { background: #f1f5f9; color: #475569; }
        .stat-active { background: #ecfdf5; color: #10b981; }

        /* FILTER */
        .filter-bar { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
        .search-wrap { position: relative; flex: 1; min-width: 240px; }
        .search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .search-input { width: 100%; padding: 10px 12px 10px 38px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #0f172a; outline: none; transition: .15s; box-sizing: border-box; }
        .search-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.1); }
        .filter-select { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; color: #334155; background: white; outline: none; cursor: pointer; min-width: 150px; }
        .filter-select:focus { border-color: #10b981; }

        /* TABLE */
        .table-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.04); border: 1px solid #e2e8f0; overflow: hidden; }
        .table-responsive { overflow-x: auto; }
        .table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        th { padding: 13px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; white-space: nowrap; }
        .table-row { border-bottom: 1px solid #f1f5f9; transition: background .15s; }
        .table-row:hover { background: #f0fdf4; }
        td { padding: 13px 16px; font-size: 13.5px; color: #334155; vertical-align: middle; }
        .td-no { color: #94a3b8; font-weight: 500; }
        .td-year { color: #475569; font-weight: 500; }

        .student-info { display: flex; align-items: center; gap: 10px; }
        .avatar { width: 34px; height: 34px; background: linear-gradient(135deg,#10b981,#059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .student-name { font-weight: 600; color: #0f172a; }
        .badge-class { background: #e6f4ea; color: #137333; padding: 3px 9px; border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap; }
        .username-code { background: #f1f5f9; color: #334155; padding: 3px 8px; border-radius: 4px; font-size: 12.5px; font-family: monospace; font-weight: 600; }
        .nisn-text { font-size: 11px; color: #94a3b8; margin-top: 2px; }

        /* STATUS DROPDOWN */
        .status-dropdown { padding: 6px 10px; border-radius: 8px; font-size: 12.5px; font-weight: 600; border: 1.5px solid transparent; cursor: pointer; outline: none; transition: .15s; font-family: inherit; }
        .status-dropdown.aktif    { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
        .status-dropdown.nonaktif { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
        .status-dropdown:disabled { opacity: .6; cursor: not-allowed; }
        .status-badge-none { background: #f1f5f9; color: #64748b; padding: 5px 11px; border-radius: 8px; font-size: 12px; font-weight: 500; }

        /* ACTION BUTTONS */
        .action-group { display: flex; gap: 7px; }
        .action-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid transparent; cursor: pointer; transition: .15s; font-family: inherit; }
        .action-btn.create  { background: #10b981; color: white; border-color: #10b981; }
        .action-btn.create:hover { background: #059669; }
        .action-btn.reset   { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .action-btn.reset:hover { background: #fef3c7; }
        .action-btn.danger  { background: #fff5f5; color: #e53e3e; border-color: #fed7d7; }
        .action-btn.danger:hover { background: #fee2e2; }

        /* PAGINATION */
        .table-footer-pagination { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #f8fafc; border-top: 1px solid #e2e8f0; flex-wrap: wrap; gap: 10px; }
        .info-text { font-size: 13px; color: #64748b; }
        .pagination-controls { display: flex; gap: 4px; align-items: center; }
        .page-btn { padding: 6px 11px; min-width: 32px; height: 32px; border-radius: 6px; border: 1px solid #cbd5e1; background: white; color: #334155; font-size: 13px; font-weight: 500; cursor: pointer; transition: .15s; display: flex; align-items: center; justify-content: center; }
        .page-btn:hover:not(:disabled) { border-color: #10b981; color: #10b981; background: #f0fdf4; }
        .page-btn.active { background: #10b981; border-color: #10b981; color: white; font-weight: 700; }
        .page-btn.nav { font-weight: 600; padding: 6px 13px; }
        .page-btn:disabled { opacity: .5; cursor: not-allowed; background: #f1f5f9; }

        /* LOADING & EMPTY */
        .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 20px; gap: 10px; color: #64748b; }
        .spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-icon { font-size: 32px; }

        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.35); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-box { background: white; border-radius: 14px; width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,.12); overflow: hidden; animation: modalIn .15s ease-out; }
        @keyframes modalIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
        .modal-header { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid #e2e8f0; }
        .modal-icon { font-size: 24px; }
        .modal-title { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
        .modal-subtitle { margin: 2px 0 0; font-size: 12px; color: #64748b; }
        .modal-nis-badge { color: #10b981; margin-left: 5px; font-family: monospace; font-weight: 700; }
        .modal-close { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 16px; color: #94a3b8; padding: 0; }
        .modal-info { display: flex; gap: 8px; padding: 10px 20px; background: #f0fdf4; border-bottom: 1px solid #bbf7d0; font-size: 13px; color: #166534; }
        .modal-body { padding: 20px; }
        .input-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
        .input-wrap { position: relative; }
        .modal-input { width: 100%; padding: 10px 40px 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; transition: .15s; }
        .modal-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.1); }
        .toggle-pw { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; padding: 0; }
        .modal-footer { display: flex; gap: 10px; padding: 14px 20px; justify-content: flex-end; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .btn-modal-cancel { padding: 8px 16px; border: 1px solid #cbd5e1; background: white; color: #475569; border-radius: 7px; font-size: 13.5px; cursor: pointer; font-family: inherit; }
        .btn-modal-submit { padding: 8px 18px; background: #10b981; color: white; border: none; border-radius: 7px; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: inherit; transition: .15s; }
        .btn-modal-submit:hover:not(:disabled) { background: #059669; }
        .btn-modal-submit:disabled { opacity: .5; cursor: not-allowed; }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
          .table-footer-pagination { flex-direction: column; align-items: center; }
          .page-wrapper { padding: 16px; }
        }
      `}</style>
    </AdminLayout>
  );
}