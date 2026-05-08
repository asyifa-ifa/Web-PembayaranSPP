// pages/santri/dashboard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const [student, setStudent]         = useState(null);
  const [bills, setBills]             = useState([]);
  const [payments, setPayments]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [activeTab, setActiveTab]     = useState("beranda");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal]   = useState(null); // bill object
  const [editForm, setEditForm]       = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [toast, setToast]             = useState(null);
  const router = useRouter();

  useEffect(() => { fetchData(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    const res = await fetch("/api/santri/dashboard");
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    setStudent(data.student);
    setBills(data.bills || []);
    setPayments(data.payments || []);
    setEditForm({
      phone:   data.student?.phone   || "",
      email:   data.student?.email   || "",
      address: data.student?.address || "",
    });
  };

  const handleBayar = async (bill) => {
    setLoading(true);
    setShowPayModal(null);
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
        showToast("Gagal membuat pembayaran: " + data.message, "error");
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
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
      showToast("Profil berhasil diperbarui!");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setEditLoading(false);
    }
  };

  const rp = (v) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

  if (!student) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f0f7f1", fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:44, marginBottom:14 }}>🌿</div>
        <p style={{ color:"#7a9a85", fontSize:14, fontWeight:600 }}>Memuat data...</p>
      </div>
    </div>
  );

  const unpaidBills   = bills.filter(b => b.status === "UNPAID");
  const paidBills     = bills.filter(b => b.status === "PAID");
  const totalTagihan  = unpaidBills.reduce((s, b) => s + (b.amount || 0), 0);
  const totalTerbayar = paidBills.reduce((s, b) => s + (b.amount || 0), 0);
  const initials      = student.name?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const recentPayments = payments.slice(0, 3);

  const tabs = [
    { key: "beranda", icon: "🏠", label: "Beranda" },
    { key: "tagihan", icon: "💳", label: "Tagihan" },
    { key: "riwayat", icon: "📜", label: "Riwayat" },
    { key: "biodata", icon: "👤", label: "Profil" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #eef5f0; -webkit-font-smoothing: antialiased; }

        /* ── TOAST ── */
        .toast {
          position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
          z-index: 9999; padding: 12px 20px; border-radius: 12px;
          font-size: 13px; font-weight: 600; white-space: nowrap;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          animation: toastIn .3s ease;
        }
        .toast.success { background: #1a3d28; color: #fff; }
        .toast.error   { background: #d32f2f; color: #fff; }
        @keyframes toastIn { from { opacity:0; top:0 } to { opacity:1; top:16px } }

        /* ── LAYOUT ── */
        .app { min-height: 100vh; background: #eef5f0; padding-bottom: 80px; }

        /* ── TOPBAR ── */
        .topbar {
          background: rgba(255,255,255,0.92); backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(58,143,80,0.1);
          height: 56px; padding: 0 20px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
        }
        .topbar-brand { display: flex; align-items: center; gap: 8px; }
        .brand-dot {
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg, #1a3d28, #3a8f50);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
        }
        .brand-name {
          font-family: 'Lora', serif;
          font-size: 15px; font-weight: 700; color: #1a3d28;
        }
        .brand-name span { color: #3a8f50; }
        .btn-logout {
          background: transparent; color: #9ab5a3; border: 1px solid #dde8e0;
          padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: .15s; display: flex; align-items: center; gap: 4px;
        }
        .btn-logout:hover { background: #fff0f0; color: #d32f2f; border-color: #f5bebe; }

        /* ── HERO ── */
        .hero {
          background: linear-gradient(135deg, #1a3d28 0%, #2e6b3e 60%, #3a8f50 100%);
          padding: 28px 20px 72px; position: relative; overflow: hidden;
        }
        .hero-deco1 {
          position: absolute; top: -50px; right: -50px;
          width: 180px; height: 180px; border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }
        .hero-deco2 {
          position: absolute; bottom: -30px; left: 20px;
          width: 100px; height: 100px; border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }
        .hero-deco3 {
          position: absolute; top: 20px; left: 40%;
          width: 60px; height: 60px; border-radius: 50%;
          background: rgba(255,255,255,0.03);
        }
        .hero-inner {
          max-width: 640px; margin: 0 auto;
          display: flex; align-items: center; gap: 16px; position: relative; z-index: 1;
        }
        .avatar {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(255,255,255,0.18); border: 2.5px solid rgba(255,255,255,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 800; color: #fff; flex-shrink: 0;
          letter-spacing: -1px;
        }
        .hero-text h2 {
          font-family: 'Lora', serif;
          font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 3px;
        }
        .hero-text p { font-size: 12px; color: rgba(255,255,255,0.65); }
        .hero-chips { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
        .hero-chip {
          background: rgba(255,255,255,0.13); color: rgba(255,255,255,0.88);
          border: 1px solid rgba(255,255,255,0.2); padding: 3px 10px;
          border-radius: 20px; font-size: 11px; font-weight: 600;
        }

        /* ── CONTENT ── */
        .content {
          max-width: 640px; margin: -52px auto 0;
          padding: 0 16px; position: relative; z-index: 2;
        }

        /* ── STAT CARDS ── */
        .stat-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
          margin-bottom: 18px;
        }
        .stat-card {
          background: #fff; border-radius: 16px; padding: 16px 14px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          border: 1px solid rgba(58,143,80,0.07);
        }
        .stat-icon { font-size: 20px; margin-bottom: 6px; }
        .stat-label { font-size: 10px; font-weight: 700; color: #9ab5a3; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
        .stat-val { font-size: 17px; font-weight: 800; color: #1a3d28; line-height: 1; }
        .stat-sub { font-size: 10px; color: #b0c4b8; margin-top: 3px; }
        .stat-card.red  .stat-val { color: #d32f2f; }
        .stat-card.green .stat-val { color: #2e6b3e; }

        /* ── SECTION CARD ── */
        .card {
          background: #fff; border-radius: 18px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.06);
          border: 1px solid rgba(58,143,80,0.07);
          margin-bottom: 14px; overflow: hidden;
        }
        .card-head {
          padding: 16px 18px 12px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #f0f5f1;
        }
        .card-title { font-size: 13.5px; font-weight: 700; color: #1a3d28; }
        .card-badge {
          background: #edf7ef; color: #2e6b3e; border: 1px solid #c3dfc9;
          padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
        }
        .card-badge.red { background: #fff0f0; color: #d32f2f; border-color: #f5bebe; }
        .card-link {
          font-size: 12px; font-weight: 600; color: #3a8f50;
          text-decoration: none; cursor: pointer; background: none; border: none;
          font-family: inherit;
        }

        /* ── BILL ITEM ── */
        .bill-item {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border-bottom: 1px solid #f5f8f5;
        }
        .bill-item:last-child { border-bottom: none; }
        .bill-ico {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .bill-ico.unpaid { background: #fff8e6; }
        .bill-ico.paid   { background: #edf7ef; }
        .bill-info { flex: 1; min-width: 0; }
        .bill-name { font-size: 13px; font-weight: 700; color: #1a3d28; margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bill-amount { font-size: 12.5px; font-weight: 700; }
        .bill-amount.unpaid { color: #d32f2f; }
        .bill-amount.paid   { color: #2e6b3e; }
        .bill-due { font-size: 11px; color: #b0c4b8; margin-top: 1px; }

        .btn-pay {
          background: linear-gradient(135deg, #2e6b3e, #3a8f50);
          color: #fff; border: none; padding: 9px 14px; border-radius: 10px;
          font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: .2s; white-space: nowrap;
          box-shadow: 0 3px 10px rgba(58,143,80,0.3); flex-shrink: 0;
        }
        .btn-pay:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(58,143,80,0.4); }
        .btn-pay:disabled { opacity: .6; cursor: not-allowed; }
        .btn-pay.outline {
          background: transparent; color: #3a8f50; border: 1.5px solid #c3dfc9;
          box-shadow: none;
        }

        /* ── PAYMENT HISTORY ITEM ── */
        .pay-item {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 18px; border-bottom: 1px solid #f5f8f5;
        }
        .pay-item:last-child { border-bottom: none; }
        .pay-ico {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
        .pay-ico.success { background: #edf7ef; }
        .pay-ico.failed  { background: #fff0f0; }
        .pay-ico.pending { background: #fff8e6; }
        .pay-info { flex: 1; min-width: 0; }
        .pay-name { font-size: 13px; font-weight: 700; color: #1a3d28; margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pay-meta { font-size: 11px; color: #9ab5a3; }
        .pay-right { text-align: right; flex-shrink: 0; }
        .pay-amount { font-size: 13px; font-weight: 700; color: #1a3d28; margin-bottom: 4px; }
        .pay-status {
          display: inline-block; padding: 2px 9px; border-radius: 20px;
          font-size: 10.5px; font-weight: 700;
        }
        .pay-status.success { background: #edf7ef; color: #2e6b3e; }
        .pay-status.failed  { background: #fff0f0; color: #d32f2f; }
        .pay-status.pending { background: #fff8e6; color: #b07800; }

        /* ── BIODATA ── */
        .bio-row {
          display: flex; gap: 12px; padding: 12px 18px;
          border-bottom: 1px solid #f5f8f5; align-items: flex-start;
        }
        .bio-row:last-child { border-bottom: none; }
        .bio-label { font-size: 10.5px; font-weight: 700; color: #9ab5a3; text-transform: uppercase; letter-spacing: 0.3px; width: 100px; flex-shrink: 0; padding-top: 2px; }
        .bio-val { font-size: 13px; color: #1a3d28; flex: 1; font-weight: 500; }

        /* ── QUICK ACTIONS (Beranda) ── */
        .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 14px 18px; }
        .quick-btn {
          display: flex; align-items: center; gap: 10px; padding: 14px;
          background: #f7faf8; border: 1px solid #e4ede6; border-radius: 12px;
          cursor: pointer; border: none; font-family: inherit; text-align: left;
          transition: .15s; text-decoration: none; color: inherit;
        }
        .quick-btn:hover { background: #edf7ef; border-color: #c3dfc9; transform: translateY(-1px); }
        .quick-btn-icon { font-size: 22px; flex-shrink: 0; }
        .quick-btn-label { font-size: 12px; font-weight: 700; color: #1a3d28; }
        .quick-btn-sub   { font-size: 10.5px; color: #9ab5a3; margin-top: 1px; }

        /* ── ALERT ── */
        .alert {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fff8e6; border: 1px solid #f0d57a; border-radius: 12px;
          padding: 12px 14px; margin-bottom: 14px;
        }
        .alert-icon { font-size: 18px; flex-shrink: 0; }
        .alert-text { font-size: 12.5px; color: #7a5c00; font-weight: 500; }
        .alert-text strong { display: block; font-size: 13px; color: #5a4000; margin-bottom: 2px; }

        /* ── EMPTY ── */
        .empty { padding: 36px 20px; text-align: center; color: #9ab5a3; }
        .empty-icon { font-size: 36px; margin-bottom: 8px; }
        .empty p { font-size: 13px; font-weight: 500; }

        /* ── BOTTOM NAV ── */
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          background: rgba(255,255,255,0.96); backdrop-filter: blur(16px);
          border-top: 1px solid rgba(58,143,80,0.1);
          display: flex; align-items: center; justify-content: space-around;
          padding: 8px 0 max(8px, env(safe-area-inset-bottom));
        }
        .nav-btn {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          background: none; border: none; cursor: pointer; font-family: inherit;
          padding: 4px 16px; border-radius: 12px; transition: .15s; flex: 1;
        }
        .nav-btn:hover { background: #f0fdf4; }
        .nav-icon { font-size: 20px; line-height: 1; }
        .nav-label { font-size: 10px; font-weight: 600; color: #9ab5a3; }
        .nav-btn.active .nav-label { color: #2e6b3e; font-weight: 700; }
        .nav-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: #3a8f50; margin-top: 1px; display: none;
        }
        .nav-btn.active .nav-dot { display: block; }

        /* ── MODAL ── */
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px); z-index: 200;
          display: flex; align-items: flex-end; justify-content: center;
        }
        .modal {
          background: #fff; border-radius: 24px 24px 0 0;
          padding: 20px 20px max(32px, env(safe-area-inset-bottom));
          width: 100%; max-width: 640px; max-height: 92vh; overflow-y: auto;
          animation: slideUp .3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        .modal-handle { width: 36px; height: 4px; background: #dde8e0; border-radius: 2px; margin: 0 auto 18px; }
        .modal-title { font-family: 'Lora', serif; font-size: 17px; font-weight: 700; color: #1a3d28; margin-bottom: 18px; }

        .field { margin-bottom: 14px; }
        .field label { font-size: 11.5px; font-weight: 700; color: #5a7a66; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
        .field input, .field textarea {
          width: 100%; border: 1.5px solid #dde5e0; border-radius: 10px;
          padding: 11px 14px; font-size: 14px; color: #1a3d28;
          background: #fafcfb; outline: none; font-family: inherit; transition: .2s;
        }
        .field input:focus, .field textarea:focus { border-color: #3a8f50; box-shadow: 0 0 0 3px rgba(58,143,80,0.1); }
        .field textarea { resize: vertical; min-height: 80px; }

        .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
        .btn-save {
          flex: 1; background: linear-gradient(135deg, #2e6b3e, #3a8f50);
          color: #fff; border: none; padding: 13px; border-radius: 12px;
          font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 14px rgba(58,143,80,0.3);
        }
        .btn-save:disabled { opacity: .6; cursor: not-allowed; }
        .btn-cancel {
          background: #f5f8f5; color: #5a7a66; border: none;
          padding: 13px 20px; border-radius: 12px; font-size: 14px;
          font-weight: 600; cursor: pointer; font-family: inherit;
        }

        /* ── CONFIRM MODAL ── */
        .confirm-modal { padding: 24px 20px max(32px, env(safe-area-inset-bottom)); border-radius: 24px 24px 0 0; }
        .confirm-icon { font-size: 40px; text-align: center; margin-bottom: 12px; }
        .confirm-title { font-family: 'Lora', serif; font-size: 17px; font-weight: 700; color: #1a3d28; text-align: center; margin-bottom: 6px; }
        .confirm-desc { font-size: 13px; color: #7a9a85; text-align: center; margin-bottom: 20px; line-height: 1.6; }
        .confirm-amount {
          background: #f0fdf4; border: 1px solid #c3dfc9; border-radius: 12px;
          padding: 14px; text-align: center; margin-bottom: 20px;
        }
        .confirm-amount-label { font-size: 11px; color: #7a9a85; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 4px; }
        .confirm-amount-val { font-size: 22px; font-weight: 800; color: #1a3d28; }

        /* ── RESPONSIVE ── */
        @media (max-width: 400px) {
          .stat-grid { grid-template-columns: 1fr 1fr; }
          .stat-grid .stat-card:last-child { grid-column: span 2; }
          .quick-grid { grid-template-columns: 1fr; }
          .hero-text h2 { font-size: 17px; }
          .stat-val { font-size: 15px; }
        }
        @media (min-width: 640px) {
          .topbar { padding: 0 32px; }
          .hero { padding: 36px 32px 80px; }
          .content { padding: 0 24px; }
          .bottom-nav { border-radius: 16px 16px 0 0; max-width: 640px; left: 50%; transform: translateX(-50%); }
        }
      `}</style>

      {/* TOAST */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="app">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-brand">
            <div className="brand-dot">🌿</div>
            <div className="brand-name">SIBATAMU<span>-SPP</span></div>
          </div>
          <button className="btn-logout" onClick={() => router.push("/api/auth/signout")}>
            🚪 Keluar
          </button>
        </div>

        {/* HERO */}
        <div className="hero">
          <div className="hero-deco1" /><div className="hero-deco2" /><div className="hero-deco3" />
          <div className="hero-inner">
            <div className="avatar">{initials}</div>
            <div className="hero-text">
              <h2>{student.name}</h2>
              <p>NISN: {student.nisn}</p>
              <div className="hero-chips">
                {student.class?.name && <span className="hero-chip">📚 {student.class.name}</span>}
                {student.entryYear   && <span className="hero-chip">📅 {student.entryYear}</span>}
                {unpaidBills.length > 0 && (
                  <span className="hero-chip" style={{ background:"rgba(211,47,47,0.25)", borderColor:"rgba(211,47,47,0.3)" }}>
                    ⚠️ {unpaidBills.length} Tagihan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">

          {/* ── BERANDA ── */}
          {activeTab === "beranda" && (
            <>
              {/* Alert tagihan */}
              {unpaidBills.length > 0 && (
                <div className="alert">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-text">
                    <strong>Ada {unpaidBills.length} tagihan belum dibayar</strong>
                    Total {rp(totalTagihan)} — segera lunasi sebelum jatuh tempo.
                  </div>
                </div>
              )}

              {/* Stat 3 kolom */}
              <div className="stat-grid">
                <div className="stat-card red">
                  <div className="stat-icon">🧾</div>
                  <div className="stat-label">Tagihan</div>
                  <div className="stat-val">{unpaidBills.length}</div>
                  <div className="stat-sub">{rp(totalTagihan)}</div>
                </div>
                <div className="stat-card green">
                  <div className="stat-icon">✅</div>
                  <div className="stat-label">Terbayar</div>
                  <div className="stat-val">{paidBills.length}</div>
                  <div className="stat-sub">{rp(totalTerbayar)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-label">Riwayat</div>
                  <div className="stat-val">{payments.length}</div>
                  <div className="stat-sub">Transaksi</div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="card">
                <div className="card-head"><span className="card-title">Menu Cepat</span></div>
                <div className="quick-grid">
                  {[
                    { icon:"💳", label:"Bayar Tagihan", sub:"Lihat semua tagihan", tab:"tagihan" },
                    { icon:"📜", label:"Riwayat Bayar", sub:"Histori transaksi", tab:"riwayat" },
                    { icon:"👤", label:"Edit Profil",   sub:"Perbarui data diri", tab:"biodata" },
                    { icon:"📋", label:"Biodata",       sub:"Lihat data lengkap", tab:"biodata" },
                  ].map(item => (
                    <button key={item.tab + item.label} className="quick-btn" style={{ background:"#f7faf8", border:"1px solid #e4ede6", borderRadius:12 }}
                      onClick={() => { setActiveTab(item.tab); if(item.label === "Edit Profil") setShowEditModal(true); }}>
                      <div className="quick-btn-icon">{item.icon}</div>
                      <div>
                        <div className="quick-btn-label">{item.label}</div>
                        <div className="quick-btn-sub">{item.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tagihan terbaru */}
              {unpaidBills.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <span className="card-title">Tagihan Menunggu</span>
                    <span className="card-badge red">{unpaidBills.length}</span>
                  </div>
                  {unpaidBills.slice(0, 2).map(bill => (
                    <div key={bill.id} className="bill-item">
                      <div className="bill-ico unpaid">🧾</div>
                      <div className="bill-info">
                        <div className="bill-name">{bill.paymentType?.name}</div>
                        <div className="bill-amount unpaid">{rp(bill.amount)}</div>
                        {bill.dueDate && <div className="bill-due">Jatuh tempo: {new Date(bill.dueDate).toLocaleDateString("id-ID", {day:"numeric",month:"short",year:"numeric"})}</div>}
                      </div>
                      <button className="btn-pay" onClick={() => setShowPayModal(bill)} disabled={loading}>
                        Bayar
                      </button>
                    </div>
                  ))}
                  {unpaidBills.length > 2 && (
                    <div style={{ padding:"12px 18px", textAlign:"center" }}>
                      <button className="card-link" onClick={() => setActiveTab("tagihan")}>
                        Lihat {unpaidBills.length - 2} tagihan lainnya →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Riwayat terbaru */}
              {recentPayments.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <span className="card-title">Pembayaran Terakhir</span>
                    <button className="card-link" onClick={() => setActiveTab("riwayat")}>Semua →</button>
                  </div>
                  {recentPayments.map(pay => {
                    const st = pay.status === "SUCCESS" ? "success" : pay.status === "FAILED" ? "failed" : "pending"
                    const icons = { success:"✅", failed:"❌", pending:"⏳" }
                    return (
                      <div key={pay.id} className="pay-item">
                        <div className={`pay-ico ${st}`}>{icons[st]}</div>
                        <div className="pay-info">
                          <div className="pay-name">{pay.paymentType?.name}</div>
                          <div className="pay-meta">{pay.method} · {new Date(pay.createdAt).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}</div>
                        </div>
                        <div className="pay-right">
                          <div className="pay-amount">{rp(pay.amount)}</div>
                          <span className={`pay-status ${st}`}>
                            {st === "success" ? "Sukses" : st === "failed" ? "Gagal" : "Pending"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── TAGIHAN ── */}
          {activeTab === "tagihan" && (
            <>
              <div style={{ height: 16 }} />
              {/* Belum Bayar */}
              <div className="card">
                <div className="card-head">
                  <span className="card-title">Belum Dibayar</span>
                  {unpaidBills.length > 0 && <span className="card-badge red">{unpaidBills.length}</span>}
                </div>
                {unpaidBills.length === 0 ? (
                  <div className="empty"><div className="empty-icon">🎉</div><p>Semua tagihan lunas!</p></div>
                ) : unpaidBills.map(bill => (
                  <div key={bill.id} className="bill-item">
                    <div className="bill-ico unpaid">🧾</div>
                    <div className="bill-info">
                      <div className="bill-name">{bill.paymentType?.name}</div>
                      <div className="bill-amount unpaid">{rp(bill.amount)}</div>
                      {bill.dueDate && <div className="bill-due">Jatuh tempo: {new Date(bill.dueDate).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</div>}
                    </div>
                    <button className="btn-pay" onClick={() => setShowPayModal(bill)} disabled={loading}>
                      {loading ? "..." : "Bayar"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Sudah Bayar */}
              <div className="card">
                <div className="card-head">
                  <span className="card-title">Sudah Dibayar</span>
                  {paidBills.length > 0 && <span className="card-badge">{paidBills.length}</span>}
                </div>
                {paidBills.length === 0 ? (
                  <div className="empty"><div className="empty-icon">💳</div><p>Belum ada pembayaran</p></div>
                ) : paidBills.map(bill => (
                  <div key={bill.id} className="bill-item">
                    <div className="bill-ico paid">✅</div>
                    <div className="bill-info">
                      <div className="bill-name">{bill.paymentType?.name}</div>
                      <div className="bill-amount paid">{rp(bill.amount)}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:"#2e6b3e", background:"#edf7ef", padding:"4px 10px", borderRadius:20 }}>Lunas</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── RIWAYAT ── */}
          {activeTab === "riwayat" && (
            <>
              <div style={{ height: 16 }} />
              <div className="card">
                <div className="card-head"><span className="card-title">Riwayat Pembayaran</span></div>
                {payments.length === 0 ? (
                  <div className="empty"><div className="empty-icon">📜</div><p>Belum ada riwayat</p></div>
                ) : payments.map(pay => {
                  const st = pay.status === "SUCCESS" ? "success" : pay.status === "FAILED" ? "failed" : "pending"
                  const icons = { success:"✅", failed:"❌", pending:"⏳" }
                  return (
                    <div key={pay.id} className="pay-item">
                      <div className={`pay-ico ${st}`}>{icons[st]}</div>
                      <div className="pay-info">
                        <div className="pay-name">{pay.paymentType?.name}</div>
                        <div className="pay-meta">
                          {pay.method} · {new Date(pay.createdAt).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}
                        </div>
                      </div>
                      <div className="pay-right">
                        <div className="pay-amount">{rp(pay.amount)}</div>
                        <span className={`pay-status ${st}`}>
                          {st === "success" ? "Sukses" : st === "failed" ? "Gagal" : "Pending"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── BIODATA ── */}
          {activeTab === "biodata" && (
            <>
              <div style={{ height: 16 }} />
              <div className="card">
                <div className="card-head">
                  <span className="card-title">Data Diri</span>
                  <button className="btn-pay outline" style={{ padding:"7px 14px", fontSize:12 }} onClick={() => setShowEditModal(true)}>✏️ Edit</button>
                </div>
                {[
                  { label: "Nama Lengkap", val: student.name },
                  { label: "NISN",         val: student.nisn },
                  { label: "Kelas",        val: student.class?.name },
                  { label: "Jenis Kelamin",val: student.gender === "L" ? "Laki-laki" : student.gender === "P" ? "Perempuan" : "-" },
                  { label: "Tempat Lahir", val: student.birthplace },
                  { label: "Tanggal Lahir",val: student.birthdate ? new Date(student.birthdate).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : "-" },
                  { label: "Alamat",       val: student.address },
                  { label: "No HP",        val: student.phone },
                  { label: "Email",        val: student.email },
                  { label: "Nama Wali",    val: student.guardian },
                  { label: "Tahun Masuk",  val: student.entryYear },
                ].map((item, i) => (
                  <div key={i} className="bio-row">
                    <span className="bio-label">{item.label}</span>
                    <span className="bio-val">{item.val || "-"}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ height: 8 }} />
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="bottom-nav">
        {tabs.map(t => (
          <button key={t.key} className={`nav-btn ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
            <div className="nav-icon">{t.icon}</div>
            <div className="nav-label">{t.label}</div>
            <div className="nav-dot" />
          </button>
        ))}
      </div>

      {/* ── MODAL KONFIRMASI BAYAR ── */}
      {showPayModal && (
        <div className="overlay" onClick={e => { if(e.target === e.currentTarget) setShowPayModal(null) }}>
          <div className="modal confirm-modal">
            <div className="modal-handle" />
            <div className="confirm-icon">💳</div>
            <div className="confirm-title">Konfirmasi Pembayaran</div>
            <div className="confirm-desc">
              Kamu akan membayar tagihan berikut.<br />Kamu akan diarahkan ke halaman pembayaran.
            </div>
            <div className="confirm-amount">
              <div className="confirm-amount-label">{showPayModal.paymentType?.name}</div>
              <div className="confirm-amount-val">{rp(showPayModal.amount)}</div>
              {showPayModal.dueDate && (
                <div style={{ fontSize:11, color:"#9ab5a3", marginTop:4 }}>
                  Jatuh tempo: {new Date(showPayModal.dueDate).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowPayModal(null)}>Batal</button>
              <button className="btn-save" onClick={() => handleBayar(showPayModal)} disabled={loading}>
                {loading ? "Memproses..." : "Bayar Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT PROFIL ── */}
      {showEditModal && (
        <div className="overlay" onClick={e => { if(e.target === e.currentTarget) setShowEditModal(false) }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Edit Profil</div>
            <form onSubmit={handleEditSubmit}>
              <div className="field">
                <label>No HP</label>
                <input placeholder="08xxxxxxxxxx" value={editForm.phone}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value.replace(/\D/g,"") }))} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="email@gmail.com" value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="field">
                <label>Alamat</label>
                <textarea placeholder="Alamat lengkap" value={editForm.address}
                  onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="submit" className="btn-save" disabled={editLoading}>
                  {editLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}