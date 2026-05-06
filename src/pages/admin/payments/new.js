import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

export default function NewPayment() {
  const [students, setStudents] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);

  const [form, setForm] = useState({
    studentId: "",
    method: "",
    note: "",
  });

  // Menyimpan jenis pembayaran yang dipilih + nominal
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadStudents();
    loadPaymentTypes();
  }, []);

  const loadStudents = async () => {
    const res = await fetch("/api/students/list", {
      credentials: "include",
    });
    const data = await res.json();
    setStudents(data);
  };

  const loadPaymentTypes = async () => {
    const res = await fetch("/api/payment-types", {
      credentials: "include",
    });
    const data = await res.json();
    setPaymentTypes(data);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle checkbox jenis pembayaran
  const toggleItem = (type) => {
    setItems((prev) => {
      const exist = prev.find(
        (i) => i.paymentTypeId === type.id
      );

      if (exist) {
        return prev.filter(
          (i) => i.paymentTypeId !== type.id
        );
      }

      return [
        ...prev,
        {
          paymentTypeId: type.id,
          name: type.name,
          amount: "",
        },
      ];
    });
  };

  // Update nominal per jenis
  const updateAmount = (id, value) => {
    setItems((prev) =>
      prev.map((i) =>
        i.paymentTypeId === id
          ? { ...i, amount: value }
          : i
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      alert("Pilih minimal satu jenis pembayaran");
      return;
    }

    for (const item of items) {
      if (!item.amount || Number(item.amount) <= 0) {
        alert(`Nominal ${item.name} belum diisi`);
        return;
      }
    }

    await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        studentId: form.studentId,
        method: form.method,
        note: form.note,
        items,
      }),
    });

    alert("Pembayaran berhasil ditambahkan");
    window.location.href = "/admin/payments";
  };

  return (
    <AdminLayout>
      <div className="container-page">
        <h2 className="title">Pembayaran Santri</h2>

        <form onSubmit={handleSubmit} className="card">
          {/* Santri */}
          <div className="form-group">
            <label>Santri</label>
            <select
              required
              value={form.studentId}
              onChange={(e) =>
                handleChange("studentId", e.target.value)
              }
            >
              <option value="">-- Pilih Santri --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Jenis Pembayaran Multi */}
          <div className="form-group">
            <label>Jenis Pembayaran</label>

            {paymentTypes.map((p) => {
              const selected = items.find(
                (i) => i.paymentTypeId === p.id
              );

              return (
                <div key={p.id} className="payment-item">
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => toggleItem(p)}
                  />
                  <span>{p.name}</span>

                  {selected && (
                    <input
                      type="number"
                      placeholder="Nominal"
                      value={selected.amount}
                      onChange={(e) =>
                        updateAmount(p.id, e.target.value)
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Metode */}
          <div className="form-group">
            <label>Metode Pembayaran</label>
            <select
              required
              value={form.method}
              onChange={(e) =>
                handleChange("method", e.target.value)
              }
            >
              <option value="">-- Pilih Metode --</option>
              <option value="Tunai">Tunai</option>
              <option value="Transfer">Transfer</option>
            </select>
          </div>

          {/* Catatan */}
          <div className="form-group">
            <label>Catatan (Opsional)</label>
            <textarea
              placeholder="Keterangan tambahan"
              value={form.note}
              onChange={(e) =>
                handleChange("note", e.target.value)
              }
            />
          </div>

          <button type="submit" className="btn-green">
            Simpan Pembayaran
          </button>
        </form>
      </div>

      <style jsx>{`
        .container-page {
          padding: 30px;
          background: #f5f6fa;
          min-height: 100vh;
        }

        .title {
          margin-bottom: 20px;
          font-size: 22px;
        }

        .card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          max-width: 550px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 15px;
        }

        label {
          font-size: 13px;
          margin-bottom: 5px;
          color: #555;
        }

        input,
        select,
        textarea {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #ddd;
          font-size: 14px;
        }

        textarea {
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: #1cc88a;
        }

        .payment-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .payment-item input[type="number"] {
          width: 150px;
        }

        .btn-green {
          background: #1cc88a;
          color: white;
          padding: 12px;
          width: 100%;
          border-radius: 8px;
          border: none;
          font-weight: bold;
          cursor: pointer;
          margin-top: 10px;
        }

        .btn-green:hover {
          background: #17a673;
        }
      `}</style>
    </AdminLayout>
  );
}