import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";

const cleanAmount = (amount) => {
  if (!amount) return "0";
  return String(amount).replace(/\./g, "").replace(/,/g, "").replace(/\D/g, "");
};

export default function ManualPayment() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedStudentData, setSelectedStudentData] = useState(null);
  const [bills, setBills] = useState([]);
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [form, setForm] = useState({
    paymentTypeId: "",
    amount: "",
    method: "CASH",
    note: "",
    academicYear: "", // ✅ tambah ini
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/students/list").then((r) => r.json()).then(setStudents);
    fetch("/api/payment-types").then((r) => r.json()).then(setPaymentTypes);
  }, []);

  useEffect(() => {
    if (!selectedStudent) { setBills([]); setSelectedStudentData(null); return; }
    fetch(`/api/students/${selectedStudent}/detail`)
      .then((r) => r.json())
      .then((data) => {
        setSelectedStudentData(data);
        const unpaid = data.bills?.filter((b) => b.status === "UNPAID") || [];
        setBills(unpaid);
      });
  }, [selectedStudent]);

  const handleBillSelect = (billId) => {
    const bill = bills.find((b) => b.id === Number(billId));
    if (bill) {
      setSelectedBillId(bill.id);
      setForm((prev) => ({
        ...prev,
        paymentTypeId: String(bill.paymentTypeId),
        amount: String(bill.amount),
      }));
    }
  };

  const formatRupiah = (v) => new Intl.NumberFormat("id-ID").format(v);

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setForm((prev) => ({ ...prev, amount: raw }));
  };

  const handleSubmit = async () => {
    if (!selectedStudent) return alert("Pilih santri dulu");
    if (!form.paymentTypeId) return alert("Pilih jenis pembayaran");
    if (!form.amount) return alert("Isi nominal");
    if (!form.academicYear) return alert("Isi tahun ajaran"); // ✅ tambah validasi

    setLoading(true);
    try {
      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          paymentTypeId: form.paymentTypeId,
          amount: cleanAmount(form.amount),
          method: "CASH",
          note: form.note,
          academicYear: form.academicYear, // ✅ tambah ini
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      alert("✅ Pembayaran berhasil dicatat & email terkirim!");
      router.push("/admin/payments");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="page-wrapper">
        {/* Header */}
        <div className="page-header">
          <div className="header-badge">💵 Tunai / Cash</div>
          <div>
            <h1 className="page-title">Input Pembayaran Manual</h1>
            <p className="page-subtitle">Catat pembayaran tunai santri secara langsung</p>
          </div>
        </div>

        <div className="content-grid">
          {/* Form Card */}
          <div className="form-card">

            {/* Section: Pilih Santri */}
            <div className="section">
              <div className="section-header">
                <div className="section-num">1</div>
                <div>
                  <div className="section-title">Pilih Santri</div>
                  <div className="section-sub">Cari dan pilih nama santri</div>
                </div>
              </div>

              <div className="field">
                <label className="field-label">Nama Santri</label>
                <div className="select-wrap">
                  <svg className="select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <select
                    className="field-select padded"
                    value={selectedStudent}
                    onChange={(e) => {
                      setSelectedStudent(e.target.value);
                      setSelectedBillId(null);
                      setForm((prev) => ({ ...prev, paymentTypeId: "", amount: "" }));
                    }}
                  >
                    <option value="">-- Pilih Santri --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.class?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedStudentData && (
                <div className="student-card">
                  <div className="student-avatar">{selectedStudentData.name?.charAt(0)?.toUpperCase()}</div>
                  <div className="student-details">
                    <div className="student-name-large">{selectedStudentData.name}</div>
                    <div className="student-meta">
                      <span className="meta-badge">{selectedStudentData.class?.name}</span>
                      <span className="meta-badge">{selectedStudentData.entryYear}</span>
                    </div>
                  </div>
                  <div className="student-bill-count">
                    <div className="bill-count-num">{bills.length}</div>
                    <div className="bill-count-label">Tagihan</div>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Tagihan */}
            {selectedStudent && (
              <div className="section">
                <div className="section-header">
                  <div className="section-num">2</div>
                  <div>
                    <div className="section-title">Tagihan Belum Dibayar</div>
                    <div className="section-sub">Klik untuk otomatis mengisi form</div>
                  </div>
                </div>

                {bills.length === 0 ? (
                  <div className="empty-bills">
                    <span className="empty-bills-icon">🎉</span>
                    <span>Semua tagihan sudah lunas!</span>
                  </div>
                ) : (
                  <div className="bills-list">
                    {bills.map((b) => (
                      <div
                        key={b.id}
                        className={`bill-item ${selectedBillId === b.id ? "selected" : ""}`}
                        onClick={() => handleBillSelect(b.id)}
                      >
                        <div className="bill-left">
                          <div className="bill-check">{selectedBillId === b.id ? "✓" : ""}</div>
                          <div>
                            <div className="bill-name">{b.paymentType.name}</div>
                            <div className="bill-due">Jatuh tempo: {b.dueDate ? new Date(b.dueDate).toLocaleDateString("id-ID") : "-"}</div>
                          </div>
                        </div>
                        <div className="bill-amount">Rp {formatRupiah(b.amount)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section: Detail Pembayaran */}
            <div className="section">
              <div className="section-header">
                <div className="section-num">{selectedStudent ? "3" : "2"}</div>
                <div>
                  <div className="section-title">Detail Pembayaran</div>
                  <div className="section-sub">Isi informasi pembayaran</div>
                </div>
              </div>

              <div className="fields-grid">
                {/* Jenis Pembayaran */}
                <div className="field">
                  <label className="field-label">Jenis Pembayaran</label>
                  <select
                    className="field-select"
                    value={form.paymentTypeId}
                    onChange={(e) => setForm((prev) => ({ ...prev, paymentTypeId: e.target.value }))}
                  >
                    <option value="">-- Pilih Jenis --</option>
                    {paymentTypes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Nominal */}
                <div className="field">
                  <label className="field-label">Nominal</label>
                  <div className="amount-wrap">
                    <span className="amount-prefix">Rp</span>
                    <input
                      className="field-input amount-input"
                      type="text"
                      inputMode="numeric"
                      value={form.amount ? formatRupiah(form.amount) : ""}
                      onChange={handleAmountChange}
                      placeholder="0"
                    />
                  </div>
                  {form.amount && (
                    <div className="amount-terbilang">
                      Rp {formatRupiah(form.amount)}
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ Tahun Ajaran */}
              <div className="field">
                <label className="field-label">Tahun Ajaran</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="contoh: 2024/2025"
                  value={form.academicYear}
                  onChange={(e) => setForm((prev) => ({ ...prev, academicYear: e.target.value }))}
                />
              </div>

              {/* Metode */}
              <div className="field">
                <label className="field-label">Metode Pembayaran</label>
                <div className="cash-only-badge">
                  <span className="cash-icon">💵</span>
                  <div>
                    <div className="cash-title">Tunai (Cash)</div>
                    <div className="cash-sub">Pembayaran manual hanya menerima tunai</div>
                  </div>
                </div>
              </div>

              {/* Catatan */}
              <div className="field">
                <label className="field-label">
                  Catatan
                  <span className="optional-tag">opsional</span>
                </label>
                <textarea
                  className="field-textarea"
                  value={form.note}
                  onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Keterangan tambahan jika ada..."
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="info-box">
              <span className="info-icon">📧</span>
              <span>Email konfirmasi akan otomatis terkirim ke santri setelah pembayaran berhasil dicatat.</span>
            </div>

            {/* Submit Button */}
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={loading || !selectedStudent || !form.paymentTypeId || !form.amount || !form.academicYear}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Konfirmasi Pembayaran
                </>
              )}
            </button>
          </div>

          {/* Summary Panel */}
          <div className="summary-panel">
            <div className="summary-card">
              <div className="summary-title">Ringkasan</div>

              <div className="summary-row">
                <span className="summary-label">Santri</span>
                <span className="summary-value">{selectedStudentData?.name || "—"}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Kelas</span>
                <span className="summary-value">{selectedStudentData?.class?.name || "—"}</span>
              </div>
              {/* ✅ Tampilkan tahun ajaran di summary */}
              <div className="summary-row">
                <span className="summary-label">Tahun Ajaran</span>
                <span className="summary-value">{form.academicYear || "—"}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row">
                <span className="summary-label">Jenis</span>
                <span className="summary-value">
                  {paymentTypes.find((p) => String(p.id) === form.paymentTypeId)?.name || "—"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Metode</span>
                <span className="summary-value">💵 Tunai (Cash)</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-total-row">
                <span className="summary-total-label">Total</span>
                <span className="summary-total-value">
                  {form.amount ? `Rp ${formatRupiah(form.amount)}` : "—"}
                </span>
              </div>

              <div className="summary-status">
                {selectedStudent && form.paymentTypeId && form.amount && form.academicYear ? (
                  <div className="status-ready">✅ Siap dikonfirmasi</div>
                ) : (
                  <div className="status-pending">⏳ Lengkapi form terlebih dahulu</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-wrapper {
          padding: 24px;
          max-width: 1100px;
          margin: 0 auto;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
        }
        .page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #dcfce7;
          border: 1.5px solid #86efac;
          color: #15803d;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }
        .page-title {
          margin: 0;
          font-size: clamp(18px, 3vw, 24px);
          font-weight: 700;
          color: #14532d;
          letter-spacing: -0.4px;
        }
        .page-subtitle { margin: 2px 0 0; font-size: 13px; color: #6b7280; }
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
          align-items: start;
        }
        .form-card {
          background: white;
          border-radius: 18px;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          border: 1.5px solid #d1fae5;
          overflow: hidden;
        }
        .section {
          padding: 24px;
          border-bottom: 1.5px solid #f0fdf4;
        }
        .section:last-of-type { border-bottom: none; }
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .section-num {
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #16a34a, #22c55e);
          color: white;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          flex-shrink: 0;
        }
        .section-title { font-size: 15px; font-weight: 600; color: #14532d; }
        .section-sub { font-size: 12px; color: #9ca3af; margin-top: 1px; }
        .field { margin-bottom: 16px; }
        .field:last-child { margin-bottom: 0; }
        .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }
        .optional-tag {
          background: #f0fdf4;
          color: #6b7280;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 20px;
          font-weight: 400;
          border: 1px solid #d1fae5;
        }
        .field-select, .field-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #d1fae5;
          border-radius: 10px;
          font-size: 14px;
          color: #111827;
          background: white;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          box-sizing: border-box;
          appearance: none;
        }
        .field-select:focus, .field-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22,163,74,.1);
        }
        .field-textarea {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #d1fae5;
          border-radius: 10px;
          font-size: 14px;
          color: #111827;
          background: white;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          box-sizing: border-box;
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        .field-textarea:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.1); }
        .select-wrap { position: relative; }
        .select-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          pointer-events: none;
        }
        .field-select.padded { padding-left: 38px; }
        .student-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1.5px solid #86efac;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .student-avatar {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #16a34a, #22c55e);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 16px; font-weight: 700;
          flex-shrink: 0;
        }
        .student-details { flex: 1; }
        .student-name-large { font-size: 14px; font-weight: 600; color: #111827; }
        .student-meta { display: flex; gap: 6px; margin-top: 4px; }
        .meta-badge {
          background: white;
          color: #16a34a;
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 20px;
          border: 1px solid #86efac;
        }
        .student-bill-count { text-align: center; flex-shrink: 0; }
        .bill-count-num { font-size: 20px; font-weight: 700; color: #f59e0b; }
        .bill-count-label { font-size: 11px; color: #9ca3af; }
        .bills-list { display: flex; flex-direction: column; gap: 8px; }
        .bill-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all .15s;
          background: white;
        }
        .bill-item:hover { border-color: #86efac; background: #f0fdf4; }
        .bill-item.selected { border-color: #16a34a; background: #f0fdf4; }
        .bill-left { display: flex; align-items: center; gap: 10px; }
        .bill-check {
          width: 22px; height: 22px;
          border: 2px solid #86efac;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          color: #16a34a;
          font-weight: 700;
          flex-shrink: 0;
          transition: all .15s;
          background: white;
        }
        .bill-item.selected .bill-check { background: #16a34a; color: white; border-color: #16a34a; }
        .bill-name { font-size: 13px; font-weight: 500; color: #111827; }
        .bill-due { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .bill-amount { font-size: 14px; font-weight: 700; color: #dc2626; white-space: nowrap; }
        .empty-bills {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px;
          background: #f0fdf4;
          border: 1.5px solid #86efac;
          border-radius: 10px;
          font-size: 13px;
          color: #15803d;
          font-weight: 500;
        }
        .empty-bills-icon { font-size: 18px; }
        .amount-wrap { position: relative; display: flex; align-items: center; }
        .amount-prefix {
          position: absolute;
          left: 14px;
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
          pointer-events: none;
        }
        .amount-input { padding-left: 36px !important; font-weight: 600; }
        .amount-terbilang {
          margin-top: 5px;
          font-size: 12px;
          color: #16a34a;
          font-weight: 500;
        }
        .cash-only-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1.5px solid #86efac;
          border-radius: 10px;
        }
        .cash-icon { font-size: 24px; flex-shrink: 0; }
        .cash-title { font-size: 14px; font-weight: 600; color: #15803d; }
        .cash-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .info-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #fffbeb;
          border: 1.5px solid #fde68a;
          border-radius: 10px;
          padding: 14px 16px;
          margin: 0 24px 0;
          font-size: 13px;
          color: #92400e;
          line-height: 1.5;
        }
        .info-icon { font-size: 16px; flex-shrink: 0; }
        .btn-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: calc(100% - 48px);
          margin: 20px 24px 24px;
          padding: 14px;
          background: linear-gradient(135deg, #16a34a, #22c55e);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all .15s;
          box-shadow: 0 4px 14px rgba(22,163,74,.3);
          box-sizing: border-box;
        }
        .btn-submit:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(22,163,74,.4); }
        .btn-submit:disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; box-shadow: none; transform: none; }
        .btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .summary-panel { position: sticky; top: 20px; }
        .summary-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          border: 1.5px solid #d1fae5;
        }
        .summary-title {
          font-size: 14px;
          font-weight: 700;
          color: #14532d;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1.5px solid #d1fae5;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 10px;
        }
        .summary-label { font-size: 12px; color: #9ca3af; flex-shrink: 0; }
        .summary-value { font-size: 13px; font-weight: 500; color: #374151; text-align: right; }
        .summary-divider { height: 1.5px; background: #d1fae5; margin: 10px 0; }
        .summary-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }
        .summary-total-label { font-size: 14px; font-weight: 600; color: #14532d; }
        .summary-total-value { font-size: 16px; font-weight: 700; color: #16a34a; }
        .summary-status { margin-top: 16px; }
        .status-ready {
          background: #f0fdf4;
          color: #15803d;
          border: 1.5px solid #86efac;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
        }
        .status-pending {
          background: #fafafa;
          color: #9ca3af;
          border: 1.5px solid #f3f4f6;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          text-align: center;
        }
        @media (max-width: 900px) {
          .content-grid { grid-template-columns: 1fr; }
          .summary-panel { position: static; }
          .fields-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .page-wrapper { padding: 16px; }
          .section { padding: 18px 16px; }
          .info-box { margin: 0 16px 0; }
          .btn-submit { width: calc(100% - 32px); margin: 16px 16px 20px; }
          .student-bill-count { display: none; }
        }
      `}</style>
    </AdminLayout>
  );
}