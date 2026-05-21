// pages/santri/dashboard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";

export default function Dashboard() {
  const [student, setStudent]             = useState(null);
  const [bills, setBills]                 = useState([]);
  const [payments, setPayments]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [activeTab, setActiveTab]         = useState("beranda");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal]   = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedIds, setSelectedIds]     = useState([]);
  const [editForm, setEditForm]           = useState({});
  const [editLoading, setEditLoading]     = useState(false);
  const [toast, setToast]                 = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    const res = await fetch("/api/santri/dashboard");
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    setStudent(data.student);
    setBills(data.bills || []);
    setPayments(data.payments || []);
    setSelectedIds([]);
    setEditForm({
      phone:   data.student?.phone   || "",
      email:   data.student?.email   || "",
      address: data.student?.address || "",
    });
  };

  // ── BAYAR SINGLE ──────────────────────────────────────────────────────────
  const handleBayar = async (bill) => {
    setLoading(true);
    setShowPayModal(null);
    try {
      const res = await fetch("/api/payments/midtrans-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId: bill.id }),
      });
      const data = await res.json();
      if (data.snapToken) {
        window.snap.pay(data.snapToken, {
          onSuccess: () => { showToast("✅ Pembayaran berhasil!"); fetchData(); },
          onPending: () => { showToast("⏳ Menunggu pembayaran...", "info"); fetchData(); },
          onError:   () => { showToast("❌ Pembayaran gagal", "error"); },
          onClose:   () => { showToast("Pembayaran dibatalkan", "error"); },
        });
      } else {
        showToast("Gagal: " + data.message, "error");
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── BAYAR BULK ────────────────────────────────────────────────────────────
  const handleBulkBayar = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setShowBulkModal(false);
    try {
      const res = await fetch("/api/payments/midtrans-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billIds: selectedIds }),
      });
      const data = await res.json();
      if (data.snapToken) {
        window.snap.pay(data.snapToken, {
          onSuccess: () => { showToast("✅ Pembayaran berhasil!"); fetchData(); },
          onPending: () => { showToast("⏳ Menunggu pembayaran...", "info"); fetchData(); },
          onError:   () => { showToast("❌ Pembayaran gagal", "error"); },
          onClose:   () => { showToast("Pembayaran dibatalkan", "error"); },
        });
      } else {
        showToast("Gagal: " + data.message, "error");
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

  const toggleOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
  const toggleAll = (unpaid) => {
    if (selectedIds.length === unpaid.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unpaid.map(b => b.id));
    }
  };

  const rp = (v) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

  // ── CETAK BUKTI PEMBAYARAN ──────────────────────────────────────────────
  const cetakBukti = (pay) => {
    const tanggal = new Date(pay.createdAt).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
    const jam = new Date(pay.createdAt).toLocaleTimeString("id-ID", {
      hour: "2-digit", minute: "2-digit",
    });
    const noKwitansi = "#KW-" + String(pay.id).padStart(5, "0");

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Bukti Pembayaran - ${noKwitansi}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f0f7f1;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .wrap {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,.12);
      width: 100%; max-width: 420px;
      overflow: hidden;
    }
    .top {
      background: linear-gradient(135deg, #1a3d28 0%, #2e6b3e 55%, #3a8f50 100%);
      padding: 28px 24px 22px;
      text-align: center;
      position: relative;
    }
    .top-logo { font-size: 36px; margin-bottom: 8px; }
    .top h2 {
      font-size: 15px; font-weight: 800; color: #fff;
      letter-spacing: .3px; margin-bottom: 3px;
    }
    .top p { font-size: 11.5px; color: rgba(255,255,255,.65); }
    .stamp {
      position: absolute; top: 16px; right: 16px;
      background: rgba(255,255,255,.15);
      border: 1.5px solid rgba(255,255,255,.3);
      border-radius: 8px; padding: 4px 10px;
      font-size: 10px; font-weight: 700; color: rgba(255,255,255,.85);
      letter-spacing: .5px;
    }
    .status-bar {
      background: #edf7ef; border-bottom: 1px solid #c3dfc9;
      padding: 12px 24px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .status-bar span { font-size: 13px; font-weight: 700; color: #1a6b35; }
    .body { padding: 20px 24px; }
    .amount-box {
      background: linear-gradient(135deg, #f0fdf4, #edf7ef);
      border: 1.5px solid #bbf7d0;
      border-radius: 14px; padding: 18px;
      text-align: center; margin-bottom: 20px;
    }
    .amount-box .lbl { font-size: 11px; font-weight: 700; color: #7a9a85; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 6px; }
    .amount-box .val { font-size: 30px; font-weight: 800; color: #1a3d28; line-height: 1; }
    .rows {}
    .row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid #f0f5f1;
      gap: 12px;
    }
    .row:last-child { border-bottom: none; }
    .rl { font-size: 12px; color: #9ab5a3; font-weight: 600; flex-shrink: 0; }
    .rv { font-size: 12.5px; color: #1a3d28; font-weight: 600; text-align: right; }
    .method-badge {
      display: inline-block;
      background: #e3f2fd; color: #1565c0;
      padding: 2px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
    }
    .method-badge.cash { background: #fff8e1; color: #e65100; }
    .footer {
      background: #f7faf8; border-top: 1px dashed #dde8e0;
      padding: 14px 24px; text-align: center;
    }
    .footer p { font-size: 11.5px; color: #9ab5a3; line-height: 1.6; }
    .footer strong { color: #1a3d28; }
    .btn-print {
      display: block; width: calc(100% - 48px); margin: 0 24px 20px;
      padding: 13px;
      background: linear-gradient(135deg, #1a6b35, #3a8f50);
      color: #fff; border: none; border-radius: 12px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      font-family: inherit;
      box-shadow: 0 4px 14px rgba(26,107,53,.3);
    }
    @media print {
      body { background: #fff; padding: 0; }
      .wrap { box-shadow: none; border-radius: 0; max-width: 100%; }
      .btn-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div class="stamp">LUNAS</div>
      <div class="top-logo">🌿</div>
      <h2>MADRASAH TARBIYATUL MUBALIGHIN</h2>
      <p>Sumberjo · Bukti Pembayaran SPP</p>
    </div>

    <div class="status-bar">
      <span>✅ Pembayaran Berhasil</span>
    </div>

    <div class="body">
      <div class="amount-box">
        <div class="lbl">Total Dibayar</div>
        <div class="val">${rp(pay.amount)}</div>
      </div>

      <div class="rows">
        <div class="row">
          <span class="rl">No. Bukti</span>
          <span class="rv">${noKwitansi}</span>
        </div>
        <div class="row">
          <span class="rl">Tanggal</span>
          <span class="rv">${tanggal}, ${jam}</span>
        </div>
        <div class="row">
          <span class="rl">Nama Santri</span>
          <span class="rv">${student.name}</span>
        </div>
        <div class="row">
          <span class="rl">NIS</span>
          <span class="rv">${student.nis || "-"}</span>
        </div>
        <div class="row">
          <span class="rl">NISN</span>
          <span class="rv">${student.nisn || "-"}</span>
        </div>
        <div class="row">
          <span class="rl">Kelas</span>
          <span class="rv">${student.class?.name || "-"}</span>
        </div>
        <div class="row">
          <span class="rl">Jenis Tagihan</span>
          <span class="rv">${pay.paymentType?.name || "-"}</span>
        </div>
        <div class="row">
          <span class="rl">Metode</span>
          <span class="rv">
            <span class="method-badge ${pay.method === "CASH" ? "cash" : ""}">
              ${pay.method === "CASH" ? "💵 Tunai" : "🏦 Transfer"}
            </span>
          </span>
        </div>
        <div class="row">
          <span class="rl">Status</span>
          <span class="rv" style="color:#1a6b35;font-weight:800">✅ LUNAS</span>
        </div>
      </div>
    </div>

    <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>

    <div class="footer">
      <p>Terima kasih atas pembayaran Anda.<br/>
      Simpan bukti ini sebagai tanda lunas yang sah.<br/>
      <strong>Madrasah Tarbiyatul Mubalighin Sumberjo</strong></p>
    </div>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  if (!student) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f0f7f1", fontFamily:"sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <p style={{ fontSize:40, marginBottom:12 }}>🌿</p>
        <p style={{ color:"#7a9a85", fontSize:14, fontWeight:600 }}>Memuat data...</p>
      </div>
    </div>
  );

  const unpaidBills    = bills.filter(b => b.status === "UNPAID");
  const paidBills      = bills.filter(b => b.status === "PAID");
  const totalTagihan   = unpaidBills.reduce((s, b) => s + (b.amount || 0), 0);
  const totalTerbayar  = paidBills.reduce((s, b) => s + (b.amount || 0), 0);
  const initials       = student.name?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const recentPayments = payments.slice(0, 3);

  const selectedBills  = unpaidBills.filter(b => selectedIds.includes(b.id));
  const totalSelected  = selectedBills.reduce((s, b) => s + (b.amount || 0), 0);
  const allChecked     = unpaidBills.length > 0 && selectedIds.length === unpaidBills.length;

  const tabs = [
    { key:"beranda", label:"Beranda", em:"🏠" },
    { key:"tagihan", label:"Tagihan", em:"💳" },
    { key:"riwayat", label:"Riwayat", em:"📜" },
    { key:"biodata", label:"Profil",  em:"👤" },
  ];

  const si = (status) => {
    if (status === "SUCCESS") return { cls:"success", label:"Sukses", em:"✅" };
    if (status === "FAILED")  return { cls:"failed",  label:"Gagal",  em:"❌" };
    return                           { cls:"pending", label:"Pending",em:"⏳" };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#eef5f0;-webkit-font-smoothing:antialiased}

        .toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;padding:11px 20px;border-radius:12px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.15);animation:tin .3s ease;pointer-events:none}
        .toast.success{background:#1a3d28;color:#fff}
        .toast.error{background:#c62828;color:#fff}
        .toast.info{background:#1565c0;color:#fff}
        @keyframes tin{from{opacity:0;top:4px}to{opacity:1;top:16px}}

        .app{min-height:100vh;display:flex;flex-direction:column;background:#eef5f0;width:100%}

        .topbar{background:#fff;border-bottom:1px solid #e4ede6;height:58px;padding:0 20px;width:100%;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;box-shadow:0 1px 6px rgba(0,0,0,.04)}
        .tb-brand{display:flex;align-items:center;gap:9px}
        .tb-logo{width:32px;height:32px;background:linear-gradient(135deg,#1a3d28,#3a8f50);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
        .tb-name{font-family:'Lora',serif;font-size:16px;font-weight:700;color:#1a3d28}
        .tb-name span{color:#3a8f50}
        .tb-right{display:flex;align-items:center;gap:10px}
        .tb-user{font-size:12px;font-weight:600;color:#5a7a66;display:none}
        .btn-out{background:#fff0f0;color:#c62828;border:1px solid #fecaca;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:.15s;display:flex;align-items:center;gap:5px}
        .btn-out:hover{background:#ffe4e4}

        .main{display:flex;flex:1;width:100%}

        .snav{display:none;width:196px;min-width:196px;flex-shrink:0;padding:20px 10px;position:sticky;top:58px;height:calc(100vh - 58px);overflow-y:auto;border-right:1px solid #e4ede6;background:#fff}
        .snav-lbl{font-size:10px;font-weight:700;color:#9ab5a3;text-transform:uppercase;letter-spacing:.8px;padding:0 8px;margin-bottom:8px}
        .snav-btn{display:flex;align-items:center;gap:9px;width:100%;padding:10px 12px;border-radius:10px;border:none;background:transparent;font-family:inherit;font-size:13px;font-weight:600;color:#5a7a66;cursor:pointer;transition:.15s;text-align:left;margin-bottom:2px}
        .snav-btn:hover{background:#f0fdf4;color:#1a3d28}
        .snav-btn.active{background:linear-gradient(135deg,#dcfce7,#f0fdf4);color:#14532d;font-weight:700;box-shadow:inset 3px 0 0 #22c55e}
        .snav-em{font-size:16px;width:20px;text-align:center;flex-shrink:0}

        .page{flex:1;min-width:0;width:0;padding-bottom:74px}

        .hero{background:linear-gradient(135deg,#1a3d28 0%,#2e6b3e 55%,#3a8f50 100%);padding:26px 20px 68px;position:relative;overflow:hidden}
        .hdeco{position:absolute;border-radius:50%;background:rgba(255,255,255,.05);pointer-events:none}
        .hero-in{max-width:760px;display:flex;align-items:center;gap:14px;position:relative;z-index:1}
        .av{width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.18);border:2.5px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;flex-shrink:0;letter-spacing:-1px;font-family:'Lora',serif}
        .hi h2{font-family:'Lora',serif;font-size:19px;font-weight:700;color:#fff;margin-bottom:3px}
        .hi p{font-size:12px;color:rgba(255,255,255,.6);margin-bottom:7px}
        .chips{display:flex;gap:6px;flex-wrap:wrap}
        .chip{background:rgba(255,255,255,.13);color:rgba(255,255,255,.9);border:1px solid rgba(255,255,255,.2);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
        .chip.danger{background:rgba(198,40,40,.3);border-color:rgba(198,40,40,.4)}

        .ct{margin:-46px 0 0;padding:0 14px;position:relative;z-index:2}

        .sg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
        .sc{background:#fff;border-radius:14px;padding:15px 13px;box-shadow:0 2px 10px rgba(0,0,0,.06);border:1px solid #e8f0e8}
        .sc-em{font-size:19px;margin-bottom:5px;line-height:1}
        .sc-lbl{font-size:9.5px;font-weight:700;color:#9ab5a3;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
        .sc-val{font-size:20px;font-weight:800;color:#1a3d28;line-height:1.1}
        .sc-sub{font-size:10px;color:#b0c4b8;margin-top:3px}
        .sc.red .sc-val{color:#c62828}
        .sc.grn .sc-val{color:#1a6b35}

        .card{background:#fff;border-radius:16px;box-shadow:0 2px 10px rgba(0,0,0,.06);border:1px solid #e8f0e8;margin-bottom:13px;overflow:hidden}
        .ch{padding:14px 17px 11px;border-bottom:1px solid #f0f5f1;display:flex;align-items:center;justify-content:space-between}
        .ct2{font-size:13.5px;font-weight:700;color:#1a3d28}
        .bdg{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid}
        .bdg.grn{background:#edf7ef;color:#1a6b35;border-color:#c3dfc9}
        .bdg.red{background:#fff0f0;color:#c62828;border-color:#fecaca}
        .bdg.amb{background:#fffbeb;color:#92400e;border-color:#fde68a}
        .lnk{font-size:12px;font-weight:600;color:#3a8f50;background:none;border:none;cursor:pointer;font-family:inherit;padding:0}
        .lnk:hover{text-decoration:underline}

        .alert{display:flex;gap:9px;align-items:flex-start;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px 13px;margin-bottom:13px}
        .al-bod{font-size:12.5px;color:#78350f;line-height:1.5}
        .al-bod strong{display:block;font-size:13px;color:#451a03;margin-bottom:1px}

        .qg{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:13px 15px}
        .qi{display:flex;align-items:center;gap:9px;padding:12px 13px;background:#f7faf8;border:1px solid #e4ede6;border-radius:12px;cursor:pointer;font-family:inherit;text-align:left;transition:.15s;width:100%}
        .qi:hover{background:#edf7ef;transform:translateY(-1px)}
        .qi:active{transform:translateY(0)}
        .qi-em{font-size:21px;line-height:1;flex-shrink:0}
        .qi-lbl{font-size:12px;font-weight:700;color:#1a3d28}
        .qi-sub{font-size:10.5px;color:#9ab5a3;margin-top:1px}

        .br{display:flex;align-items:center;gap:11px;padding:13px 17px;border-bottom:1px solid #f5f8f5;transition:background .15s}
        .br:last-child{border-bottom:none}
        .br.selected{background:#f0fdf4}
        .bi{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
        .bi.u{background:#fffbeb}
        .bi.p{background:#f0fdf4}
        .bin{flex:1;min-width:0}
        .bn{font-size:13px;font-weight:700;color:#1a3d28;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
        .ba{font-size:12.5px;font-weight:700}
        .ba.u{color:#c62828}
        .ba.p{color:#1a6b35}
        .bd{font-size:11px;color:#b0c4b8;margin-top:1px}
        .btn-b{background:linear-gradient(135deg,#1a6b35,#3a8f50);color:#fff;border:none;padding:9px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;transition:.15s;box-shadow:0 2px 7px rgba(26,107,53,.3)}
        .btn-b:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(26,107,53,.4)}
        .btn-b:disabled{opacity:.55;cursor:not-allowed}
        .btn-b.ol{background:transparent;color:#3a8f50;border:1.5px solid #c3dfc9;box-shadow:none}

        .cb-wrap{display:flex;align-items:center;flex-shrink:0}
        .cb-inp{width:18px;height:18px;accent-color:#1a6b35;cursor:pointer;border-radius:4px}

        .select-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 17px;border-bottom:1px solid #f0f5f1;background:#f7faf8}
        .select-bar-l{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:600;color:#1a3d28;cursor:pointer}
        .select-bar-r{font-size:12px;color:#9ab5a3}

        .bulk-footer{position:sticky;bottom:0;background:#fff;border-top:1px solid #e4ede6;padding:12px 17px max(12px,env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:space-between;gap:12px;z-index:10}
        .bulk-info{flex:1;min-width:0}
        .bulk-count{font-size:12px;color:#9ab5a3;font-weight:600;margin-bottom:2px}
        .bulk-total{font-size:16px;font-weight:800;color:#1a3d28}
        .btn-bulk{background:linear-gradient(135deg,#1a6b35,#3a8f50);color:#fff;border:none;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;box-shadow:0 3px 10px rgba(26,107,53,.3);transition:.15s}
        .btn-bulk:hover:not(:disabled){transform:translateY(-1px)}
        .btn-bulk:disabled{opacity:.45;cursor:not-allowed;background:#aaa;box-shadow:none}

        .pr{display:flex;align-items:center;gap:11px;padding:12px 17px;border-bottom:1px solid #f5f8f5}
        .pr:last-child{border-bottom:none}
        .pi{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
        .pi.success{background:#f0fdf4}
        .pi.failed{background:#fff0f0}
        .pi.pending{background:#fffbeb}
        .pif{flex:1;min-width:0}
        .pn{font-size:13px;font-weight:700;color:#1a3d28;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
        .pm{font-size:11px;color:#9ab5a3}
        .pr-r{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}
        .pa{font-size:13px;font-weight:700;color:#1a3d28}
        .ps{display:inline-block;padding:2px 9px;border-radius:20px;font-size:10.5px;font-weight:700}
        .ps.success{background:#f0fdf4;color:#1a6b35}
        .ps.failed{background:#fff0f0;color:#c62828}
        .ps.pending{background:#fffbeb;color:#92400e}

        .btn-cetak-bukti{
          background:#f0fdf4;color:#1a6b35;
          border:1.5px solid #c3dfc9;
          padding:5px 11px;border-radius:8px;
          font-size:11px;font-weight:700;
          cursor:pointer;font-family:inherit;
          display:flex;align-items:center;gap:4px;
          transition:.15s;white-space:nowrap;
        }
        .btn-cetak-bukti:hover{background:#dcfce7;border-color:#86efac}

        .brow{display:flex;gap:11px;padding:11px 17px;border-bottom:1px solid #f5f8f5;align-items:flex-start}
        .brow:last-child{border-bottom:none}
        .blbl{font-size:10.5px;font-weight:700;color:#9ab5a3;text-transform:uppercase;letter-spacing:.3px;width:106px;flex-shrink:0;padding-top:2px}
        .bval{font-size:13px;color:#1a3d28;font-weight:500;flex:1}

        .empty{padding:34px 20px;text-align:center;color:#9ab5a3}
        .empty p{font-size:13px;font-weight:500;margin-top:6px}

        .bnav{position:fixed;bottom:0;left:0;right:0;z-index:49;background:rgba(255,255,255,.97);border-top:1px solid #e4ede6;display:flex;padding:5px 0 max(5px,env(safe-area-inset-bottom))}
        .nb{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;font-family:inherit;padding:4px 0;transition:.15s}
        .nb-em{font-size:20px;line-height:1.2}
        .nb-lbl{font-size:10px;font-weight:600;color:#9ab5a3}
        .nb.active .nb-lbl{color:#1a6b35;font-weight:700}
        .nb-dot{width:4px;height:4px;border-radius:50%;background:#3a8f50;display:none}
        .nb.active .nb-dot{display:block}

        .ov{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.42);display:flex;align-items:flex-end;justify-content:center}
        .mo{background:#fff;border-radius:24px 24px 0 0;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;padding:20px 20px max(28px,env(safe-area-inset-bottom));animation:su .28s cubic-bezier(.4,0,.2,1)}
        @keyframes su{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        .mh{width:36px;height:4px;background:#dde8e0;border-radius:2px;margin:0 auto 17px}
        .mt{font-family:'Lora',serif;font-size:17px;font-weight:700;color:#1a3d28;margin-bottom:17px}
        .cico{font-size:38px;text-align:center;margin-bottom:9px}
        .ctit{font-family:'Lora',serif;font-size:17px;font-weight:700;color:#1a3d28;text-align:center;margin-bottom:5px}
        .cdesc{font-size:13px;color:#7a9a85;text-align:center;line-height:1.6;margin-bottom:17px}
        .cbox{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:13px;text-align:center;margin-bottom:18px}
        .cbl{font-size:11px;color:#7a9a85;font-weight:600;text-transform:uppercase;letter-spacing:.3px;margin-bottom:4px}
        .cbv{font-size:22px;font-weight:800;color:#1a3d28}
        .cbd{font-size:11px;color:#9ab5a3;margin-top:3px}

        .bulk-list{margin-bottom:16px}
        .bulk-li{display:flex;justify-content:space-between;align-items:center;padding:9px 13px;background:#f7faf8;border:1px solid #e4ede6;border-radius:10px;margin-bottom:7px}
        .bulk-li-name{font-size:13px;font-weight:600;color:#1a3d28}
        .bulk-li-amt{font-size:13px;font-weight:700;color:#c62828}
        .bulk-divider{border:none;border-top:1px dashed #dde8e0;margin:12px 0}
        .bulk-li.total{background:#edf7ef;border-color:#c3dfc9}
        .bulk-li.total .bulk-li-name{color:#1a6b35;font-weight:700}
        .bulk-li.total .bulk-li-amt{color:#1a6b35;font-size:15px}

        .field{margin-bottom:13px}
        .field label{display:block;font-size:11px;font-weight:700;color:#5a7a66;text-transform:uppercase;letter-spacing:.3px;margin-bottom:5px}
        .field input,.field textarea{width:100%;border:1.5px solid #dde5e0;border-radius:10px;padding:11px 13px;font-size:14px;color:#1a3d28;background:#fafcfb;outline:none;font-family:inherit;transition:border-color .2s}
        .field input:focus,.field textarea:focus{border-color:#3a8f50;box-shadow:0 0 0 3px rgba(58,143,80,.1)}
        .field textarea{resize:vertical;min-height:78px}
        .mac{display:flex;gap:10px;margin-top:17px}
        .btn-sv{flex:1;background:linear-gradient(135deg,#1a6b35,#3a8f50);color:#fff;border:none;padding:13px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(26,107,53,.3);transition:.15s}
        .btn-sv:hover:not(:disabled){opacity:.9}
        .btn-sv:disabled{opacity:.55;cursor:not-allowed}
        .btn-cn{background:#f5f8f5;color:#5a7a66;border:none;padding:13px 18px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
        .btn-cn:hover{background:#eaefeb}

        @media(max-width:380px){
          .sg{grid-template-columns:1fr 1fr}
          .sg .sc:last-child{grid-column:span 2}
          .qg{grid-template-columns:1fr}
          .hi h2{font-size:16px}
        }
        @media(min-width:640px){
          .topbar{padding:0 28px}
          .tb-user{display:block}
          .hero{padding:30px 28px 68px}
          .ct{padding:0 20px}
          .page{padding-bottom:0}
          .bnav{display:none}
          .snav{display:flex;flex-direction:column}
          .sg{gap:13px}
          .sc{padding:17px 15px}
          .sc-val{font-size:22px}
          .qg{grid-template-columns:repeat(4,1fr);padding:15px}
          .hi h2{font-size:21px}
          .card{border-radius:18px}
        }
        @media(min-width:1024px){
          .ct-wrap{max-width:900px;margin:0 auto}
          .hero{padding:34px 36px 76px}
          .ct{padding:0 28px}
        }
      `}</style>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="app">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="tb-brand">
            <div className="tb-logo">🌿</div>
            <div className="tb-name">SIBATAMU<span>-SPP</span></div>
          </div>
          <div className="tb-right">
            <span className="tb-user">Halo, {student.name?.split(" ")[0]} 👋</span>
            <button className="btn-out" onClick={() => signOut({ callbackUrl: "/login" })}>
              <span>🚪</span> Keluar
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          {/* SIDEBAR desktop */}
          <nav className="snav">
            <div className="snav-lbl">Menu</div>
            {tabs.map(t => (
              <button key={t.key} className={`snav-btn ${activeTab===t.key?"active":""}`} onClick={() => setActiveTab(t.key)}>
                <span className="snav-em">{t.em}</span>{t.label}
              </button>
            ))}
          </nav>

          {/* PAGE */}
          <div className="page">
            {/* HERO */}
            <div className="hero">
              <div className="hdeco" style={{top:-50,right:-50,width:180,height:180}}/>
              <div className="hdeco" style={{bottom:-30,left:20,width:100,height:100}}/>
              <div className="hero-in">
                <div className="av">{initials}</div>
                <div className="hi">
                  <h2>{student.name}</h2>
                  <p>NISN: {student.nisn}</p>
                  <div className="chips">
                    {student.class?.name && <span className="chip">📚 {student.class.name}</span>}
                    {student.entryYear   && <span className="chip">📅 {student.entryYear}</span>}
                    {unpaidBills.length > 0 && <span className="chip danger">⚠️ {unpaidBills.length} Tagihan</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* CONTENT */}
            <div className="ct">

              {/* ════ BERANDA ════ */}
              {activeTab==="beranda" && <>
                {unpaidBills.length > 0 && (
                  <div className="alert">
                    <span style={{fontSize:17}}>⚠️</span>
                    <div className="al-bod">
                      <strong>Ada {unpaidBills.length} tagihan belum dibayar</strong>
                      Total {rp(totalTagihan)} — segera lunasi sebelum jatuh tempo.
                    </div>
                  </div>
                )}

                <div className="sg">
                  <div className="sc red"><div className="sc-em">🧾</div><div className="sc-lbl">Tagihan</div><div className="sc-val">{unpaidBills.length}</div><div className="sc-sub">{rp(totalTagihan)}</div></div>
                  <div className="sc grn"><div className="sc-em">✅</div><div className="sc-lbl">Terbayar</div><div className="sc-val">{paidBills.length}</div><div className="sc-sub">{rp(totalTerbayar)}</div></div>
                  <div className="sc"><div className="sc-em">📊</div><div className="sc-lbl">Riwayat</div><div className="sc-val">{payments.length}</div><div className="sc-sub">Transaksi</div></div>
                </div>

                <div className="card">
                  <div className="ch"><span className="ct2">Menu Cepat</span></div>
                  <div className="qg">
                    {[
                      {em:"💳",lbl:"Bayar Tagihan",sub:"Pilih & bayar tagihan",fn:()=>setActiveTab("tagihan")},
                      {em:"📜",lbl:"Riwayat Bayar",sub:"Histori transaksi",fn:()=>setActiveTab("riwayat")},
                      {em:"✏️",lbl:"Edit Profil",sub:"Perbarui data diri",fn:()=>{setActiveTab("biodata");setShowEditModal(true)}},
                      {em:"👤",lbl:"Biodata",sub:"Lihat data lengkap",fn:()=>setActiveTab("biodata")},
                    ].map((x,i)=>(
                      <button key={i} className="qi" onClick={x.fn}>
                        <span className="qi-em">{x.em}</span>
                        <div><div className="qi-lbl">{x.lbl}</div><div className="qi-sub">{x.sub}</div></div>
                      </button>
                    ))}
                  </div>
                </div>

                {unpaidBills.length > 0 && (
                  <div className="card">
                    <div className="ch"><span className="ct2">Tagihan Menunggu</span><span className="bdg red">{unpaidBills.length}</span></div>
                    {unpaidBills.slice(0,3).map(bill=>(
                      <div key={bill.id} className="br">
                        <div className="bi u">🧾</div>
                        <div className="bin">
                          <div className="bn">{bill.paymentType?.name}</div>
                          <div className="ba u">{rp(bill.amount)}</div>
                          {bill.dueDate && <div className="bd">Jatuh tempo: {new Date(bill.dueDate).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</div>}
                        </div>
                        <button className="btn-b" onClick={()=>setShowPayModal(bill)} disabled={loading}>Bayar</button>
                      </div>
                    ))}
                    {unpaidBills.length > 3 && (
                      <div style={{padding:"11px 17px",textAlign:"center"}}>
                        <button className="lnk" onClick={()=>setActiveTab("tagihan")}>Lihat {unpaidBills.length-3} tagihan lainnya →</button>
                      </div>
                    )}
                  </div>
                )}

                {recentPayments.length > 0 && (
                  <div className="card">
                    <div className="ch"><span className="ct2">Pembayaran Terakhir</span><button className="lnk" onClick={()=>setActiveTab("riwayat")}>Semua →</button></div>
                    {recentPayments.map(pay=>{
                      const s=si(pay.status);
                      return(
                        <div key={pay.id} className="pr">
                          <div className={`pi ${s.cls}`}>{s.em}</div>
                          <div className="pif">
                            <div className="pn">{pay.paymentType?.name}</div>
                            <div className="pm">{pay.method} · {new Date(pay.createdAt).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}</div>
                          </div>
                          <div className="pr-r">
                            <div className="pa">{rp(pay.amount)}</div>
                            <span className={`ps ${s.cls}`}>{s.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>}

              {/* ════ TAGIHAN ════ */}
              {activeTab==="tagihan" && <>
                <div style={{height:14}}/>
                <div className="card">
                  <div className="ch">
                    <span className="ct2">Belum Dibayar</span>
                    {unpaidBills.length > 0 && <span className="bdg red">{unpaidBills.length}</span>}
                  </div>
                  {unpaidBills.length === 0 ? (
                    <div className="empty"><p>🎉</p><p>Semua tagihan lunas!</p></div>
                  ) : (<>
                    <div className="select-bar">
                      <label className="select-bar-l">
                        <input type="checkbox" className="cb-inp" checked={allChecked} onChange={() => toggleAll(unpaidBills)}/>
                        Pilih semua tagihan
                      </label>
                      {selectedIds.length > 0 && <span className="select-bar-r">{selectedIds.length} dipilih</span>}
                    </div>
                    {unpaidBills.map(bill => {
                      const checked = selectedIds.includes(bill.id);
                      return (
                        <div key={bill.id} className={`br${checked?" selected":""}`} style={{cursor:"pointer"}} onClick={() => toggleOne(bill.id)}>
                          <div className="cb-wrap" onClick={e=>e.stopPropagation()}>
                            <input type="checkbox" className="cb-inp" checked={checked} onChange={() => toggleOne(bill.id)}/>
                          </div>
                          <div className="bi u">🧾</div>
                          <div className="bin">
                            <div className="bn">{bill.paymentType?.name}</div>
                            <div className="ba u">{rp(bill.amount)}</div>
                            {bill.dueDate && <div className="bd">Jatuh tempo: {new Date(bill.dueDate).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</div>}
                          </div>
                          {bill.invoiceNumber && <span style={{fontSize:10,color:"#9ab5a3",flexShrink:0}}>{bill.invoiceNumber}</span>}
                        </div>
                      );
                    })}
                    <div className="bulk-footer">
                      <div className="bulk-info">
                        <div className="bulk-count">{selectedIds.length > 0 ? `${selectedIds.length} tagihan dipilih` : "Pilih tagihan di atas"}</div>
                        <div className="bulk-total">{rp(totalSelected)}</div>
                      </div>
                      <button className="btn-bulk" disabled={selectedIds.length === 0 || loading} onClick={() => setShowBulkModal(true)}>
                        {loading ? "Memproses..." : "Bayar Tagihan"}
                      </button>
                    </div>
                  </>)}
                </div>

                <div className="card">
                  <div className="ch">
                    <span className="ct2">Sudah Dibayar</span>
                    {paidBills.length > 0 && <span className="bdg grn">{paidBills.length}</span>}
                  </div>
                  {paidBills.length === 0
                    ? <div className="empty"><p>💳</p><p>Belum ada tagihan lunas</p></div>
                    : paidBills.map(bill=>(
                      <div key={bill.id} className="br">
                        <div className="bi p">✅</div>
                        <div className="bin">
                          <div className="bn">{bill.paymentType?.name}</div>
                          <div className="ba p">{rp(bill.amount)}</div>
                        </div>
                        <span className="bdg grn">Lunas</span>
                      </div>
                    ))
                  }
                </div>
              </>}

              {/* ════ RIWAYAT ════ */}
              {activeTab==="riwayat" && <>
                <div style={{height:14}}/>
                <div className="card">
                  <div className="ch"><span className="ct2">Riwayat Pembayaran</span></div>
                  {payments.length===0
                    ? <div className="empty"><p>📜</p><p>Belum ada riwayat</p></div>
                    : payments.map(pay=>{
                      const s=si(pay.status);
                      return(
                        <div key={pay.id} className="pr">
                          <div className={`pi ${s.cls}`}>{s.em}</div>
                          <div className="pif">
                            <div className="pn">{pay.paymentType?.name}</div>
                            <div className="pm">
                              {pay.method} · {new Date(pay.createdAt).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}
                            </div>
                          </div>
                          <div className="pr-r">
                            <div className="pa">{rp(pay.amount)}</div>
                            <span className={`ps ${s.cls}`}>{s.label}</span>
                            {pay.status === "SUCCESS" && (
                              <button
                                className="btn-cetak-bukti"
                                onClick={() => cetakBukti(pay)}
                                title="Cetak bukti pembayaran"
                              >
                                🖨️ Bukti
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </>}

              {/* ════ BIODATA ════ */}
              {activeTab==="biodata" && <>
                <div style={{height:14}}/>
                <div className="card">
                  <div className="ch">
                    <span className="ct2">Data Diri</span>
                    <button className="btn-b ol" style={{padding:"7px 13px",fontSize:12}} onClick={()=>setShowEditModal(true)}>✏️ Edit</button>
                  </div>
                  {[
                    {l:"Nama Lengkap", v:student.name},
                    {l:"NISN",         v:student.nisn},
                    {l:"Kelas",        v:student.class?.name},
                    {l:"Jenis Kelamin",v:student.gender==="L"?"Laki-laki":student.gender==="P"?"Perempuan":"-"},
                    {l:"Tempat Lahir", v:student.birthplace},
                    {l:"Tanggal Lahir",v:student.birthdate?new Date(student.birthdate).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}):"-"},
                    {l:"Alamat",       v:student.address},
                    {l:"No HP",        v:student.phone},
                    {l:"Email",        v:student.email},
                    {l:"Nama Wali",    v:student.guardian},
                    {l:"Tahun Masuk",  v:student.entryYear},
                  ].map((x,i)=>(
                    <div key={i} className="brow">
                      <span className="blbl">{x.l}</span>
                      <span className="bval">{x.v||"-"}</span>
                    </div>
                  ))}
                </div>
              </>}

              <div style={{height:8}}/>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="bnav">
        {tabs.map(t=>(
          <button key={t.key} className={`nb ${activeTab===t.key?"active":""}`} onClick={()=>setActiveTab(t.key)}>
            <span className="nb-em">{t.em}</span>
            <span className="nb-lbl">{t.label}</span>
            <div className="nb-dot"/>
          </button>
        ))}
      </div>

      {/* MODAL BAYAR SINGLE */}
      {showPayModal && (
        <div className="ov" onClick={e=>{if(e.target===e.currentTarget)setShowPayModal(null)}}>
          <div className="mo">
            <div className="mh"/>
            <div className="cico">💳</div>
            <div className="ctit">Konfirmasi Pembayaran</div>
            <div className="cdesc">Kamu akan diarahkan ke halaman pembayaran. Setelah bayar, sistem akan otomatis mengkonfirmasi pembayaranmu.</div>
            <div className="cbox">
              <div className="cbl">{showPayModal.paymentType?.name}</div>
              <div className="cbv">{rp(showPayModal.amount)}</div>
              {showPayModal.dueDate && <div className="cbd">Jatuh tempo: {new Date(showPayModal.dueDate).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</div>}
            </div>
            <div className="mac">
              <button className="btn-cn" onClick={()=>setShowPayModal(null)}>Batal</button>
              <button className="btn-sv" onClick={()=>handleBayar(showPayModal)} disabled={loading}>
                {loading?"Memproses...":"Bayar Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BAYAR BULK */}
      {showBulkModal && (
        <div className="ov" onClick={e=>{if(e.target===e.currentTarget)setShowBulkModal(false)}}>
          <div className="mo">
            <div className="mh"/>
            <div className="cico">🧾</div>
            <div className="ctit">Konfirmasi Pembayaran</div>
            <div className="cdesc">Kamu akan membayar {selectedBills.length} tagihan sekaligus. Pastikan daftarnya sudah benar.</div>
            <div className="bulk-list">
              {selectedBills.map(b => (
                <div key={b.id} className="bulk-li">
                  <div>
                    <div className="bulk-li-name">{b.paymentType?.name}</div>
                    {b.dueDate && <div style={{fontSize:11,color:"#9ab5a3",marginTop:2}}>Jatuh tempo: {new Date(b.dueDate).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</div>}
                  </div>
                  <div className="bulk-li-amt">{rp(b.amount)}</div>
                </div>
              ))}
              <hr className="bulk-divider"/>
              <div className="bulk-li total">
                <div className="bulk-li-name">Total Bayar</div>
                <div className="bulk-li-amt">{rp(totalSelected)}</div>
              </div>
            </div>
            <div className="mac">
              <button className="btn-cn" onClick={()=>setShowBulkModal(false)}>Batal</button>
              <button className="btn-sv" onClick={handleBulkBayar} disabled={loading}>
                {loading?"Memproses...":"Bayar Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PROFIL */}
      {showEditModal && (
        <div className="ov" onClick={e=>{if(e.target===e.currentTarget)setShowEditModal(false)}}>
          <div className="mo">
            <div className="mh"/>
            <div className="mt">Edit Profil</div>
            <form onSubmit={handleEditSubmit}>
              <div className="field">
                <label>No HP</label>
                <input placeholder="08xxxxxxxxxx" value={editForm.phone}
                  onChange={e=>setEditForm(p=>({...p,phone:e.target.value.replace(/\D/g,"")}))}/>
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="email@gmail.com" value={editForm.email}
                  onChange={e=>setEditForm(p=>({...p,email:e.target.value}))}/>
              </div>
              <div className="field">
                <label>Alamat</label>
                <textarea placeholder="Alamat lengkap" value={editForm.address}
                  onChange={e=>setEditForm(p=>({...p,address:e.target.value}))}/>
              </div>
              <div className="mac">
                <button type="button" className="btn-cn" onClick={()=>setShowEditModal(false)}>Batal</button>
                <button type="submit" className="btn-sv" disabled={editLoading}>
                  {editLoading?"Menyimpan...":"Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}