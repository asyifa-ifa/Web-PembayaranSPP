import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";

const cleanAmount = (amount) => {
  if (!amount) return "0";
  return String(amount).replace(/\./g, "").replace(/,/g, "").replace(/\D/g, "");
};

export default function PaymentPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [filterClass, setFilterClass] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const [showTambah, setShowTambah] = useState(false);
  const [tambahStudentId, setTambahStudentId] = useState("");
  const [tambahItems, setTambahItems] = useState([]);
  const [loadingTambah, setLoadingTambah] = useState(false);

  // State untuk searchable dropdown
  const [searchSantri, setSearchSantri] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // --- STATE BARU: PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch("/api/payment-types").then(r => r.json()).then(setPaymentTypes);
    fetch("/api/classes/list").then(r => r.json()).then(setClasses);
    fetch("/api/students/academic-years").then(r => r.json()).then(setAcademicYears);
    loadStudents();
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadStudents = (classId = "", academicYear = "") => {
    const params = new URLSearchParams();
    if (classId) params.append("classId", classId);
    if (academicYear) params.append("academicYear", academicYear);
    const query = params.toString() ? `?${params.toString()}` : "";

    fetch(`/api/students/payment-list${query}`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        setCurrentPage(1); // Reset ke halaman 1 setiap kali filter berubah
      });
  };

  const handleFilterClass = (val) => {
    setFilterClass(val);
    loadStudents(val, filterYear);
  };

  const handleFilterYear = (val) => {
    setFilterYear(val);
    loadStudents(filterClass, val);
  };

  const openDetail = async (id) => {
    const res = await fetch(`/api/students/${id}/detail`);
    const data = await res.json();
    setSelectedStudent(data);
  };

  const konfirmasiCash = async (billId) => {
    if (!confirm("Konfirmasi pembayaran CASH?")) return;
    const res = await fetch(`/api/bills/${billId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "CASH" }),
    });
    const data = await res.json();
    alert(data.message);
    openDetail(selectedStudent.id);
  };

  const bayarTransfer = async (billId) => {
    const res = await fetch("/api/payments/duitku-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billId }),
    });
    const data = await res.json();
    if (data.paymentUrl) {
      window.open(data.paymentUrl, "_blank");
    } else {
      alert("Gagal: " + data.message);
    }
  };

  const hapusBill = async (billId) => {
    if (!confirm("Hapus tagihan ini?")) return;
    const res = await fetch(`/api/bills/${billId}/delete`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      alert("✅ Tagihan berhasil dihapus!");
      openDetail(selectedStudent.id);
    } else {
      alert("Gagal: " + data.message);
    }
  };

  const hapusPayment = async (paymentId) => {
    if (!confirm("Hapus riwayat pembayaran ini?")) return;
    const res = await fetch(`/api/payments/${paymentId}/delete`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      alert("✅ Riwayat pembayaran berhasil dihapus!");
      openDetail(selectedStudent.id);
    } else {
      alert("Gagal: " + data.message);
    }
  };

  const toggleItem = (pt) => {
    setTambahItems(prev => {
      const exists = prev.find(i => i.paymentTypeId === pt.id);
      if (exists) return prev.filter(i => i.paymentTypeId !== pt.id);
      return [...prev, { paymentTypeId: pt.id, name: pt.name, amount: pt.amount, dueDate: "" }];
    });
  };

  const updateItem = (id, field, value) => {
    setTambahItems(prev => prev.map(i =>
      i.paymentTypeId === id ? { ...i, [field]: value } : i
    ));
  };

  const handleTambahTagihan = async () => {
    if (!tambahStudentId) return alert("Pilih santri dulu");
    if (tambahItems.length === 0) return alert("Pilih minimal satu jenis tagihan");

    setLoadingTambah(true);
    try {
      const cleanItems = tambahItems.map(item => ({
        ...item,
        amount: cleanAmount(item.amount)
      }));

      const res = await fetch("/api/bills/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: tambahStudentId, items: cleanItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("✅ Tagihan berhasil dibuat!");
      setShowTambah(false);
      setTambahStudentId("");
      setTambahItems([]);
      setSearchSantri("");
      loadStudents(filterClass, filterYear);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoadingTambah(false);
    }
  };

  const formatRupiah = (v) => new Intl.NumberFormat("id-ID").format(v);

  const cetakKwitansi = (p) => {
    const tanggal = new Date(p.createdAt).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });

    const html = `
      <html>
      <head>
        <title>Kwitansi Pembayaran</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: auto; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #2e6b3e; padding-bottom: 15px; margin-bottom: 20px; }
          .header h2 { color: #2e6b3e; margin: 0; font-size: 16px; }
          .header p { margin: 4px 0; color: #666; font-size: 12px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { color: #666; font-size: 13px; }
          .value { font-weight: bold; font-size: 13px; }
          .total { background: #f0f9f4; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; }
          .total p { margin: 0; font-size: 22px; font-weight: bold; color: #2e6b3e; }
          .total small { color: #888; font-size: 12px; }
          .footer { text-align: center; margin-top: 25px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
          .status { color: green; font-weight: bold; }
          .btn-print { width: 100%; padding: 12px; background: #2e6b3e; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; margin-top: 20px; }
          @media print { .btn-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>MADRASAH TARBIYATUL MUBALIGHIN</h2>
          <p>Sumberjo - Kwitansi Pembayaran SPP</p>
        </div>
        <div class="row"><span class="label">No. Kwitansi</span><span class="value">#KW-${String(p.id).padStart(5, "0")}</span></div>
        <div class="row"><span class="label">Tanggal</span><span class="value">${tanggal}</span></div>
        <div class="row"><span class="label">Nama Santri</span><span class="value">${selectedStudent.name}</span></div>
        <div class="row"><span class="label">NIS</span><span class="value">${selectedStudent.nis || "-"}</span></div>
        <div class="row"><span class="label">NISN</span><span class="value">${selectedStudent.nisn || "-"}</span></div>
        <div class="row"><span class="label">Kelas</span><span class="value">${selectedStudent.class?.name || "-"}</span></div>
        <div class="row"><span class="label">Jenis Pembayaran</span><span class="value">${p.paymentType.name}</span></div>
        <div class="row"><span class="label">Metode Pembayaran</span><span class="value">${p.method === "CASH" ? "💵 Tunai" : "🏦 Transfer"}</span></div>
        <div class="row"><span class="label">Status</span><span class="value status">✅ LUNAS</span></div>
        <div class="total">
          <small>Total Pembayaran</small>
          <p>Rp ${formatRupiah(p.amount)}</p>
        </div>
        <div class="footer">
          <p>Terima kasih atas pembayaran Anda</p>
          <p><b>Madrasah Tarbiyatul Mubalighin Sumberjo</b></p>
        </div>
        <button class="btn-print" onclick="window.print()">🖨️ Cetak Kwitansi</button>
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchSantri.toLowerCase()) ||
    (s.nis && s.nis.toLowerCase().includes(searchSantri.toLowerCase()))
  );

  const selectedSantriName = tambahStudentId
    ? students.find(s => s.id == tambahStudentId)?.name
    : null;

  // --- LOGIC PEMOTONGAN DATA PAGINATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = students.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(students.length / itemsPerPage);

  return (
    <AdminLayout>
      <div className="container">

        <div className="header-row">
          <div className="title-section">
            <span className="title-icon">📄</span>
            <h2>Data Pembayaran Santri</h2>
          </div>
          <button className="btn-tambah" onClick={() => setShowTambah(true)}>
            <span style={{ marginRight: '6px' }}>+</span> Buat Tagihan
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="filter-row">
          <div className="filter-group">
            <select
              className="filter-select"
              value={filterClass}
              onChange={e => handleFilterClass(e.target.value)}
            >
              <option value="">-- Semua Kelas --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={filterYear}
              onChange={e => handleFilterYear(e.target.value)}
            >
              <option value="">-- Semua Tahun Ajaran --</option>
              {academicYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <span className="count-badge">{students.length} Santri Terdaftar</span>
        </div>

        {/* MAIN DATA CARD */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "60px", textAlign: "center" }}>No</th>
                  <th>NIS</th>
                  <th>NISN</th>
                  <th>Kelas</th>
                  <th>Tahun Ajaran</th>
                  <th>Nama Santri</th>
                  <th style={{ textAlign: "center", width: "120px" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      👋 Tidak ada data santri ditemukan.
                    </td>
                  </tr>
                ) : currentStudents.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ textAlign: "center", color: "#888" }}>
                      {indexOfFirstItem + i + 1}
                    </td>
                    <td className="font-mono">{s.nis || "-"}</td>
                    <td className="font-mono">{s.nisn || "-"}</td>
                    <td><span className="badge-class">{s.class?.name || "-"}</span></td>
                    <td>{s.classHistories?.[0]?.academicYear || s.entryYear || "-"}</td>
                    <td style={{ fontWeight: "500", color: "#2c3e50" }}>{s.name}</td>
                    <td style={{ textAlign: "center" }}>
                      <button className="btn-detail" onClick={() => openDetail(s.id)}>
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- ELEMENT BARU: NAVIGASI PAGINATION DI BAWAH TABEL --- */}
          {students.length > 0 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Menampilkan <b>{indexOfFirstItem + 1}</b> - <b>{Math.min(indexOfLastItem, students.length)}</b> dari <b>{students.length}</b> santri
              </div>
              <div className="pagination-buttons">
                <button 
                  className="btn-page" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ⬅ Sebelumnya
                </button>
                <span className="page-indicator">
                  Halaman <b>{currentPage}</b> dari {totalPages}
                </span>
                <button 
                  className="btn-page" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Berikutnya ➡
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL TAMBAH TAGIHAN */}
        {showTambah && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>📋 Buat Tagihan Santri</h3>
                <button className="close-x" onClick={() => setShowTambah(false)}>✕</button>
              </div>

              {/* SEARCHABLE DROPDOWN */}
              <div className="field" ref={dropdownRef} style={{ position: "relative" }}>
                <label>Pilih Santri</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder={selectedSantriName ? selectedSantriName : "🔍 Cari nama atau NIS santri..."}
                    value={searchSantri}
                    onChange={e => {
                      setSearchSantri(e.target.value);
                      setOpenDropdown(true);
                      if (tambahStudentId) setTambahStudentId("");
                    }}
                    onFocus={() => setOpenDropdown(true)}
                    className="search-input"
                  />
                  {tambahStudentId && (
                    <span
                      onClick={() => {
                        setTambahStudentId("");
                        setSearchSantri("");
                        setOpenDropdown(true);
                      }}
                      className="clear-search"
                    >✕</span>
                  )}
                </div>

                {openDropdown && !tambahStudentId && (
                  <ul className="dropdown-list">
                    {filteredStudents.length === 0 ? (
                      <li className="dropdown-empty">😕 Santri tidak ditemukan</li>
                    ) : (
                      filteredStudents.map(s => (
                        <li
                          key={s.id}
                          onClick={() => {
                            setTambahStudentId(s.id);
                            setSearchSantri("");
                            setOpenDropdown(false);
                          }}
                          className="dropdown-item"
                        >
                          <span style={{ fontWeight: 500 }}>{s.name}</span>
                          <span className="dropdown-badge-class">{s.class?.name || "-"}</span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              {/* JENIS TAGIHAN */}
              <div className="field">
                <label>Pilih Jenis Tagihan</label>
                <div className="pt-container">
                  {paymentTypes.map(pt => {
                    const selected = tambahItems.find(i => i.paymentTypeId === pt.id);
                    return (
                      <div key={pt.id} className={`pt-item ${selected ? 'active' : ''}`}>
                        <div className="pt-main-info">
                          <input type="checkbox" checked={!!selected} onChange={() => toggleItem(pt)} id={`pt-${pt.id}`} />
                          <label htmlFor={`pt-${pt.id}`} className="pt-name">{pt.name}</label>
                          <span className="pt-default">Rp {formatRupiah(pt.amount)}</span>
                        </div>
                        {selected && (
                          <div className="pt-inputs-row">
                            <input
                              type="number"
                              placeholder="Nominal (Rp)"
                              value={selected.amount}
                              onChange={e => updateItem(pt.id, "amount", e.target.value)}
                              className="pt-input"
                            />
                            <input
                              type="date"
                              value={selected.dueDate}
                              onChange={e => updateItem(pt.id, "dueDate", e.target.value)}
                              className="pt-input"
                              title="Jatuh Tempo"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-batal" onClick={() => {
                  setShowTambah(false);
                  setTambahItems([]);
                  setTambahStudentId("");
                  setSearchSantri("");
                }}>
                  Batal
                </button>
                <button className="btn-simpan" onClick={handleTambahTagihan} disabled={loadingTambah}>
                  {loadingTambah ? "Menyimpan..." : "💾 Simpan Tagihan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETAIL SANTRI */}
        {selectedStudent && (
          <div className="modal">
            <div className="modal-content detail-modal">
              <div className="modal-header">
                <h3>👤 Detail Administrasi Santri</h3>
                <button className="close-x" onClick={() => setSelectedStudent(null)}>✕</button>
              </div>
              
              <div className="info-grid">
                <div className="info-item"><b>Nama:</b> {selectedStudent.name}</div>
                <div className="info-item"><b>Kelas:</b> {selectedStudent.class?.name || "-"}</div>
                <div className="info-item"><b>NIS:</b> <span className="font-mono">{selectedStudent.nis || "-"}</span></div>
                <div className="info-item"><b>Tahun Ajaran:</b> {selectedStudent.classHistories?.[0]?.academicYear || selectedStudent.entryYear || "-"}</div>
                <div className="info-item"><b>NISN:</b> <span className="font-mono">{selectedStudent.nisn || "-"}</span></div>
              </div>

              <div className="section-divider" />
              <h4>📋 Daftar Tagihan Aktif</h4>
              {selectedStudent.bills.length === 0 ? (
                <p className="empty-subtext">Belum ada tagihan untuk santri ini.</p>
              ) : (
                <div className="table-wrapper sub-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Jenis Tagihan</th>
                        <th>Nominal</th>
                        <th>Jatuh Tempo</th>
                        <th style={{ textAlign: "center" }}>Status</th>
                        <th style={{ textAlign: "center" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.bills.map(b => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 500 }}>{b.paymentType.name}</td>
                          <td>Rp {b.amount.toLocaleString("id-ID")}</td>
                          <td>{b.dueDate ? new Date(b.dueDate).toLocaleDateString("id-ID") : "-"}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`status-badge ${b.status === "PAID" ? "paid" : "unpaid"}`}>
                              {b.status === "PAID" ? "LUNAS" : "BELUM BAYAR"}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {b.status === "UNPAID" ? (
                              <div className="action-flex-gap">
                                <button className="btn-cash" onClick={() => konfirmasiCash(b.id)}>💵 Tunai</button>
                                <button className="btn-transfer" onClick={() => bayarTransfer(b.id)}>🏦 Transfer</button>
                                <button className="btn-hapus-icon" onClick={() => hapusBill(b.id)} title="Hapus Tagihan">🗑️</button>
                              </div>
                            ) : (
                              <span className="text-success">✔ Terbayar</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="section-divider" />
              <h4>💰 Riwayat Pembayaran</h4>
              {selectedStudent.payments.length === 0 ? (
                <p className="empty-subtext">Belum ada riwayat jejak pembayaran.</p>
              ) : (
                <div className="table-wrapper sub-table">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}>No</th>
                        <th>Jenis Pembayaran</th>
                        <th>Nominal</th>
                        <th>Metode</th>
                        <th style={{ textAlign: "center" }}>Status</th>
                        <th style={{ textAlign: "center" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.payments.map((p, i) => (
                        <tr key={p.id}>
                          <td>{i + 1}</td>
                          <td>{p.paymentType.name}</td>
                          <td>Rp {p.amount.toLocaleString("id-ID")}</td>
                          <td>{p.method === "CASH" ? "💵 Tunai" : "🏦 Transfer"}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`payment-status ${p.status.toLowerCase()}`}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div className="action-flex-gap justify-center">
                              {p.status === "SUCCESS" && (
                                <button className="btn-cetak" onClick={() => cetakKwitansi(p)}>🖨️ Kwitansi</button>
                              )}
                              {(p.status === "PENDING" || p.status === "FAILED") && (
                                <button className="btn-hapus-small" onClick={() => hapusPayment(p.id)}>Hapus</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-footer-action">
                <button className="btn-tutup" onClick={() => setSelectedStudent(null)}>Tutup Halaman</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* Global & Layout Container */
        .container { 
          padding: 24px; 
          background: #f8fafc; 
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        /* Header Section */
        .header-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 24px; 
        }
        .title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .title-icon { font-size: 24px; }
        h2 { margin: 0; color: #1e293b; font-size: 22px; font-weight: 700; }
        h3 { margin: 0; color: #0f172a; font-size: 18px; }
        h4 { margin: 16px 0 10px; color: #334155; font-size: 15px; font-weight: 600; }

        /* Filter Controls */
        .filter-row {
          display: flex; 
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px; 
          flex-wrap: wrap;
          gap: 12px;
        }
        .filter-group {
          display: flex;
          gap: 12px;
        }
        .filter-select {
          padding: 10px 36px 10px 14px; 
          border-radius: 8px;
          border: 1px solid #cbd5e1; 
          background: white;
          font-size: 14px; 
          color: #334155; 
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; 
          background-position: right 12px center;
          cursor: pointer; 
          min-width: 180px;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .filter-select:focus { border-color: #2e6b3e; box-shadow: 0 0 0 3px rgba(46,107,62,0.15); }
        
        .count-badge {
          font-size: 13px; 
          color: #2e6b3e; 
          background: #eaf4ed;
          padding: 6px 14px; 
          border-radius: 30px; 
          font-weight: 500;
        }

        /* Card & Design Table Modern */
        .card { 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .table-wrapper { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        th, td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; }
        th { background: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
        tr:hover { background-color: #fafbfd; }
        .empty-state { text-align: center; color: #64748b; padding: 40px !important; font-size: 15px; }
        .font-mono { font-family: monospace; color: #475569; font-size: 13px; }
        
        /* Badges */
        .badge-class {
          background: #f1f5f9;
          color: #334155;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        /* --- CSS PAGINATION BARU --- */
        .pagination-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pagination-info {
          font-size: 13px;
          color: #64748b;
        }
        .pagination-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-page {
          background: white;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-page:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #94a3b8;
        }
        .btn-page:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .page-indicator {
          font-size: 13px;
          color: #334155;
        }

        /* Buttons Styling */
        .btn-tambah { 
          background: #2e6b3e; 
          color: white; 
          padding: 10px 20px; 
          border-radius: 8px; 
          border: none; 
          cursor: pointer; 
          font-weight: 600; 
          font-size: 14px;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          box-shadow: 0 2px 4px rgba(46,107,62,0.2);
        }
        .btn-tambah:hover { background: #23522f; }
        
        .btn-detail { 
          background: white; 
          color: #2e6b3e; 
          padding: 6px 14px; 
          border-radius: 6px; 
          border: 1px solid #2e6b3e; 
          cursor: pointer; 
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-detail:hover { background: #2e6b3e; color: white; }

        /* Modals Modernization */
        .modal { 
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
          display: flex; justify-content: center; align-items: center; z-index: 999; 
        }
        .modal-content { 
          background: white; padding: 28px; width: 680px; max-height: 85vh; 
          overflow-y: auto; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); 
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 20px;
        }
        .close-x {
          background: none; border: none; font-size: 16px; color: #94a3b8; cursor: pointer; padding: 4px;
        }
        .close-x:hover { color: #475569; }

        /* Form Controls in Modal */
        .field { margin-bottom: 20px; }
        .field label { display: block; font-size: 13px; color: #475569; margin-bottom: 6px; font-weight: 600; }
        
        .search-input {
          width: 100%; padding: 11px 36px 11px 14px; border-radius: 8px;
          border: 1px solid #cbd5e1; font-size: 14px; outline: none; box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .search-input:focus { border-color: #2e6b3e; }
        .clear-search {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          cursor: pointer; color: #94a3b8; font-size: 14px;
        }

        /* Search Dropdown list */
        .dropdown-list {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: white; border: 1px solid #e2e8f0; border-radius: 8px;
          max-height: 200px; overflow-y: auto; z-index: 1000; margin: 0; padding: 4px;
          list-style: none; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .dropdown-item {
          padding: 10px 12px; cursor: pointer; border-radius: 6px; font-size: 14px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .dropdown-item:hover { background: #f1f5f9; }
        .dropdown-badge-class { font-size: 11px; background: #e2e8f0; padding: 2px 8px; border-radius: 10px; color: #475569;}

        /* Payment Items Component */
        .pt-container { border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; background: #f8fafc; }
        .pt-item { padding: 10px; border-radius: 6px; background: white; border: 1px solid #e2e8f0; margin-bottom: 6px; transition: all 0.2s;}
        .pt-item.active { border-color: #2e6b3e; background: #f0f9f4;}
        .pt-main-info { display: flex; align-items: center; gap: 10px; }
        .pt-name { flex: 1; font-size: 14px; color: #1e293b; cursor: pointer; }
        .pt-default { color: #64748b; font-size: 13px; font-weight: 500; }
        .pt-inputs-row { display: flex; gap: 10px; margin-top: 10px; padding-left: 24px; }
        .pt-input { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; }
        .pt-input:focus { border-color: #2e6b3e; }

        /* Modal Actions Buttons */
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .btn-simpan { background: #2e6b3e; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }
        .btn-simpan:disabled { background: #94a3b8; }
        .btn-batal { background: white; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 8px; cursor: pointer; color: #64748b; font-weight: 500; }
        .btn-batal:hover { background: #f8fafc; color: #334155; }

        /* Student Detail View Modifications */
        .detail-modal { width: 760px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 10fr); gap: 10px 20px; background: #f8fafc; padding: 14px; border-radius: 8px; font-size: 14px; color: #334155;}
        .section-divider { height: 1px; background: #e2e8f0; margin: 20px 0 14px; }
        .sub-table table th { background: #f1f5f9; padding: 10px 12px; }
        .sub-table table td { padding: 10px 12px; font-size: 13px; }
        .empty-subtext { color: #94a3b8; font-size: 13px; font-style: italic; margin: 5px 0; }
      `}</style>
    </AdminLayout>
  );
}