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
  
  // State Baru untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStudents = async () => {
    setLoading(true);
    // Mengasumsikan API Anda mengembalikan data santri beserta status loginnnya
    const res = await fetch("/api/admin/accounts");
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterClass, filterYear, searchQuery]);

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
    const matchYear = filterYear === "ALL" || s.entryYear === filterYear;
    const matchSearch =
      searchQuery === "" ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.login?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchYear && matchSearch;
  });

  // Kalkulasi Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

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

  // Mengubah status akun (Saran backend: status berupa string 'AKTIF', 'NONAKTIF', 'LULUS')
  const handleUpdateStatus = async (loginId, newStatus) => {
    await fetch(`/api/admin/accounts/${loginId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }), // Sesuaikan key body ini dengan backend Anda
    });
    fetchStudents();
  };

  // Perhitungan Statistik Berdasarkan Request Baru
  const statsTotal = students.length;
  const statsActive = students.filter((s) => s.login?.status === "AKTIF" || (s.login && s.login.isActive === true)).length; 
  const statsInactive = students.filter((s) => s.login?.status === "NONAKTIF" || (s.login && s.login.isActive === false)).length;
  const statsGraduated = students.filter((s) => s.login?.status === "LULUS" || s.isGraduated).length; // Menyesuaikan jika ada flag lulus

  return (
    <AdminLayout>
      <div className="page-wrapper">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <div>
              <h1 className="page-title">Kelola Akun Santri</h1>
              <p className="page-subtitle">Manajemen hak akses & kontrol status berkala santri</p>
            </div>
          </div>
        </div>

        {/* Stats Cards (Kini Berjumlah 4 Baris yang Seimbang) */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">👥</div>
            <div>
              <div className="stat-value">{statsTotal}</div>
              <div className="stat-label">Total Santri</div>
            </div>
          </div>
          <div className="stat-card stat-active">
            <div className="stat-icon">🟢</div>
            <div>
              <div className="stat-value">{statsActive}</div>
              <div className="stat-label">Akun Aktif</div>
            </div>
          </div>
          <div className="stat-card stat-inactive">
            <div className="stat-icon">🔴</div>
            <div>
              <div className="stat-value">{statsInactive}</div>
              <div className="stat-label">Akun Nonaktif</div>
            </div>
          </div>
          <div className="stat-card stat-graduated">
            <div className="stat-icon">🎓</div>
            <div>
              <div className="stat-value">{statsGraduated}</div>
              <div className="stat-label">Santri Lulus</div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filter-bar">
          <div className="search-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              placeholder="Cari nama, NIS atau username..."
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
              <p>Memuat data santri...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>Tidak ada data santri yang cocok dengan filter</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>No</th>
                    <th>Nama Santri</th>
                    <th>Kelas</th>
                    <th>Angkatan</th>
                    <th>NIS / Username</th>
                    <th>Status Akses</th>
                    <th style={{ textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((s, i) => {
                    // Penentuan status lokal untuk visualisasi
                    let currentStatus = "NONAKTIF";
                    if (s.login?.status) {
                      currentStatus = s.login.status;
                    } else if (s.login?.isActive) {
                      currentStatus = "AKTIF";
                    } else if (s.isGraduated) {
                      currentStatus = "LULUS";
                    }

                    return (
                      <tr key={s.id} className="table-row">
                        <td className="td-no">{indexOfFirstItem + i + 1}</td>
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
                          <div>
                            <code className="username-code">{s.nis || "-"}</code>
                            {s.nisn && (
                              <div className="nisn-text">NISN: {s.nisn}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          {s.login ? (
                            <select 
                              className={`status-dropdown ${currentStatus.toLowerCase()}`}
                              value={currentStatus}
                              onChange={(e) => handleUpdateStatus(s.login.id, e.target.value)}
                            >
                              <option value="AKTIF">🟢 Aktif</option>
                              <option value="NONAKTIF">🔴 Nonaktif</option>
                              <option value="LULUS">🎓 Lulus</option>
                            </select>
                          ) : (
                            <span className="status-badge none">Belum Ada Akun</span>
                          )}
                        </td>
                        <td>
                          <div className="action-group">
                            {s.login ? (
                              <>
                                <button className="action-btn reset" onClick={() => openEditModal(s)} title="Reset Password">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                                  </svg>
                                  Reset
                                </button>
                                <button className="action-btn danger" onClick={() => deleteAccount(s.login.id)} title="Hapus Akun">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                  </svg>
                                  Hapus
                                </button>
                              </>
                            ) : (
                              <button className="action-btn create" onClick={() => openCreateModal(s)}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                                </svg>
                                Buat Akun
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer & Pagination Navigation (Setiap 10 Baris Data) */}
          {!loading && filteredStudents.length > 0 && (
            <div className="table-footer-pagination">
              <div className="info-text">
                Menampilkan <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredStudents.length)}</strong> dari <strong>{filteredStudents.length}</strong> santri
              </div>
              <div className="pagination-controls">
                <button 
                  className="page-btn nav" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  &larr; Prev
                </button>
                
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                <button 
                  className="page-btn nav" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Create / Update Password */}
        {showModal && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-box">
              <div className="modal-header">
                <div className="modal-icon">{isEdit ? "🔑" : "👤"}</div>
                <div>
                  <h3 className="modal-title">{isEdit ? "Reset Password" : "Buat Akun Baru"}</h3>
                  <p className="modal-subtitle">
                    {selectedStudent?.name}
                    {selectedStudent?.nis && <span className="modal-nis-badge">· {selectedStudent.nis}</span>}
                  </p>
                </div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              {!isEdit && selectedStudent?.nis && (
                <div className="modal-info">
                  <span>🎫</span>
                  <span>Username otomatis: <code>{selectedStudent.nis}</code></span>
                </div>
              )}

              <div className="modal-body">
                <label className="input-label">Password Baru</label>
                <div className="input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password aman..."
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
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .page-wrapper {
          padding: 24px;
          max-width: 1280px;
          margin: 0 auto;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
        }

        .page-header {
          margin-bottom: 24px;
        }
        .page-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .page-subtitle { margin: 4px 0 0; font-size: 13.5px; color: #64748b; }

        /* Dashboard Grid Diperbarui Menjadi 4 Kolom Bertema Hijau Soft */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,.05);
          border: 1px solid #e2e8f0;
          transition: all .2s ease;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.06); }
        .stat-icon { font-size: 22px; width: 42px; height: 42px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#f8fafc;}
        .stat-value { font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; font-weight: 500; }
        
        .stat-total { border-left: 4px solid #64748b; }
        .stat-active { border-left: 4px solid #10b981; } /* Emerald Green */
        .stat-inactive { border-left: 4px solid #ef4444; } /* Soft Red */
        .stat-graduated { border-left: 4px solid #0284c7; } /* Sky Blue */

        /* Filter Area */
        .filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .search-wrap { position: relative; flex: 1; min-width: 260px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .search-input {
          width: 100%;
          padding: 11px 12px 11px 40px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: all .15s;
        }
        .search-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.12); }
        
        .filter-select {
          padding: 11px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13.5px;
          color: #334155;
          background: white;
          outline: none;
          cursor: pointer;
          min-width: 160px;
        }
        .filter-select:focus { border-color: #10b981; }

        /* Elegant Table Layout */
        .table-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .table-responsive { overflow-x: auto; }
        .table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        th {
          padding: 14px 18px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: .5px;
        }
        .table-row { border-bottom: 1px solid #f1f5f9; transition: background .15s; }
        .table-row:hover { background: #f0fdf4; } /* Soft Green Hover highlight */
        td { padding: 14px 18px; font-size: 14px; color: #334155; vertical-align: middle; }
        .td-no { color: #94a3b8; font-weight: 500; }
        .td-year { color: #475569; font-weight: 500; }

        .student-info { display: flex; align-items: center; gap: 12px; }
        .avatar {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 13px; font-weight: 600;
        }
        .student-name { font-weight: 600; color: #0f172a; }

        .badge-class {
          background: #e6f4ea;
          color: #137333;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .username-code {
          background: #f1f5f9;
          color: #334155;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12.5px;
          font-family: monospace;
          font-weight: 600;
        }
        .nisn-text { font-size: 11px; color: #94a3b8; margin-top: 3px; }

        /* Interactive Status Dropdown */
        .status-dropdown {
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          outline: none;
          transition: all .15s;
        }
        .status-dropdown.aktif { background-color: #dcfce7; color: #15803d; border-color: #bbf7d0; }
        .status-dropdown.nonaktif { background-color: #fee2e2; color: #b91c1c; border-color: #fecaca; }
        .status-dropdown.lulus { background-color: #e0f2fe; color: #0369a1; border-color: #bae6fd; }
        
        .status-badge.none { background: #f1f5f9; color: #64748b; padding: 6px 12px; border-radius: 8px; font-size:12px; font-weight:500; }

        /* Action Buttons */
        .action-group { display: flex; gap: 8px; justify-content: flex-start; }
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all .15s;
        }
        .action-btn.create { background: #10b981; color: white; }
        .action-btn.create:hover { background: #059669; }
        .action-btn.reset { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .action-btn.reset:hover { background: #fef3c7; }
        .action-btn.danger { background: #fff5f5; color: #e53e3e; border-color: #fed7d7; }
        .action-btn.danger:hover { background: #fee2e2; }

        /* Custom Modern Pagination Footer */
        .table-footer-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 12px;
        }
        .info-text { font-size: 13px; color: #64748b; }
        .pagination-controls { display: flex; gap: 4px; align-items: center; }
        .page-btn {
          padding: 6px 12px;
          min-width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: white;
          color: #334155;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all .15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .page-btn:hover:not(:disabled) { border-color: #10b981; color: #10b981; background: #f0fdf4; }
        .page-btn.active { background: #10b981; border-color: #10b981; color: white; font-weight: 600; }
        .page-btn.nav { font-weight: 600; padding: 6px 14px; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #f1f5f9; }

        /* Loading & Empty States */
        .loading-state, .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 20px; gap: 12px; color: #64748b;
        }
        .spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Modal Custom Styles */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-box { background: white; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,.1); overflow: hidden; animation: modalIn .15s ease-out; }
        @keyframes modalIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
        .modal-header { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid #e2e8f0; }
        .modal-title { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
        .modal-subtitle { margin: 2px 0 0; font-size: 12px; color: #64748b; }
        .modal-nis-badge { color: #10b981; margin-left: 5px; font-family: monospace; font-weight: bold; }
        .modal-close { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 14px; color: #94a3b8; }
        .modal-info { display: flex; gap: 8px; padding: 10px 20px; background: #f0fdf4; border-bottom: 1px solid #bbf7d0; font-size: 13px; color: #166534; }
        .modal-body { padding: 20px; }
        .input-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
        .modal-input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
        .modal-input:focus { border-color: #10b981; }
        .modal-footer { display: flex; gap: 10px; padding: 14px 20px; justify-content: flex-end; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .btn-modal-cancel { padding: 8px 16px; border: 1px solid #cbd5e1; background: white; color: #475569; border-radius: 6px; font-size: 13.5px; cursor: pointer; }
        .btn-modal-submit { padding: 8px 18px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
        .btn-modal-submit:disabled { opacity: .5; cursor: not-allowed; }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
          .table-footer-pagination { flex-direction: column; align-items: center; }
        }
      `}</style>
    </AdminLayout>
  );
}