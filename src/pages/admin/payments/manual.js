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
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: pilih santri, 2: isi form

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

    setLoading(true);
    try {
      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          paymentTypeId: form.paymentTypeId,
          amount: cleanAmount(form.amount),
          method: form.method,
          note: form.note,
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

  const methodOptions = [
    { value: "CASH", label: "Tunai (Cash)", icon: "💵" },
    { value: "TRANSFER", label: "Transfer Bank", icon: "🏦" },
  ];

  return (
    <AdminLayout>
      <div className="page-wrapper">
        {/* Header */}
        <div className="page-header">
          <button className="btn-back" onClick={() => router.back()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali
          </button>
          <div>
            <h1 className="page-title">Input Pembayaran Manual</h1>
            <p className="page-subtitle">Catat pembayaran santri secara langsung</p>
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

              {/* Student Info Card */}
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

              {/* Metode */}
              <div className="field">
                <label className="field-label">Metode Pembayaran</label>
                <div className="method-group">
                  {methodOptions.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      className={`method-btn ${form.method === m.value ? "selected" : ""}`}
                      onClick={() => setForm((prev) => ({ ...prev, method: m.value }))}
                    >
                      <span className="method-icon">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
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
              disabled={loading || !selectedStudent || !form.paymentTypeId || !form.amount}
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
              <div className="summary-divider" />
              <div className="summary-row">
                <span className="summary-label">Jenis</span>
                <span className="summary-value">
                  {paymentTypes.find((p) => String(p.id) === form.paymentTypeId)?.name || "—"}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Metode</span>
                <span className="summary-value">
                  {methodOptions.find((m) => m.value === form.method)?.icon}{" "}
                  {methodOptions.find((m) => m.value === form.method)?.label}
                </span>
              </div>
              <div className="summary-divider" />
              <div className="summary-total-row">
                <span className="summary-total-label">Total</span>
                <span className="summary-total-value">
                  {form.amount ? `Rp ${formatRupiah(form.amount)}` : "—"}
                </span>
              </div>

              <div className="summary-status">
                {selectedStudent && form.paymentTypeId && form.amount ? (
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
        /* ===== BASE ===== */
        .page-wrapper {
          padding: 24px;
          max-width: 1100px;
          margin: 0 auto;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
        }

        /* ===== HEADER ===== */
        .page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
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
          font-size: clamp(18px, 3vw, 24px);
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.4px;
        }
        .page-subtitle { margin: 2px 0 0; font-size: 13px; color: #94a3b8; }

        /* ===== GRID ===== */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
          align-items: start;
        }

        /* ===== FORM CARD ===== */
        .form-card {
          background: white;
          border-radius: 18px;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          border: 1.5px solid #f1f5f9;
          overflow: hidden;
        }

        /* ===== SECTION ===== */
        .section {
          padding: 24px;
          border-bottom: 1.5px solid #f8fafc;
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
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          flex-shrink: 0;
        }
        .section-title { font-size: 15px; font-weight: 600; color: #1e293b; }
        .section-sub { font-size: 12px; color: #94a3b8; margin-top: 1px; }

        /* ===== FIELDS ===== */
        .field { margin-bottom: 16px; }
        .field:last-child { margin-bottom: 0; }
        .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          margin-bottom: 8px;
        }
        .optional-tag {
          background: #f1f5f9;
          color: #94a3b8;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 20px;
          font-weight: 400;
        }
        .field-select, .field-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #1e293b;
          background: white;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          box-sizing: border-box;
          appearance: none;
        }
        .field-select:focus, .field-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }
        .field-textarea {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #1e293b;
          background: white;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          box-sizing: border-box;
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        .field-textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .select-wrap { position: relative; }
        .select-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .field-select.padded { padding-left: 38px; }

        /* ===== STUDENT CARD ===== */
        .student-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #f5f3ff, #ede9fe);
          border: 1.5px solid #ddd6fe;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .student-avatar {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 16px; font-weight: 700;
          flex-shrink: 0;
        }
        .student-details { flex: 1; }
        .student-name-large { font-size: 14px; font-weight: 600; color: #1e293b; }
        .student-meta { display: flex; gap: 6px; margin-top: 4px; }
        .meta-badge {
          background: white;
          color: #6366f1;
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 20px;
          border: 1px solid #ddd6fe;
        }
        .student-bill-count { text-align: center; flex-shrink: 0; }
        .bill-count-num { font-size: 20px; font-weight: 700; color: #f59e0b; }
        .bill-count-label { font-size: 11px; color: #94a3b8; }

        /* ===== BILLS LIST ===== */
        .bills-list { display: flex; flex-direction: column; gap: 8px; }
        .bill-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          transition: all .15s;
          background: white;
        }
        .bill-item:hover { border-color: #c4b5fd; background: #faf5ff; }
        .bill-item.selected { border-color: #6366f1; background: #f5f3ff; }
        .bill-left { display: flex; align-items: center; gap: 10px; }
        .bill-check {
          width: 22px; height: 22px;
          border: 2px solid #ddd6fe;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          color: #6366f1;
          font-weight: 700;
          flex-shrink: 0;
          transition: all .15s;
          background: white;
        }
        .bill-item.selected .bill-check { background: #6366f1; color: white; border-color: #6366f1; }
        .bill-name { font-size: 13px; font-weight: 500; color: #1e293b; }
        .bill-due { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .bill-amount { font-size: 14px; font-weight: 700; color: #dc2626; white-space: nowrap; }
        .empty-bills {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px;
          background: #f0fdf4;
          border: 1.5px solid #bbf7d0;
          border-radius: 10px;
          font-size: 13px;
          color: #15803d;
          font-weight: 500;
        }
        .empty-bills-icon { font-size: 18px; }

        /* ===== AMOUNT ===== */
        .amount-wrap { position: relative; display: flex; align-items: center; }
        .amount-prefix {
          position: absolute;
          left: 14px;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
          pointer-events: none;
        }
        .amount-input { padding-left: 36px !important; font-weight: 600; }
        .amount-terbilang {
          margin-top: 5px;
          font-size: 12px;
          color: #6366f1;
          font-weight: 500;
        }

        /* ===== METHOD ===== */
        .method-group { display: flex; gap: 10px; }
        .method-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all .15s;
        }
        .method-btn:hover { border-color: #c4b5fd; color: #6366f1; }
        .method-btn.selected { border-color: #6366f1; background: #f5f3ff; color: #6366f1; }
        .method-icon { font-size: 18px; }

        /* ===== INFO BOX ===== */
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

        /* ===== SUBMIT ===== */
        .btn-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: calc(100% - 48px);
          margin: 20px 24px 24px;
          padding: 14px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all .15s;
          box-shadow: 0 4px 14px rgba(99,102,241,.3);
          box-sizing: border-box;
        }
        .btn-submit:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,.4); }
        .btn-submit:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }
        .btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ===== SUMMARY PANEL ===== */
        .summary-panel { position: sticky; top: 20px; }
        .summary-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          border: 1.5px solid #f1f5f9;
        }
        .summary-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1.5px solid #f1f5f9;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 10px;
        }
        .summary-label { font-size: 12px; color: #94a3b8; flex-shrink: 0; }
        .summary-value { font-size: 13px; font-weight: 500; color: #334155; text-align: right; }
        .summary-divider { height: 1.5px; background: #f1f5f9; margin: 10px 0; }
        .summary-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }
        .summary-total-label { font-size: 14px; font-weight: 600; color: #1e293b; }
        .summary-total-value { font-size: 16px; font-weight: 700; color: #6366f1; }
        .summary-status { margin-top: 16px; }
        .status-ready {
          background: #f0fdf4;
          color: #15803d;
          border: 1.5px solid #bbf7d0;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
        }
        .status-pending {
          background: #fafafa;
          color: #94a3b8;
          border: 1.5px solid #f1f5f9;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          text-align: center;
        }

        /* ===== RESPONSIVE ===== */
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
          .method-group { flex-direction: column; }
          .student-bill-count { display: none; }
        }
      `}</style>
    </AdminLayout>
  );
}