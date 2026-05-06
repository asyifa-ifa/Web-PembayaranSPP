import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

export default function PaymentTypes() {
  const [types, setTypes] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  // 👉 state untuk EDIT
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await fetch("/api/payment-types");
    const data = await res.json();
    setTypes(data);
  };

  // TAMBAH
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("/api/payment-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amount: Number(amount),
      }),
    });
    setName("");
    setAmount("");
    loadData();
  };

  // HAPUS
  const handleDelete = async () => {
    await fetch(`/api/payment-types/${deleteId}`, {
      method: "DELETE",
    });
    setDeleteId(null);
    loadData();
  };

  // ✏️ UPDATE / EDIT
  const handleUpdate = async (e) => {
    e.preventDefault();
    await fetch(`/api/payment-types/${editData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editData.name,
        amount: Number(editData.amount),
      }),
    });
    setShowEdit(false);
    setEditData(null);
    loadData();
  };

  const formatRupiah = (v) =>
    new Intl.NumberFormat("id-ID").format(v);

  return (
    <AdminLayout>
      <div className="page">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Jenis Pembayaran</h1>
            <span>Master Data / Jenis Pembayaran</span>
          </div>
          <div className="count-box">
            Total Data: {types.length}
          </div>
        </div>

        {/* Form Tambah */}
        <div className="card">
          <h3>Tambah Jenis Pembayaran</h3>
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label>Nama Pembayaran</label>
              <input
                type="text"
                placeholder="SPP Bulanan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Nominal</label>
              <input
                type="number"
                placeholder="500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <button className="btn-primary">Simpan</button>
          </form>
        </div>

        {/* Table */}
        <div className="card">
          <h3>Daftar Jenis Pembayaran</h3>

          {types.length === 0 ? (
            <p className="empty">Belum ada data</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Nominal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>Rp {formatRupiah(t.amount)}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => {
                          setEditData(t);
                          setShowEdit(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => setDeleteId(t.id)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Hapus */}
        {deleteId && (
          <div className="modal-backdrop">
            <div className="modal">
              <h4>Hapus Data</h4>
              <p>Data yang dihapus tidak dapat dikembalikan.</p>
              <div className="modal-actions">
                <button onClick={() => setDeleteId(null)}>
                  Batal
                </button>
                <button className="btn-danger" onClick={handleDelete}>
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✏️ Modal Edit */}
        {showEdit && (
          <div className="modal-backdrop">
            <div className="modal">
              <h4>Edit Jenis Pembayaran</h4>

              <form onSubmit={handleUpdate}>
                <label>Nama Pembayaran</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  required
                />

                <label>Nominal</label>
                <input
                  type="number"
                  value={editData.amount}
                  onChange={(e) =>
                    setEditData({ ...editData, amount: e.target.value })
                  }
                  required
                />

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowEdit(false)}
                  >
                    Batal
                  </button>
                  <button className="btn-primary">
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        .page {
          padding: 30px;
          background: #f5f6fa;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
        }

        h1 {
          margin: 0;
          font-size: 22px;
        }

        span {
          color: #888;
          font-size: 13px;
        }

        .count-box {
          background: #fff;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 15px;
          align-items: end;
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        label {
          font-size: 13px;
          margin-bottom: 5px;
          color: #555;
        }

        input {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #ddd;
          margin-bottom: 10px;
        }

        .btn-primary {
          background: #1cc88a;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: bold;
        }

        .btn-danger {
          background: #e74a3b;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          margin-left: 5px;
        }

        .btn-edit {
          background: #f6c23e;
          color: #000;
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        th, td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        .empty {
          text-align: center;
          color: #888;
          padding: 30px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal {
          background: white;
          padding: 20px;
          border-radius: 12px;
          width: 320px;
        }

        .modal-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
        }
      `}</style>
    </AdminLayout>
  );
}