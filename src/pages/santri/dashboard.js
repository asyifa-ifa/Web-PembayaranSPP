import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tagihan");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await fetch("/api/santri/dashboard");
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    setStudent(data.student);
    setBills(data.bills);
    setPayments(data.payments);
    setEditForm({
      phone: data.student?.phone || "",
      email: data.student?.email || "",
      address: data.student?.address || "",
    });
  };

  const handleBayar = async (bill) => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/duitku-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId: bill.id }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      } else {
        alert("Gagal membuat pembayaran: " + data.message);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch("/api/santri/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      await fetchData();
      setShowEditModal(false);
      alert("Profil berhasil diperbarui!");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const rp = (v) => "Rp " + new Intl.NumberFormat("id-ID").format(v);

  if (!student) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f7f1", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
        <p style={{ color: "#7a9a85", fontSize: 14 }}>Memuat data...</p>
      </div>
    </div>
  );

  const unpaidBills = bills.filter(b => b.status === "UNPAID");
  const paidBills = bills.filter(b => b.status === "PAID");
  const totalTagihan = unpaidBills.reduce((s, b) => s + b.amount, 0);
  const totalTerbayar = paidBills.reduce((s, b) => s + b.amount, 0);
  const initials = student.name?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #eef5f0; }

        .dashboard {
          min-height: 100vh;
          background: linear-gradient(160deg, #e8f5ec 0%, #f0f7f1 40%, #e8f0ee 100%);
          padding-bottom: 40px;
        }

        /* TOPBAR */
        .topbar {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(58,143,80,0.1);
          padding: 0 20px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .topbar-brand {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #1a3d28;
          letter-spacing: -0.3px;
        }

        .topbar-brand span {
          color: #3a8f50;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-logout {
          background: #fff0f0;
          color: #d32f2f;
          border: 1.5px solid #f5bebe;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: 0.15s;
        }
        .btn-logout:hover { background: #ffe0e0; }

        /* HERO PROFILE */
        .hero {
          background: linear-gradient(135deg, #1a3d28 0%, #2e6b3e 50%, #3a8f50 100%);
          padding: 32px 20px 80px;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }

        .hero::after {
          content: '';
          position: absolute;
          bottom: -40px; left: 30px;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }

        .hero-content {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          z-index: 1;
        }

        .avatar {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 3px solid rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: -1px;
        }

        .hero-info h2 {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 4px;
        }

        .hero-info p {
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          margin: 0;
        }

        .hero-badges {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .hero-badge {
          background: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.9);
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.2);
        }

        /* MAIN CONTENT */
        .content {
          max-width: 680px;
          margin: -48px auto 0;
          padding: 0 16px;
          position: relative;
          z-index: 2;
        }

        /* STAT CARDS */
        .stat-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border: 1px solid rgba(58,143,80,0.08);
        }

        .stat-card .stat-label {
          font-size: 11px;
          font-weight: 600;
          color: #9ab5a3;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .stat-card .stat-val {
          font-size: 18px;
          font-weight: 800;
          color: #1a3d28;
          line-height: 1;
        }

        .stat-card .stat-sub {
          font-size: 11px;
          color: #b0c4b8;
          margin-top: 4px;
        }

        .stat-card.danger .stat-val { color: #d32f2f; }
        .stat-card.success .stat-val { color: #2e6b3e; }

        /* SECTION CARD */
        .section-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border: 1px solid rgba(58,143,80,0.08);
          margin-bottom: 16px;
          overflow: hidden;
        }

        .section-header {
          padding: 18px 20px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a3d28;
        }

        .section-badge {
          background: #edf7ef;
          color: #2e6b3e;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid #c3dfc9;
        }

        /* TABS */
        .tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #f5f8f5;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .tab {
          flex: 1;
          padding: 9px;
          border-radius: 9px;
          border: none;
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          color: #7a9a85;
          cursor: pointer;
          transition: 0.2s;
          font-family: inherit;
          text-align: center;
        }

        .tab.active {
          background: #fff;
          color: #1a3d28;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        /* BILL ITEM */
        .bill-item {
          padding: 16px 20px;
          border-bottom: 1px solid #f5f8f5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .bill-item:last-child { border-bottom: none; }

        .bill-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #fff8e6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .bill-icon.paid { background: #edf7ef; }

        .bill-info { flex: 1; }
        .bill-name { font-size: 13.5px; font-weight: 700; color: #1a3d28; margin-bottom: 2px; }
        .bill-amount { font-size: 13px; font-weight: 600; color: #d32f2f; }
        .bill-amount.paid { color: #2e6b3e; }
        .bill-due { font-size: 11px; color: #b0c4b8; margin-top: 2px; }

        .btn-bayar {
          background: linear-gradient(135deg, #2e6b3e, #3a8f50);
          color: #fff;
          border: none;
          padding: 9px 16px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: 0.2s;
          white-space: nowrap;
          box-shadow: 0 3px 10px rgba(58,143,80,0.3);
        }
        .btn-bayar:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 15px rgba(58,143,80,0.4); }
        .btn-bayar:disabled { opacity: 0.6; cursor: not-allowed; }

        /* PAYMENT HISTORY */
        .pay-item {
          padding: 14px 20px;
          border-bottom: 1px solid #f5f8f5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .pay-item:last-child { border-bottom: none; }

        .pay-status {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }
        .pay-status.success { background: #edf7ef; color: #2e6b3e; }
        .pay-status.failed { background: #fff0f0; color: #d32f2f; }
        .pay-status.pending { background: #fff8e6; color: #b07800; }

        /* BIODATA */
        .bio-row {
          padding: 12px 20px;
          border-bottom: 1px solid #f5f8f5;
          display: flex;
          gap: 12px;
        }
        .bio-row:last-child { border-bottom: none; }
        .bio-label { font-size: 11px; font-weight: 600; color: #9ab5a3; width: 110px; flex-shrink: 0; padding-top: 1px; text-transform: uppercase; letter-spacing: 0.3px; }
        .bio-val { font-size: 13.5px; color: #1a3d28; flex: 1; }

        .btn-edit-profile {
          background: #edf7ef;
          color: #2e6b3e;
          border: 1.5px solid #c3dfc9;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: 0.15s;
        }
        .btn-edit-profile:hover { background: #d6f0dc; }

        /* EMPTY STATE */
        .empty {
          padding: 40px 20px;
          text-align: center;
          color: #9ab5a3;
          font-size: 13px;
        }
        .empty .empty-icon { font-size: 36px; margin-bottom: 10px; }

        /* MODAL */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0;
        }

        .modal {
          background: #fff;
          border-radius: 24px 24px 0 0;
          padding: 24px 20px 40px;
          width: 100%;
          max-width: 680px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s cubic-bezier(.4,0,.2,1);
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-handle {
          width: 40px; height: 4px;
          background: #e0e8e2; border-radius: 2px;
          margin: 0 auto 20px;
        }

        .modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700; color: #1a3d28;
          margin-bottom: 20px;
        }

        .modal-field { margin-bottom: 16px; }
        .modal-field label { font-size: 12px; font-weight: 600; color: #5a7a66; display: block; margin-bottom: 6px; }
        .modal-field input, .modal-field textarea {
          width: 100%; border: 1.5px solid #dde5e0; border-radius: 10px;
          padding: 11px 14px; font-size: 14px; color: #1a3d28;
          background: #fafcfb; outline: none; font-family: inherit;
          transition: border-color 0.2s;
        }
        .modal-field input:focus, .modal-field textarea:focus {
          border-color: #3a8f50; box-shadow: 0 0 0 3px rgba(58,143,80,0.1);
        }
        .modal-field textarea { resize: vertical; min-height: 80px; }
        .modal-field input::placeholder, .modal-field textarea::placeholder { color: #b0c4b8; }

        .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
        .btn-modal-save {
          flex: 1; background: linear-gradient(135deg, #2e6b3e, #3a8f50);
          color: #fff; border: none; padding: 13px; border-radius: 12px;
          font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: 0.2s; box-shadow: 0 4px 14px rgba(58,143,80,0.3);
        }
        .btn-modal-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-modal-cancel {
          background: #f5f8f5; color: #5a7a66; border: none;
          padding: 13px 20px; border-radius: 12px; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: inherit;
        }
      `}</style>

      <div className="dashboard">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-brand">SIBATAMU<span>-SPP</span></div>
          <div className="topbar-actions">
            <button className="btn-logout" onClick={() => router.push("/api/auth/signout")}>
              Keluar
            </button>
          </div>
        </div>

        {/* HERO */}
        <div className="hero">
          <div className="hero-content">
            <div className="avatar">{initials}</div>
            <div className="hero-info">
              <h2>{student.name}</h2>
              <p>NISN: {student.nisn}</p>
              <div className="hero-badges">
                <span className="hero-badge">📚 {student.class?.name}</span>
                <span className="hero-badge">👤 {student.guardian}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content">
          {/* STAT CARDS */}
          <div className="stat-row">
            <div className="stat-card danger">
              <div className="stat-label">Tagihan</div>
              <div className="stat-val">{unpaidBills.length} item</div>
              <div className="stat-sub">{rp(totalTagihan)}</div>
            </div>
            <div className="stat-card success">
              <div className="stat-label">Terbayar</div>
              <div className="stat-val">{paidBills.length} item</div>
              <div className="stat-sub">{rp(totalTerbayar)}</div>
            </div>
          </div>

          {/* TABS */}
          <div className="tabs">
            {[
              { key: "tagihan", label: "💳 Tagihan" },
              { key: "riwayat", label: "📜 Riwayat" },
              { key: "biodata", label: "👤 Biodata" },
            ].map(t => (
              <button key={t.key} className={`tab ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB: TAGIHAN */}
          {activeTab === "tagihan" && (
            <>
              {/* BELUM BAYAR */}
              <div className="section-card">
                <div className="section-header">
                  <span className="section-title">Belum Dibayar</span>
                  {unpaidBills.length > 0 && <span className="section-badge">{unpaidBills.length}</span>}
                </div>
                {unpaidBills.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">✅</div>
                    Tidak ada tunggakan
                  </div>
                ) : unpaidBills.map(bill => (
                  <div key={bill.id} className="bill-item">
                    <div className="bill-icon">🧾</div>
                    <div className="bill-info">
                      <div className="bill-name">{bill.paymentType.name}</div>
                      <div className="bill-amount">{rp(bill.amount)}</div>
                      {bill.dueDate && <div className="bill-due">Jatuh tempo: {new Date(bill.dueDate).toLocaleDateString("id-ID")}</div>}
                    </div>
                    <button className="btn-bayar" onClick={() => handleBayar(bill)} disabled={loading}>
                      {loading ? "..." : "Bayar"}
                    </button>
                  </div>
                ))}
              </div>

              {/* SUDAH BAYAR */}
              <div className="section-card">
                <div className="section-header">
                  <span className="section-title">Sudah Dibayar</span>
                  {paidBills.length > 0 && <span className="section-badge" style={{ background: "#edf7ef", color: "#2e6b3e" }}>{paidBills.length}</span>}
                </div>
                {paidBills.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">💳</div>
                    Belum ada pembayaran
                  </div>
                ) : paidBills.map(bill => (
                  <div key={bill.id} className="bill-item">
                    <div className="bill-icon paid">✅</div>
                    <div className="bill-info">
                      <div className="bill-name">{bill.paymentType.name}</div>
                      <div className="bill-amount paid">{rp(bill.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TAB: RIWAYAT */}
          {activeTab === "riwayat" && (
            <div className="section-card">
              <div className="section-header" style={{ marginBottom: 4 }}>
                <span className="section-title">Riwayat Pembayaran</span>
              </div>
              {payments.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📜</div>
                  Belum ada riwayat pembayaran
                </div>
              ) : payments.map(pay => (
                <div key={pay.id} className="pay-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1a3d28", marginBottom: 2 }}>{pay.paymentType.name}</div>
                    <div style={{ fontSize: 12, color: "#9ab5a3" }}>{pay.method} · {new Date(pay.createdAt).toLocaleDateString("id-ID")}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a3d28", marginBottom: 4 }}>{rp(pay.amount)}</div>
                    <span className={`pay-status ${pay.status === "SUCCESS" ? "success" : pay.status === "FAILED" ? "failed" : "pending"}`}>
                      {pay.status === "SUCCESS" ? "Sukses" : pay.status === "FAILED" ? "Gagal" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: BIODATA */}
          {activeTab === "biodata" && (
            <div className="section-card">
              <div className="section-header" style={{ paddingBottom: 16, borderBottom: "1px solid #f5f8f5" }}>
                <span className="section-title">Biodata Santri</span>
                <button className="btn-edit-profile" onClick={() => setShowEditModal(true)}>✏️ Edit</button>
              </div>
              {[
                { label: "Nama", val: student.name },
                { label: "NISN", val: student.nisn },
                { label: "Kelas", val: student.class?.name },
                { label: "Jenis Kelamin", val: student.gender === "L" ? "Laki-laki" : "Perempuan" },
                { label: "Tempat Lahir", val: student.birthplace },
                { label: "Tanggal Lahir", val: student.birthdate ? new Date(student.birthdate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-" },
                { label: "Alamat", val: student.address },
                { label: "No HP", val: student.phone },
                { label: "Email", val: student.email },
                { label: "Nama Wali", val: student.guardian },
                { label: "Tahun Ajaran", val: student.entryYear || "-" },
              ].map((item, i) => (
                <div key={i} className="bio-row">
                  <span className="bio-label">{item.label}</span>
                  <span className="bio-val">{item.val || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDIT PROFIL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false) }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Edit Profil</div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-field">
                <label>No HP</label>
                <input
                  placeholder="08xxxxxxxxxx"
                  value={editForm.phone}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
                />
              </div>
              <div className="modal-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="email@gmail.com"
                  value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="modal-field">
                <label>Alamat</label>
                <textarea
                  placeholder="Alamat lengkap"
                  value={editForm.address}
                  onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="submit" className="btn-modal-save" disabled={editLoading}>
                  {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}