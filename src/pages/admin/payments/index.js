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

  // Filter Global atas tabel
  const [filterClass, setFilterClass] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showTambah, setShowTambah] = useState(false);
  const [tambahStudentId, setTambahStudentId] = useState("");
  const [tambahItems, setTambahItems] = useState([]);
  const [loadingTambah, setLoadingTambah] = useState(false);

  // State untuk searchable dropdown di dalam modal tambah tagihan
  const [searchSantri, setSearchSantri] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State untuk loading cek transaksi per bill
  const [cekLoadingId, setCekLoadingId] = useState(null);

  useEffect(() => {
    fetch("/api/payment-types").then(r => r.json()).then(setPaymentTypes);
    fetch("/api/classes/list").then(r => r.json()).then(setClasses);
    fetch("/api/students/academic-years").then(r => r.json()).then(setAcademicYears);
    loadStudents();
  }, []);

  // Tutup dropdown modal saat klik di luar
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
        setCurrentPage(1);
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

  // =============================================
  // MIDTRANS SANDBOX — Buat transaksi baru
  // =============================================
  const bayarMidtrans = async (billId) => {
    try {
      const res = await fetch("/api/payments/midtrans-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert("Gagal membuat transaksi: " + (data.message || "Error tidak diketahui"));
        return;
      }

      // Snap Midtrans: buka popup atau redirect
      if (data.snapToken) {
        // Gunakan Snap.js (pastikan sudah load di _document.js atau _app.js)
        if (window.snap) {
          window.snap.pay(data.snapToken, {
            onSuccess: async (result) => {
              console.log("Midtrans success:", result);
              alert("✅ Pembayaran berhasil!");
              await openDetail(selectedStudent.id);
            },
            onPending: async (result) => {
              console.log("Midtrans pending:", result);
              alert("⏳ Pembayaran sedang diproses (pending).");
              await openDetail(selectedStudent.id);
            },
            onError: (result) => {
              console.error("Midtrans error:", result);
              alert("❌ Pembayaran gagal: " + (result.status_message || ""));
            },
            onClose: () => {
              console.log("Midtrans popup ditutup");
            },
          });
        } else {
          // Fallback: redirect ke payment URL jika Snap.js tidak tersedia
          alert("Snap.js tidak tersedia. Mengarahkan ke halaman pembayaran...");
          window.open(data.redirectUrl, "_blank");
        }
      } else if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      } else {
        alert("Gagal: Response tidak valid dari server.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // =============================================
  // CEK STATUS TRANSAKSI MIDTRANS
  // =============================================
  const cekTransaksi = async (billId) => {
    setCekLoadingId(billId);
    try {
      const res = await fetch(`/api/payments/midtrans-check/${billId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        alert(
          `📋 Status Transaksi:\n\n` +
          `Order ID : ${data.orderId || "-"}\n` +
          `Status   : ${data.transactionStatus || data.status || "-"}\n` +
          `Metode   : ${data.paymentType || "-"}\n` +
          `Nominal  : Rp ${data.grossAmount ? Number(data.grossAmount).toLocaleString("id-ID") : "-"}\n\n` +
          (data.message || "")
        );
        // Refresh detail setelah cek (status mungkin sudah berubah)
        await openDetail(selectedStudent.id);
      } else {
        alert("Gagal cek transaksi: " + (data.message || "Error tidak diketahui"));
      }
    } catch (err) {
      alert("Error cek transaksi: " + err.message);
    } finally {
      setCekLoadingId(null);
    }
  };

  // =============================================
  // HAPUS TAGIHAN
  // =============================================
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

  // =============================================
  // HAPUS RIWAYAT PEMBAYARAN
  // =============================================
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

  // =============================================
  // TAMBAH TAGIHAN
  // =============================================
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

  // =============================================
  // FORMAT & CETAK KWITANSI
  // =============================================
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

  // =============================================
  // FILTER CLIENT SIDE
  // =============================================
  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.nisn && s.nisn.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const modalFilteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchSantri.toLowerCase()) ||
    (s.nis && s.nis.toLowerCase().includes(searchSantri.toLowerCase()))
  );

  const selectedSantriName = tambahStudentId
    ? students.find(s => s.id == tambahStudentId)?.name
    : null;

  // Tagihan yang ditampilkan di tabel: hanya UNPAID dan PENDING (bukan PAID)
  const activeBills = (selectedStudent?.bills || []).filter(
    b => b.status === "UNPAID" || b.status === "PENDING"
  );

  // =============================================
  // PAGINATION
  // =============================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  return (
    <AdminLayout>
      <div className="container">

        {/* HEADER UTAMA */}
        <div className="header-row">
          <div className="title-section">
            <span className="title-icon">💳</span>
            <div>
              <h2>Kelola Pembayaran Santri</h2>
              <p className="sub-title">Manajemen tagihan, invoice, dan riwayat pembayaran via Midtrans.</p>
            </div>
          </div>
          <button className="btn-tambah" onClick={() => setShowTambah(true)}>
            <span style={{ marginRight: "8px", fontSize: "18px" }}>+</span> Buat Tagihan
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="stats-grid">
          <div className="stat-card border-blue">
            <div className="stat-icon bg-blue">👥</div>
            <div>
              <p className="stat-label">Total Database Santri</p>
              <h3>{students.length} <span className="stat-unit">Santri</span></h3>
            </div>
          </div>
          <div className="stat-card border-green">
            <div className="stat-icon bg-green">✅</div>
            <div>
              <p className="stat-label">Hasil Filter Pencarian</p>
              <h3>{filteredStudents.length} <span className="stat-unit">Santri Cocok</span></h3>
            </div>
          </div>
          <div className="stat-card border-amber">
            <div className="stat-icon bg-amber">🏦</div>
            <div>
              <p className="stat-label">Gateway Pembayaran</p>
              <h3>Midtrans <span className="stat-unit">Sandbox</span></h3>
            </div>
          </div>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="filter-card">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="main-search-input"
              placeholder="Cari nama santri, NIS atau NISN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={filterClass}
              onChange={e => handleFilterClass(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={filterYear}
              onChange={e => handleFilterYear(e.target.value)}
            >
              <option value="">Semua Angkatan</option>
              {academicYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TABEL UTAMA */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "60px", textAlign: "center" }}>No</th>
                  <th>NIS / Username</th>
                  <th>NISN</th>
                  <th>Kelas</th>
                  <th>Tahun Ajaran</th>
                  <th>Nama Lengkap Santri</th>
                  <th style={{ textAlign: "center", width: "140px" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      <div className="empty-icon">📁</div>
                      <p>Tidak ada data pembayaran santri ditemukan.</p>
                    </td>
                  </tr>
                ) : currentStudents.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ textAlign: "center", color: "#94a3b8", fontWeight: "500" }}>
                      {indexOfFirstItem + i + 1}
                    </td>
                    <td className="font-mono text-dark">{s.nis || "-"}</td>
                    <td className="font-mono text-muted">{s.nisn || "-"}</td>
                    <td><span className="badge-class">{s.class?.name || "-"}</span></td>
                    <td style={{ color: "#475569" }}>{s.classHistories?.[0]?.academicYear || s.entryYear || "-"}</td>
                    <td style={{ fontWeight: "600", color: "#1e293b" }}>{s.name}</td>
                    <td style={{ textAlign: "center" }}>
                      <button className="btn-detail" onClick={() => openDetail(s.id)}>
                        👁️ Detail & Bayar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredStudents.length > 0 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Menampilkan <span>{indexOfFirstItem + 1}</span> -{" "}
                <span>{Math.min(indexOfLastItem, filteredStudents.length)}</span> dari{" "}
                <span>{filteredStudents.length}</span> Santri
              </div>
              <div className="pagination-buttons">
                <button
                  className="btn-page"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </button>
                <span className="page-indicator">
                  Halaman <strong>{currentPage}</strong> dari {totalPages}
                </span>
                <button
                  className="btn-page"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================
            MODAL TAMBAH TAGIHAN
        ============================================ */}
        {showTambah && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h3>📋 Buat Tagihan Baru</h3>
                  <p className="modal-sub">Pilih santri dan lampirkan beberapa tipe tagihan sekaligus.</p>
                </div>
                <button className="close-x" onClick={() => {
                  setShowTambah(false);
                  setTambahItems([]);
                  setTambahStudentId("");
                  setSearchSantri("");
                  setOpenDropdown(false);
                }}>✕</button>
              </div>

              {/* SEARCHABLE DROPDOWN */}
              <div className="form-group" ref={dropdownRef}>
                <label className="form-label">Pilih Santri Penerima</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="🔍 Ketik nama atau NIS santri..."
                    value={tambahStudentId ? selectedSantriName : searchSantri}
                    onChange={e => {
                      setSearchSantri(e.target.value);
                      setOpenDropdown(true);
                      if (tambahStudentId) setTambahStudentId("");
                    }}
                    onFocus={() => setOpenDropdown(true)}
                    className="form-input search-input-icon"
                  />
                  {tambahStudentId && (
                    <span
                      onClick={() => {
                        setTambahStudentId("");
                        setSearchSantri("");
                        setOpenDropdown(true);
                      }}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#94a3b8" }}
                    >✕</span>
                  )}
                </div>

                {openDropdown && (
                  <ul className="dropdown-list" style={{ position: "absolute", width: "100%", zIndex: 50, background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", marginTop: "4px", maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                    {modalFilteredStudents.length === 0 ? (
                      <li style={{ padding: "10px 14px", color: "#64748b" }}>😕 Santri tidak ditemukan</li>
                    ) : (
                      modalFilteredStudents.map(s => (
                        <li
                          key={s.id}
                          onClick={() => {
                            setTambahStudentId(s.id);
                            setSearchSantri("");
                            setOpenDropdown(false);
                          }}
                          className="dropdown-item"
                          style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9" }}
                        >
                          <span style={{ fontWeight: "500", color: "#1e293b" }}>{s.name}</span>
                          <span className="badge-class" style={{ fontSize: "11px" }}>{s.class?.name || "-"}</span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              {/* LIST PILIHAN JENIS TAGIHAN */}
              <div className="form-group">
                <label className="form-label">Pilih Tipe & Atur Nominal Tagihan</label>
                <div className="pt-container">
                  {paymentTypes.map(pt => {
                    const selected = tambahItems.find(i => i.paymentTypeId === pt.id);
                    return (
                      <div key={pt.id} className={`pt-item ${selected ? "active" : ""}`}>
                        <div className="pt-main-info">
                          <label className="pt-checkbox-label">
                            <input type="checkbox" checked={!!selected} onChange={() => toggleItem(pt)} />
                            <span className="pt-name">{pt.name}</span>
                          </label>
                          <span className="pt-default">Default: Rp {formatRupiah(pt.amount)}</span>
                        </div>
                        {selected && (
                          <div className="pt-inputs-row">
                            <div style={{ flex: 1 }}>
                              <span className="input-hint">Nominal Custom (Rp)</span>
                              <input
                                type="number"
                                placeholder="Nominal (Rp)"
                                value={selected.amount}
                                onChange={e => updateItem(pt.id, "amount", e.target.value)}
                                className="form-input"
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <span className="input-hint">Tanggal Jatuh Tempo</span>
                              <input
                                type="date"
                                value={selected.dueDate}
                                onChange={e => updateItem(pt.id, "dueDate", e.target.value)}
                                className="form-input"
                              />
                            </div>
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
                  setOpenDropdown(false);
                }}>
                  Batalkan
                </button>
                <button className="btn-simpan" onClick={handleTambahTagihan} disabled={loadingTambah}>
                  {loadingTambah ? "Menyimpan..." : "💾 Simpan & Rilis Tagihan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            MODAL DETAIL SANTRI
        ============================================ */}
        {selectedStudent && (
          <div className="modal-backdrop">
            <div className="modal-content detail-modal">
              <div className="modal-header">
                <div>
                  <h3>👤 Profil Administrasi Santri</h3>
                  <p className="modal-sub">Rincian invoice tagihan aktif dan log riwayat transaksi keuangan.</p>
                </div>
                <button className="close-x" onClick={() => setSelectedStudent(null)}>✕</button>
              </div>

              {/* INFO SANTRI */}
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-lbl">Nama Lengkap</span>
                  <span className="info-val">{selectedStudent.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-lbl">Kelas</span>
                  <span className="badge-class bg-emerald">{selectedStudent.class?.name || "-"}</span>
                </div>
                <div className="info-item">
                  <span className="info-lbl">Nomor Induk (NIS)</span>
                  <span className="font-mono text-dark">{selectedStudent.nis || "-"}</span>
                </div>
                <div className="info-item">
                  <span className="info-lbl">Tahun Ajaran</span>
                  <span className="info-val">{selectedStudent.classHistories?.[0]?.academicYear || selectedStudent.entryYear || "-"}</span>
                </div>
                <div className="info-item">
                  <span className="info-lbl">NISN</span>
                  <span className="font-mono text-dark">{selectedStudent.nisn || "-"}</span>
                </div>
              </div>

              <div className="section-divider" />

              {/* =============================================
                  DAFTAR TAGIHAN AKTIF
                  Hanya tampil: UNPAID dan PENDING
                  PAID tidak ditampilkan (sudah masuk riwayat)
              ============================================= */}
              <h4>📋 Daftar Tagihan Aktif (Belum Lunas)</h4>
              {activeBills.length === 0 ? (
                <p className="empty-subtext">🟢 Aman! Belum ada tagihan aktif untuk santri ini.</p>
              ) : (
                <div className="table-wrapper sub-table responsiveness-fix">
                  <table>
                    <thead>
                      <tr>
                        <th>Jenis Tagihan</th>
                        <th>Nominal</th>
                        <th>Jatuh Tempo</th>
                        <th style={{ textAlign: "center" }}>Status</th>
                        <th style={{ textAlign: "center", width: "220px" }}>Aksi Pembayaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeBills.map(b => {
                        const isPending = b.status === "PENDING";
                        return (
                          <tr key={b.id}>
                            <td style={{ fontWeight: 600, color: "#334155", whiteSpace: "nowrap" }}>
                              {b.paymentType.name}
                            </td>
                            <td style={{ fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>
                              Rp {b.amount.toLocaleString("id-ID")}
                            </td>
                            <td style={{ whiteSpace: "nowrap" }}>
                              {b.dueDate ? new Date(b.dueDate).toLocaleDateString("id-ID") : "-"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className={`status-badge ${isPending ? "pending" : "unpaid"}`}>
                                {isPending ? "⏳ PENDING" : "BELUM BAYAR"}
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <div className="action-flex-gap">
                                {/* Tombol bayar via Midtrans hanya untuk UNPAID */}
                                {!isPending && (
                                  <button
                                    className="btn-midtrans"
                                    onClick={() => bayarMidtrans(b.id)}
                                    title="Bayar via Midtrans"
                                  >
                                    🏦 Bayar
                                  </button>
                                )}
                                {/* Cek Status Transaksi */}
                                <button
                                  className="btn-cek"
                                  onClick={() => cekTransaksi(b.id)}
                                  disabled={cekLoadingId === b.id}
                                  title="Cek Status Transaksi Midtrans"
                                >
                                  {cekLoadingId === b.id ? "⏳..." : "🔍 Cek"}
                                </button>
                                {/* Hapus Tagihan */}
                                <button
                                  className="btn-hapus-icon"
                                  onClick={() => hapusBill(b.id)}
                                  title="Hapus Tagihan"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="section-divider" />

              {/* =============================================
                  LOG RIWAYAT PEMBAYARAN
                  Status selalu tampil "LUNAS"
              ============================================= */}
              <h4>💰 Log Jejak Riwayat Pembayaran</h4>
              {selectedStudent.payments.length === 0 ? (
                <p className="empty-subtext">Belum ada jejak riwayat pembayaran terekam.</p>
              ) : (
                <div className="table-wrapper sub-table responsiveness-fix">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>No</th>
                        <th>Jenis Pembayaran</th>
                        <th>Nominal</th>
                        <th>Metode</th>
                        <th style={{ textAlign: "center" }}>Status</th>
                        <th style={{ textAlign: "center", width: "120px" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.payments.map((p, i) => (
                        <tr key={p.id}>
                          <td style={{ color: "#94a3b8" }}>{i + 1}</td>
                          <td style={{ fontWeight: "500", whiteSpace: "nowrap" }}>{p.paymentType.name}</td>
                          <td style={{ fontWeight: "600", whiteSpace: "nowrap" }}>
                            Rp {p.amount.toLocaleString("id-ID")}
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <span className="method-tag">
                              {p.method === "CASH" ? "💵 Tunai" : "🏦 Transfer"}
                            </span>
                          </td>
                          {/* Status selalu LUNAS di riwayat */}
                          <td style={{ textAlign: "center" }}>
                            <span className="status-badge paid">✅ LUNAS</span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div className="action-flex-gap justify-center">
                              <button className="btn-cetak" onClick={() => cetakKwitansi(p)}>
                                🖨️ Cetak
                              </button>
                              <button
                                className="btn-hapus-small"
                                onClick={() => hapusPayment(p.id)}
                                title="Hapus Riwayat"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-footer-action">
                <button className="btn-tutup" onClick={() => setSelectedStudent(null)}>Tutup Rincian</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ===== GLOBAL & LAYOUT ===== */
        .container {
          padding: 28px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        /* ===== HEADER ===== */
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }
        .title-section { display: flex; align-items: center; gap: 16px; }
        .title-icon {
          font-size: 32px;
          background: white;
          padding: 10px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        h2 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .sub-title { margin: 4px 0 0; color: #64748b; font-size: 14px; }
        h3 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 700; }
        h4 { margin: 24px 0 12px; color: #1e293b; font-size: 15px; font-weight: 600; }

        /* ===== STATS CARDS ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .stat-icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .bg-blue { background: #eff6ff; }
        .bg-green { background: #ecfdf5; }
        .bg-amber { background: #fffbeb; }
        .border-blue { border-left: 4px solid #3b82f6; }
        .border-green { border-left: 4px solid #10b981; }
        .border-amber { border-left: 4px solid #f59e0b; }
        .stat-label { margin: 0; font-size: 12px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-unit { font-size: 13px; color: #64748b; font-weight: 400; }

        /* ===== FILTER BAR ===== */
        .filter-card {
          background: white;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .search-wrapper { position: relative; flex: 1; min-width: 280px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .main-search-input {
          width: 100%; padding: 10px 10px 10px 40px;
          border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px; outline: none;
        }
        .filter-group { display: flex; gap: 12px; }
        .filter-select {
          padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1;
          background: white; font-size: 14px; color: #334155; outline: none; cursor: pointer;
        }

        /* ===== MAIN TABLE ===== */
        .card {
          background: white; border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          overflow: hidden;
        }
        .table-wrapper { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        th {
          background: #f8fafc; padding: 14px 18px;
          color: #475569; font-weight: 600; border-bottom: 1px solid #e2e8f0;
        }
        td { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
        tr:hover td { background: #f8fafc; }

        /* ===== BADGES ===== */
        .badge-class {
          background: #f0fdf4; color: #16a34a;
          padding: 4px 10px; border-radius: 9999px;
          font-weight: 600; font-size: 12px; display: inline-block;
        }

        /* ===== STATUS BADGES ===== */
        .status-badge {
          padding: 4px 10px; border-radius: 4px;
          font-size: 11px; font-weight: 700; display: inline-block;
        }
        .status-badge.paid { background: #d1fae5; color: #065f46; }
        .status-badge.unpaid { background: #fee2e2; color: #991b1b; }
        .status-badge.pending { background: #fef9c3; color: #854d0e; }

        /* ===== BUTTONS ===== */
        .btn-tambah {
          background: #2e6b3e; color: white;
          border: none; padding: 11px 20px; border-radius: 8px;
          font-weight: 600; cursor: pointer;
          display: flex; align-items: center; transition: all 0.2s;
        }
        .btn-tambah:hover { background: #22522e; }

        .btn-detail {
          background: #f1f5f9; color: #334155;
          border: 1px solid #cbd5e1; padding: 8px 14px;
          border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.15s;
        }
        .btn-detail:hover { background: #e2e8f0; }

        /* Bayar Midtrans */
        .btn-midtrans {
          background: #0e7490; color: white;
          border: none; padding: 5px 11px;
          border-radius: 6px; font-weight: 600; font-size: 12px;
          cursor: pointer; white-space: nowrap; transition: background 0.15s;
        }
        .btn-midtrans:hover { background: #0c6280; }

        /* Cek Transaksi */
        .btn-cek {
          background: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1;
          padding: 5px 10px; border-radius: 6px;
          font-weight: 600; font-size: 12px; cursor: pointer; white-space: nowrap;
        }
        .btn-cek:hover { background: #e0f2fe; }
        .btn-cek:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Hapus Icon */
        .btn-hapus-icon {
          background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
          padding: 5px 8px; border-radius: 6px; cursor: pointer;
        }
        .btn-hapus-icon:hover { background: #fee2e2; }

        /* Cetak */
        .btn-cetak {
          background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155;
          padding: 5px 10px; border-radius: 6px; font-size: 12px;
          font-weight: 500; cursor: pointer; white-space: nowrap;
        }
        .btn-cetak:hover { background: #e2e8f0; }

        /* Hapus small */
        .btn-hapus-small {
          background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
          padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 12px;
        }
        .btn-hapus-small:hover { background: #fee2e2; }

        .btn-batal {
          background: white; border: 1px solid #cbd5e1; color: #475569;
          padding: 10px 18px; border-radius: 8px; font-weight: 500; cursor: pointer;
        }
        .btn-batal:hover { background: #f8fafc; }
        .btn-simpan {
          background: #2e6b3e; color: white; border: none;
          padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer;
        }
        .btn-simpan:hover { background: #22522e; }
        .btn-tutup {
          background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569;
          padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer;
        }
        .btn-tutup:hover { background: #e2e8f0; }

        /* ===== MODAL ===== */
        .modal-backdrop {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(15, 23, 42, 0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white; border-radius: 16px; width: 100%;
          max-width: 580px; padding: 24px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          position: relative; max-height: 90vh; overflow-y: auto;
        }
        .detail-modal { max-width: 820px; }
        .modal-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 20px;
        }
        .modal-sub { margin: 4px 0 0; color: #64748b; font-size: 13px; }
        .close-x { background: none; border: none; font-size: 18px; color: #94a3b8; cursor: pointer; }
        .close-x:hover { color: #475569; }

        /* ===== FORM ===== */
        .form-group { margin-bottom: 18px; position: relative; }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
        .form-input {
          width: 100%; padding: 10px 12px;
          border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none;
        }
        .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,131,246,0.1); }
        .dropdown-item:hover { background: #f8fafc; }

        /* Payment Types */
        .pt-container {
          display: flex; flex-direction: column; gap: 8px;
          max-height: 240px; overflow-y: auto;
          border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px;
        }
        .pt-item { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; transition: all 0.15s; }
        .pt-item.active { border-color: #2e6b3e; background: #f0f9f4; }
        .pt-main-info { display: flex; justify-content: space-between; align-items: center; }
        .pt-checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500; }
        .pt-default { font-size: 12px; color: #64748b; font-weight: 500; }
        .pt-inputs-row {
          display: flex; gap: 12px;
          margin-top: 12px; padding-top: 12px;
          border-top: 1px dashed #cbd5e1;
        }
        .input-hint { display: block; font-size: 11px; color: #64748b; margin-bottom: 4px; font-weight: 500; }

        .modal-actions {
          display: flex; justify-content: flex-end; gap: 12px;
          margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;
        }
        .modal-footer-action {
          display: flex; justify-content: flex-end;
          margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;
        }

        /* ===== DETAIL STUDENT INFO ===== */
        .info-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px; background: #f8fafc; padding: 14px;
          border-radius: 8px; border: 1px solid #e2e8f0;
        }
        .info-item { display: flex; flex-direction: column; gap: 4px; }
        .info-lbl { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
        .info-val { font-size: 14px; font-weight: 600; color: #0f172a; }
        .section-divider { height: 1px; background: #e2e8f0; margin: 20px 0; }

        /* ===== ACTION GROUP ===== */
        .action-flex-gap {
          display: flex; gap: 6px;
          justify-content: center; align-items: center;
        }
        .method-tag { font-size: 12px; }

        /* ===== PAGINATION ===== */
        .pagination-wrapper {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 18px; background: white; border-top: 1px solid #e2e8f0;
        }
        .pagination-info { font-size: 13px; color: #64748b; }
        .pagination-info span { font-weight: 600; color: #334155; }
        .pagination-buttons { display: flex; align-items: center; gap: 12px; }
        .btn-page {
          background: white; border: 1px solid #cbd5e1; color: #334155;
          padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
        }
        .btn-page:disabled { color: #cbd5e1; cursor: not-allowed; border-color: #e2e8f0; }
        .page-indicator { font-size: 13px; color: #64748b; }

        /* ===== UTILITIES ===== */
        .font-mono { font-family: monospace; font-size: 13px; }
        .text-dark { color: #1e293b; font-weight: 500; }
        .text-muted { color: #64748b; }
        .empty-state { text-align: center; padding: 40px !important; color: #64748b; }
        .empty-icon { font-size: 32px; margin-bottom: 8px; }
        .empty-subtext { color: #64748b; font-size: 14px; margin: 8px 0; }
        .text-success { color: #16a34a; font-weight: 600; font-size: 13px; }
        .justify-center { justify-content: center; }
      `}</style>
    </AdminLayout>
  );
}