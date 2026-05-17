import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

const cleanAmount = (amount) => {
  if (!amount) return "0"
  return String(amount).replace(/\./g, "").replace(/,/g, "").replace(/\D/g, "")
}

export default function PaymentPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentTypes, setPaymentTypes] = useState([]);

  const [showTambah, setShowTambah] = useState(false);
  const [tambahStudentId, setTambahStudentId] = useState("");
  const [tambahItems, setTambahItems] = useState([]);
  const [loadingTambah, setLoadingTambah] = useState(false);

  useEffect(() => {
    loadStudents();
    fetch("/api/payment-types").then(r => r.json()).then(setPaymentTypes);
  }, []);

  const loadStudents = () => {
    fetch("/api/students/payment-list")
      .then((res) => res.json())
      .then((data) => setStudents(data.students || []));
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

  // Hapus tagihan (bill)
  const hapusBill = async (billId) => {
    if (!confirm("Hapus tagihan ini?")) return;
    const res = await fetch(`/api/bills/${billId}/delete`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) {
      alert("✅ Tagihan berhasil dihapus!");
      openDetail(selectedStudent.id);
    } else {
      alert("Gagal: " + data.message);
    }
  };

  // Hapus payment (riwayat)
  const hapusPayment = async (paymentId) => {
    if (!confirm("Hapus riwayat pembayaran ini?")) return;
    const res = await fetch(`/api/payments/${paymentId}/delete`, {
      method: "DELETE",
    });
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
      loadStudents();
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
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: auto; }
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
        <div class="row"><span class="label">NISN</span><span class="value">${selectedStudent.nisn}</span></div>
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

  return (
    <AdminLayout>
      <div className="container">

        <div className="header-row">
          <h2>📄 Data Pembayaran Santri</h2>
          <button className="btn-tambah" onClick={() => setShowTambah(true)}>
            + Buat Tagihan
          </button>
        </div>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>NISN</th>
                <th>Kelas</th>
                <th>Angkatan</th>
                <th>Nama</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.nisn}</td>
                  <td>{s.class?.name}</td>
                  <td>{s.entryYear}</td>
                  <td>{s.name}</td>
                  <td>
                    <button className="btn-detail" onClick={() => openDetail(s.id)}>
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL TAMBAH TAGIHAN */}
        {showTambah && (
          <div className="modal">
            <div className="modal-content">
              <h3>📋 Buat Tagihan Santri</h3>
              <div className="field">
                <label>Pilih Santri</label>
                <select value={tambahStudentId} onChange={e => setTambahStudentId(e.target.value)}>
                  <option value="">-- Pilih Santri --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.class?.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Pilih Jenis Tagihan</label>
                {paymentTypes.map(pt => {
                  const selected = tambahItems.find(i => i.paymentTypeId === pt.id);
                  return (
                    <div key={pt.id} className="pt-item">
                      <input type="checkbox" checked={!!selected} onChange={() => toggleItem(pt)} />
                      <span className="pt-name">{pt.name}</span>
                      <span className="pt-default">Rp {formatRupiah(pt.amount)}</span>
                      {selected && (
                        <>
                          <input
                            type="number"
                            placeholder="Nominal"
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
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="modal-actions">
                <button className="btn-batal" onClick={() => { setShowTambah(false); setTambahItems([]); setTambahStudentId(""); }}>
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
            <div className="modal-content">
              <h3>👤 Detail Santri</h3>
              <p><b>NISN:</b> {selectedStudent.nisn}</p>
              <p><b>Nama:</b> {selectedStudent.name}</p>
              <p><b>Kelas:</b> {selectedStudent.class?.name}</p>
              <p><b>Angkatan:</b> {selectedStudent.entryYear}</p>

              <hr />
              <h4>📋 Tagihan</h4>
              {selectedStudent.bills.length === 0 ? (
                <p style={{ color: "#888" }}>Belum ada tagihan</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Jenis</th>
                      <th>Nominal</th>
                      <th>Jatuh Tempo</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.bills.map(b => (
                      <tr key={b.id}>
                        <td>{b.paymentType.name}</td>
                        <td>Rp {b.amount.toLocaleString("id-ID")}</td>
                        <td>{b.dueDate ? new Date(b.dueDate).toLocaleDateString("id-ID") : "-"}</td>
                        <td>
                          <span style={{ color: b.status === "PAID" ? "green" : "red", fontWeight: "bold" }}>
                            {b.status === "PAID" ? "✅ LUNAS" : "❌ BELUM BAYAR"}
                          </span>
                        </td>
                        <td>
                          {b.status === "UNPAID" ? (
                            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                              <button className="btn-cash" onClick={() => konfirmasiCash(b.id)}>
                                💵 CASH
                              </button>
                              <button className="btn-transfer" onClick={() => bayarTransfer(b.id)}>
                                🏦 Transfer
                              </button>
                              <button className="btn-hapus" onClick={() => hapusBill(b.id)}>
                                🗑️ Hapus
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "green", fontSize: 13 }}>✅ Lunas</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <hr />
              <h4>💰 Riwayat Pembayaran</h4>
              {selectedStudent.payments.length === 0 ? (
                <p style={{ color: "#888" }}>Belum ada riwayat pembayaran</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Jenis</th>
                      <th>Nominal</th>
                      <th>Metode</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.payments.map((p, i) => (
                      <tr key={p.id}>
                        <td>{i + 1}</td>
                        <td>{p.paymentType.name}</td>
                        <td>Rp {p.amount.toLocaleString("id-ID")}</td>
                        <td>{p.method === "CASH" ? "💵 Tunai" : "🏦 Transfer"}</td>
                        <td>
                          <span style={{
                            color: p.status === "SUCCESS" ? "green" : p.status === "FAILED" ? "red" : "orange",
                            fontWeight: "bold"
                          }}>
                            {p.status === "SUCCESS" ? "✅ SUKSES" : p.status === "FAILED" ? "❌ GAGAL" : "⏳ PENDING"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                            {p.status === "SUCCESS" && (
                              <button className="btn-cetak" onClick={() => cetakKwitansi(p)}>
                                🖨️ Kwitansi
                              </button>
                            )}
                            {(p.status === "PENDING" || p.status === "FAILED") && (
                              <button className="btn-hapus" onClick={() => hapusPayment(p.id)}>
                                🗑️ Hapus
                              </button>
                            )}
                            {p.status === "PENDING" && (
                              <span style={{ color: "orange", fontSize: 12 }}>⏳ Menunggu</span>
                            )}
                            {p.status === "FAILED" && (
                              <span style={{ color: "red", fontSize: 12 }}>❌ Gagal</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ marginTop: "15px", textAlign: "right" }}>
                <button className="btn-tutup" onClick={() => setSelectedStudent(null)}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .container { padding: 20px; background: #f5f6fa; min-height: 100vh; }
        .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        h2 { margin: 0; }
        .card { background: white; border-radius: 10px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 10px; }
        th { background: #f5f5f5; }
        .field { margin-bottom: 15px; }
        .field label { display: block; font-size: 13px; color: #555; margin-bottom: 5px; font-weight: bold; }
        .field select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; font-size: 14px; }
        .pt-item { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 6px; }
        .pt-name { flex: 1; font-size: 14px; }
        .pt-default { color: #888; font-size: 13px; min-width: 90px; }
        .pt-input { width: 130px; padding: 6px; border-radius: 6px; border: 1px solid #ddd; font-size: 13px; }
        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 999; }
        .modal-content { background: white; padding: 25px; width: 720px; max-height: 88vh; overflow-y: auto; border-radius: 12px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .btn-tambah { background: #2e6b3e; color: white; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; font-size: 14px; }
        .btn-detail { background: #f0ad4e; color: white; padding: 5px 12px; border-radius: 6px; border: none; cursor: pointer; }
        .btn-cash { background: #2e6b3e; color: white; padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; }
        .btn-transfer { background: #1a6db5; color: white; padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; }
        .btn-cetak { background: #6c757d; color: white; padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; }
        .btn-hapus { background: #dc3545; color: white; padding: 5px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; }
        .btn-hapus:hover { background: #c82333; }
        .btn-simpan { background: #2e6b3e; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; }
        .btn-simpan:disabled { background: #aaa; }
        .btn-batal { background: white; border: 1px solid #ccc; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .btn-tutup { background: #888; color: white; padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; }
      `}</style>
    </AdminLayout>
  );
}