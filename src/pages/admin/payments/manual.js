import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";

// Fungsi untuk membersihkan nominal (hapus titik, hanya angka)
const cleanAmount = (amount) => {
  if (!amount) return "0"
  return String(amount).replace(/\./g, "").replace(/,/g, "").replace(/\D/g, "")
}

export default function ManualPayment() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({
    paymentTypeId: "",
    amount: "",
    method: "CASH",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/students/list").then(r => r.json()).then(setStudents);
    fetch("/api/payment-types").then(r => r.json()).then(setPaymentTypes);
  }, []);

  // Load tagihan santri saat santri dipilih
  useEffect(() => {
    if (!selectedStudent) { setBills([]); return; }
    fetch(`/api/students/${selectedStudent}/detail`)
      .then(r => r.json())
      .then(data => {
        const unpaid = data.bills?.filter(b => b.status === "UNPAID") || [];
        setBills(unpaid);
      });
  }, [selectedStudent]);

  // Auto-isi nominal dari tagihan
  const handleBillChange = (billId) => {
    const bill = bills.find(b => b.id === Number(billId));
    if (bill) {
      setForm(prev => ({
        ...prev,
        paymentTypeId: String(bill.paymentTypeId),
        amount: String(bill.amount),
      }));
    }
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
          amount: cleanAmount(form.amount), // ← Bersihkan nominal
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

  const formatRupiah = (v) => new Intl.NumberFormat("id-ID").format(v);

  return (
    <AdminLayout>
      <style jsx>{`
        .page { padding: 30px; background: #f5f6fa; min-height: 100vh; }
        .card { background: white; border-radius: 12px; padding: 25px; max-width: 600px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
        h2 { color: #2e6b3e; margin-bottom: 20px; }
        .field { margin-bottom: 16px; }
        label { display: block; font-size: 13px; color: #555; margin-bottom: 5px; font-weight: bold; }
        select, input, textarea {
          width: 100%; padding: 10px; border-radius: 8px;
          border: 1px solid #ddd; font-size: 14px;
        }
        textarea { resize: vertical; height: 80px; }
        .bill-item {
          display: flex; justify-content: space-between;
          padding: 10px; border: 1px solid #eee;
          border-radius: 8px; margin-bottom: 6px;
          cursor: pointer; transition: background 0.2s;
        }
        .bill-item:hover { background: #f0f9f4; }
        .bill-item.selected { background: #e6f4ea; border-color: #2e6b3e; }
        .btn-submit {
          background: #2e6b3e; color: white; padding: 12px;
          width: 100%; border-radius: 8px; border: none;
          font-weight: bold; font-size: 15px; cursor: pointer;
          margin-top: 10px;
        }
        .btn-submit:disabled { background: #aaa; }
        .btn-back {
          background: none; border: 1px solid #2e6b3e;
          color: #2e6b3e; padding: 8px 16px;
          border-radius: 8px; cursor: pointer; margin-bottom: 20px;
        }
        .info-box {
          background: #f0f9f4; border-left: 4px solid #2e6b3e;
          padding: 12px; border-radius: 6px; margin-bottom: 16px;
          font-size: 13px; color: #333;
        }
      `}</style>

      <div className="page">
        <button className="btn-back" onClick={() => router.back()}>← Kembali</button>

        <div className="card">
          <h2>💵 Input Pembayaran Manual</h2>

          {/* Pilih Santri */}
          <div className="field">
            <label>Pilih Santri</label>
            <select value={selectedStudent} onChange={e => {
              setSelectedStudent(e.target.value);
              setForm(prev => ({ ...prev, paymentTypeId: "", amount: "" }));
            }}>
              <option value="">-- Pilih Santri --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.class?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tagihan yang belum dibayar */}
          {selectedStudent && (
            <div className="field">
              <label>Tagihan Belum Dibayar</label>
              {bills.length === 0 ? (
                <p style={{ color: "#888", fontSize: 13 }}>
                  ✅ Tidak ada tagihan yang belum dibayar
                </p>
              ) : (
                bills.map(b => (
                  <div
                    key={b.id}
                    className={`bill-item ${form.paymentTypeId === String(b.paymentTypeId) ? "selected" : ""}`}
                    onClick={() => handleBillChange(b.id)}
                  >
                    <span>{b.paymentType.name}</span>
                    <span style={{ fontWeight: "bold", color: "#e74c3c" }}>
                      Rp {formatRupiah(b.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Jenis Pembayaran */}
          <div className="field">
            <label>Jenis Pembayaran</label>
            <select
              value={form.paymentTypeId}
              onChange={e => setForm(prev => ({ ...prev, paymentTypeId: e.target.value }))}
            >
              <option value="">-- Pilih Jenis --</option>
              {paymentTypes.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Nominal */}
          <div className="field">
            <label>Nominal (Rp)</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="150000"
            />
          </div>

          {/* Metode */}
          <div className="field">
            <label>Metode Pembayaran</label>
            <select
              value={form.method}
              onChange={e => setForm(prev => ({ ...prev, method: e.target.value }))}
            >
              <option value="CASH">💵 Tunai (Cash)</option>
              <option value="TRANSFER">🏦 Transfer</option>
            </select>
          </div>

          {/* Catatan */}
          <div className="field">
            <label>Catatan (Opsional)</label>
            <textarea
              value={form.note}
              onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Keterangan tambahan..."
            />
          </div>

          <div className="info-box">
            📧 Email konfirmasi akan otomatis terkirim ke santri setelah pembayaran dicatat.
          </div>

          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "✅ Konfirmasi Pembayaran"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}