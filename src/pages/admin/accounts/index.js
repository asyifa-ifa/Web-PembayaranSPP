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
  const [showPassword, setShowPassword] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/accounts");
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const classOptions = [
    "ALL",
    ...Array.from(new Set(students.map((s) => s.class?.name).filter(Boolean))).sort(),
  ];

  const yearOptions = [
    "ALL",
    ...Array.from(new Set(students.map((s) => s.entryYear).filter(Boolean))).sort((a, b) => b - a),
  ];

  const filteredStudents = students.filter((s) => {
    const matchClass = filterClass === "ALL" || s.class?.name === filterClass;
    const matchYear = filterYear === "ALL" || s.entryYear === Number(filterYear);
    const matchSearch =
      searchQuery === "" ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.login?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchYear && matchSearch;
  });

  const openCreateModal = (student) => {
    setSelectedStudent(student);
    setPassword("");
    setIsEdit(false);
    setShowModal(true);
  };

  const submitCreate = async () => {
    await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: selectedStudent.id, password }),
    });
    setShowModal(false);
    fetchStudents();
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setSelectedLoginId(student.login.id);
    setPassword("");
    setIsEdit(true);
    setShowModal(true);
  };

  const submitUpdate = async () => {
    await fetch(`/api/admin/accounts/${selectedLoginId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setShowModal(false);
    fetchStudents();
  };

  const deleteAccount = async (loginId) => {
    if (!confirm("Yakin ingin menghapus akun ini?")) return;
    await fetch(`/api/admin/accounts/${loginId}`, { method: "DELETE" });
    fetchStudents();
  };

  const toggleStatus = async (loginId, currentStatus) => {
    await fetch(`/api/admin/accounts/${loginId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggle: !currentStatus }),
    });
    fetchStudents();
  };

  const statsTotal = students.length;
  const statsActive = students.filter((s) => s.login?.isActive).length;
  const statsNoAccount = students.filter((s) => !s.login).length;

  return (
    <AdminLayout>
      <div className="page-wrapper">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => router.push("/admin/dashboard")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Kembali
            </button>
            <div>
              <h1 className="page-title">Kelola Akun Santri</h1>
              <p className="page-subtitle">Manajemen akses login santri</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">👥</div>
            <div>
              <div className="stat-value">{statsTotal}</div>
              <div className="stat-label">Total Santri</div>
            </div>
          </div>
          <div className="stat-card stat-active">
            <div className="stat-icon">✅</div>
            <div>
              <div className="stat-value">{statsActive}</div>
              <div className="stat-label">Akun Aktif</div>
            </div>
          </div>
          <div className="stat-card stat-none">
            <div className="stat-icon">⚠️</div>
            <div>
              <div className="stat-value">{statsNoAccount}</div>
              <div className="stat-label">Belum Ada Akun</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="search-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              placeholder="Cari nama atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select className="filter-select" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            {classOptions.map((cls) => (
              <option key={cls} value={cls}>{cls === "ALL" ? "Semua Kelas" : cls}</option>
            ))}
          </select>

          <select className="filter-select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year === "ALL" ? "Semua Angkatan" : `Angkatan ${year}`}</option>
            ))}
          </select>
        </div>

        {/* Table Card */}
        <div className="table-card">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Memuat data...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>Tidak ada data yang ditemukan</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Santri</th>
                    <th>Kelas</th>
                    <th>Angkatan</th>
                    <th>Username</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => (
                    <tr key={s.id} className="table-row">
                      <td className="td-no">{i + 1}</td>
                      <td>
                        <div className="student-info">
                          <div className="avatar">{s.name?.charAt(0)?.toUpperCase()}</div>
                          <span className="student-name">{s.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-class">{s.class?.name || "-"}</span>
                      </td>
                      <td className="td-year">{s.entryYear || "-"}</td>
                      <td>
                        <code className="username-code">{s.login?.username || "-"}</code>
                      </td>
                      <td>
                        {s.login ? (
                          <button
                            className={s.login.isActive ? "status-badge active" : "status-badge inactive"}
                            onClick={() => toggleStatus(s.login.id, s.login.isActive)}
                          >
                            <span className="status-dot" />
                            {s.login.isActive ? "Aktif" : "Nonaktif"}
                          </button>
                        ) : (
                          <span className="status-badge none">—</span>
                        )}
                      </td>
                      <td>
                        <div className="action-group">
                          {s.login ? (
                            <>
                              <button className="action-btn reset" onClick={() => openEditModal(s)} title="Reset Password">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                                </svg>
                                Reset
                              </button>
                              <button className="action-btn danger" onClick={() => deleteAccount(s.login.id)} title="Hapus Akun">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                                Hapus
                              </button>
                            </>
                          ) : (
                            <button className="action-btn create" onClick={() => openCreateModal(s)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
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

          <div className="table-footer">
            Menampilkan <strong>{filteredStudents.length}</strong> dari <strong>{students.length}</strong> santri
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-box">
              <div className="modal-header">
                <div className="modal-icon">{isEdit ? "🔑" : "👤"}</div>
                <div>
                  <h3 className="modal-title">{isEdit ? "Reset Password" : "Buat Akun Baru"}</h3>
                  <p className="modal-subtitle">{selectedStudent?.name}</p>
                </div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <label className="input-label">Password Baru</label>
                <div className="input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  disabled={!password}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ===== LAYOUT ===== */
        .page-wrapper {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
        }

        /* ===== HEADER ===== */
        .page-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1.5px solid #e2e8f0;
          color: #475569;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all .18s;
          white-space: nowrap;
        }
        .btn-back:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
        .page-title {
          margin: 0;
          font-size: clamp(20px, 3vw, 26px);
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.5px;
        }
        .page-subtitle {
          margin: 2px 0 0;
          font-size: 13px;
          color: #94a3b8;
        }

        /* ===== STATS ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: white;
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          border: 1.5px solid #f1f5f9;
          transition: transform .15s, box-shadow .15s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
        .stat-icon { font-size: 24px; }
        .stat-value { font-size: 22px; font-weight: 700; color: #1e293b; line-height: 1; }
        .stat-label { font-size: 12px; color: #94a3b8; margin-top: 3px; font-weight: 500; }
        .stat-total { border-top: 3px solid #6366f1; }
        .stat-active { border-top: 3px solid #22c55e; }
        .stat-none { border-top: 3px solid #f59e0b; }

        /* ===== FILTER BAR ===== */
        .filter-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 10px 12px 10px 38px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #1e293b;
          background: white;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          box-sizing: border-box;
        }
        .search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .filter-select {
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13px;
          color: #475569;
          background: white;
          outline: none;
          cursor: pointer;
          transition: border-color .15s;
          min-width: 140px;
        }
        .filter-select:focus { border-color: #6366f1; }

        /* ===== TABLE CARD ===== */
        .table-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          border: 1.5px solid #f1f5f9;
          overflow: hidden;
        }
        .table-responsive { overflow-x: auto; }
        .table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }
        thead tr {
          background: #f8fafc;
          border-bottom: 1.5px solid #f1f5f9;
        }
        th {
          padding: 13px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: .5px;
          white-space: nowrap;
        }
        .table-row { border-bottom: 1px solid #f8fafc; transition: background .12s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: #fafbff; }
        td { padding: 14px 16px; font-size: 14px; color: #334155; vertical-align: middle; }
        .td-no { color: #94a3b8; font-size: 13px; width: 48px; }
        .td-year { color: #64748b; font-size: 13px; }

        /* ===== STUDENT INFO ===== */
        .student-info { display: flex; align-items: center; gap: 10px; }
        .avatar {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 13px; font-weight: 600;
          flex-shrink: 0;
        }
        .student-name { font-weight: 500; color: #1e293b; }

        /* ===== BADGES ===== */
        .badge-class {
          background: #ede9fe;
          color: #7c3aed;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .username-code {
          background: #f1f5f9;
          color: #475569;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-family: 'Courier New', monospace;
        }

        /* ===== STATUS BADGE ===== */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
        }
        .status-badge.active { background: #dcfce7; color: #15803d; }
        .status-badge.active:hover { background: #bbf7d0; }
        .status-badge.inactive { background: #fee2e2; color: #b91c1c; }
        .status-badge.inactive:hover { background: #fecaca; }
        .status-badge.none { background: #f1f5f9; color: #94a3b8; cursor: default; }
        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }

        /* ===== ACTION BUTTONS ===== */
        .action-group { display: flex; gap: 6px; flex-wrap: wrap; }
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
        }
        .action-btn.create { background: #ede9fe; color: #6d28d9; border-color: #ddd6fe; }
        .action-btn.create:hover { background: #ddd6fe; }
        .action-btn.reset { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        .action-btn.reset:hover { background: #fde68a; }
        .action-btn.danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
        .action-btn.danger:hover { background: #fecaca; }

        /* ===== TABLE FOOTER ===== */
        .table-footer {
          padding: 12px 16px;
          font-size: 13px;
          color: #94a3b8;
          background: #fafafa;
          border-top: 1.5px solid #f1f5f9;
        }

        /* ===== STATES ===== */
        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 12px;
          color: #94a3b8;
          font-size: 14px;
        }
        .empty-icon { font-size: 40px; }
        .spinner {
          width: 32px; height: 32px;
          border: 3px solid #f1f5f9;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-box {
          background: white;
          border-radius: 18px;
          width: 100%;
          max-width: 380px;
          box-shadow: 0 20px 60px rgba(0,0,0,.15);
          animation: modalIn .2s ease;
          overflow: hidden;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 20px 16px;
          border-bottom: 1.5px solid #f1f5f9;
        }
        .modal-icon { font-size: 28px; }
        .modal-title { margin: 0; font-size: 16px; font-weight: 700; color: #1e293b; }
        .modal-subtitle { margin: 2px 0 0; font-size: 12px; color: #94a3b8; }
        .modal-close {
          margin-left: auto;
          background: #f1f5f9;
          border: none;
          width: 28px; height: 28px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          color: #64748b;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
          flex-shrink: 0;
        }
        .modal-close:hover { background: #e2e8f0; }
        .modal-body { padding: 20px; }
        .input-label { display: block; font-size: 13px; font-weight: 500; color: #475569; margin-bottom: 8px; }
        .input-wrap { position: relative; }
        .modal-input {
          width: 100%;
          padding: 11px 42px 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          box-sizing: border-box;
        }
        .modal-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .toggle-pw {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0;
        }
        .modal-footer {
          display: flex;
          gap: 10px;
          padding: 16px 20px 20px;
          justify-content: flex-end;
        }
        .btn-modal-cancel {
          padding: 10px 18px;
          border: 1.5px solid #e2e8f0;
          background: white;
          color: #64748b;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all .15s;
        }
        .btn-modal-cancel:hover { background: #f8fafc; }
        .btn-modal-submit {
          padding: 10px 22px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all .15s;
          box-shadow: 0 3px 10px rgba(99,102,241,.3);
        }
        .btn-modal-submit:hover { opacity: .9; transform: translateY(-1px); }
        .btn-modal-submit:disabled { opacity: .5; cursor: not-allowed; transform: none; }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .page-wrapper { padding: 16px; }
          .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .stat-card { padding: 14px; gap: 10px; }
          .stat-value { font-size: 18px; }
          .stat-icon { font-size: 20px; }
          .filter-bar { flex-direction: column; }
          .filter-select { min-width: unset; width: 100%; }
          .header-left { gap: 10px; }
        }

        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .stat-card { flex-direction: row; }
          .page-title { font-size: 18px; }
          .action-btn span { display: none; }
        }
      `}</style>
    </AdminLayout>
  );
}