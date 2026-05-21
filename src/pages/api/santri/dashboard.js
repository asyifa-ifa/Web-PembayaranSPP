import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import Head from "next/head";

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
  const [snapReady, setSnapReady]         = useState(false);
  const sseRef = useRef(null); // simpan referensi EventSource
  const router = useRouter();

  // ── Load Snap.js Midtrans sekali saat halaman pertama kali dibuka ──────
  useEffect(() => {
    const existingScript = document.getElementById("midtrans-snap");
    if (existingScript) { setSnapReady(true); return; }

    const script = document.createElement("script");
    script.id  = "midtrans-snap";
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
    script.onload = () => setSnapReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    fetchData();
    // Bersihkan SSE saat komponen unmount
    return () => { if (sseRef.current) sseRef.current.close(); };
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

  /**
   * Buka SSE listener untuk orderId tertentu.
   */
  const listenSSE = (orderId) => {
    if (sseRef.current) sseRef.current.close();

    const es = new EventSource(`/api/payments/sse?orderId=${encodeURIComponent(orderId)}`);
    sseRef.current = es;

    es.onmessage = (event) => {
      if (event.data === "connected") return; 
      try {
        const payload = JSON.parse(event.data);
        if (payload.status === "SUCCESS") {
          es.close();
          sseRef.current = null;
          showToast("✅ Pembayaran berhasil dikonfirmasi!");
          fetchData(); 
        }
      } catch (_) {}
    };

    es.onerror = () => {
      es.close();
      sseRef.current = null;
    };

    setTimeout(() => {
      es.close();
      sseRef.current = null;
    }, 600_000);
  };

  /**
   * Handler bayar single tagihan (SUDAH DIPERBAIKI)
   */
  const handleBayar = async (bill) => {
    if (!snapReady) {
      showToast("Snap.js belum siap, coba lagi sebentar", "error");
      return;
    }
    setLoading(true);
    setShowPayModal(null);
    try {
      const res = await fetch("/api/payments/midtrans-create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ billId: bill.id }),
      });
      const data = await res.json();

      // Debugging pembantu: Cek isi data asli di console browser
      console.log("[DEBUG] Response Midtrans Create:", data);

      // Cari token secara fleksibel dari backend (mencegah undefined)
      const token = data.snapToken || data.token;

      if (!token) {
        const errorMessage = data.message || `Token kosong. Response: ${JSON.stringify(data)}`;
        showToast("Gagal: " + errorMessage, "error");
        return;
      }

      // Jalankan SSE listener sebelum popup dibuka
      listenSSE(data.orderId);

      // Pastikan objek window.snap tersedia di browser
      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: () => {
            fetchData();
            showToast("✅ Pembayaran berhasil!");
          },
          onPending: () => {
            showToast("⏳ Pembayaran pending, menunggu konfirmasi...", "info");
          },
          onError: (result) => {
            showToast("❌ Pembayaran gagal: " + (result?.status_message || "Terjadi kesalahan"), "error");
          },
          onClose: () => {
            showToast("Popup ditutup. Kamu bisa bayar lagi kapan saja.", "info");
          },
        });
      } else {
        showToast("Gagal: SDK Midtrans Snap tidak ter-load sempurna di browser", "error");
      }
    } catch (err) {
      showToast("Error: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler bayar bulk tagihan (SUDAH DIPERBAIKI)
   */
  const handleBulkBayar = async () => {
    if (selectedIds.length === 0) return;
    if (!snapReady) {
      showToast("Snap.js belum siap, coba lagi sebentar", "error");
      return;
    }
    setLoading(true);
    setShowBulkModal(false);
    try {
      const res = await fetch("/api/payments/midtrans-create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ billIds: selectedIds }),
      });
      const data = await res.json();

      console.log("[DEBUG] Response Bulk Midtrans Create:", data);

      const token = data.snapToken || data.token;

      if (!token) {
        const errorMessage = data.message || `Token kosong. Response: ${JSON.stringify(data)}`;
        showToast("Gagal: " + errorMessage, "error");
        return;
      }

      listenSSE(data.orderId);

      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: () => {
            fetchData();
            showToast("✅ Semua tagihan berhasil dibayar!");
          },
          onPending: () => {
            showToast("⏳ Pembayaran pending, menunggu konfirmasi...", "info");
          },
          onError: (result) => {
            showToast("❌ Pembayaran gagal: " + (result?.status_message || "Terjadi kesalahan"), "error");
          },
          onClose: () => {
            showToast("Popup ditutup. Kamu bisa bayar lagi kapan saja.", "info");
          },
        });
      } else {
        showToast("Gagal: SDK Midtrans Snap tidak ter-load sempurna di browser", "error");
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
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(editForm),
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
    .wrap { background: #fff; border-radius: 20px; box-shadow: 0 8px 40px rgba(0,0,0,.12); width: 100%; max-width: 420px; overflow: hidden; }
    .top { background: linear-gradient(135deg, #1a3d28 0%, #2e6b3e 55%, #3a8f50 100%); padding: 28px 24px 22px; text-align: center; position: relative; }
    .top-logo { font-size: 36px; margin-bottom: 8px; }
    .top h2 { font-size: 15px; font-weight: 800; color: #fff; letter-spacing: .3px; margin-bottom: 3px; }
    .top p { font-size: 11.5px; color: rgba(255,255,255,.65); }
    .stamp { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.3); border-radius: 8px; padding: 4px 10px; font-size: 10px; font-weight: 700; color: rgba(255,255,255,.85); letter-spacing: .5px; }
    .status-bar { background: #edf7ef; border-bottom: 1px solid #c3dfc9; padding: 12px 24px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .status-bar span { font-size: 13px; font-weight: 700; color: #1a6b35; }
    .body { padding: 20px 24px; }
    .amount-box { background: linear-gradient(135deg, #f0fdf4, #edf7ef); border: 1.5px solid #bbf7d0; border-radius: 14px; padding: 18px; text-align: center; margin-bottom: 20px; }
    .amount-box .lbl { font-size: 11px; font-weight: 700; color: #7a9a85; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 6px; }
    .amount-box .val { font-size: 30px; font-weight: 800; color: #1a3d28; line-height: 1; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f0f5f1; gap: 12px; }
    .row:last-child { border-bottom: none; }
    .rl { font-size: 12px; color: #9ab5a3; font-weight: 600; flex-shrink: 0; }
    .rv font-size: 12.5px; color: #1a3d28; font-weight: 600; text-align: right; }
    .method-badge { display: inline-block; background: #e3f2fd; color: #1565c0; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .method-badge.cash { background: #fff8e1; color: #e65100; }
    .footer { background: #f7faf8; border-top: 1px dashed #dde8e0; padding: 14px 24px; text-align: center; }
    .footer p { font-size: 11.5px; color: #9ab5a3; line-height: 1.6; }
    .footer strong { color: #1a3d28; }
    .btn-print { display: block; width: calc(100% - 48px); margin: 0 24px 20px; padding: 13px; background: linear-gradient(135deg, #1a6b35, #3a8f50); color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(26,107,53,.3); }
    @media print { body { background: #fff; padding: 0; } .wrap { box-shadow: none; border-radius: 0; max-width: 100%; } .btn-print { display: none; } }
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
    <div class="status-bar"><span>✅ Pembayaran Berhasil</span></div>
    <div class="body">
      <div class="amount-box">
        <div class="lbl">Total Dibayar</div>
        <div class="val">${rp(pay.amount)}</div>
      </div>
      <div class="rows">
        <div class="row"><span class="rl">No. Bukti</span><span class="rv">${noKwitansi}</span></div>
        <div class="row"><span class="rl">Tanggal</span><span class="rv">${tanggal}, ${jam}</span></div>
        <div class="row"><span class="rl">Nama Santri</span><span class="rv">${student.name}</span></div>
        <div class="row"><span class="rl">NIS</span><span class="rv">${student.nis || "-"}</span></div>
        <div class="row"><span class="rl">NISN</span><span class="rv">${student.nisn || "-"}</span></div>
        <div class="row"><span class="rl">Kelas</span><span class="rv">${student.class?.name || "-"}</span></div>
        <div class="row"><span class="rl">Jenis Tagihan</span><span class="rv">${pay.paymentType?.name || "-"}</span></div>
        <div class="row"><span class="rl">Metode</span><span class="rv"><span class="method-badge ${pay.method === "CASH" ? "cash" : ""}">${pay.method === "CASH" ? "💵 Tunai" : "🏦 Transfer"}</span></span></div>
        <div class="row"><span class="rl">Status</span><span class="rv" style="color:#1a6b35;font-weight:800">✅ LUNAS</span></div>
      </div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
    <div class="footer">
      <p>Terima kasih atas pembayaran Anda.<br/>Simpan bukti ini sebagai tanda lunas yang sah.<br/><strong>Madrasah Tarbiyatul Mubalighin Sumberjo</strong></p>
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
    return                               { cls:"pending", label:"Pending",em:"⏳" };
  };

  return (
    <>
      <Head>
        <title>Dashboard Santri - SIBATAMU</title>
      </Head>

      {/* Tampilan Toast Notifikasi */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* Sisa kode render UI (HTML/CSS) dashboard-mu diletakkan di bawah ini */}
      <div className="app">
        <div className="topbar">
          <div className="tb-brand">
            <div className="tb-logo">🌿</div>
            <div className="tb-name">SIBA<span>TAMU</span></div>
          </div>
          <div className="tb-right">
            <button className="btn-out" onClick={() => signOut()}>Keluar</button>
          </div>
        </div>
        
        <div className="main">
          <div className="page" style={{ padding: '20px' }}>
            <h2>Selamat Datang, {student.name}</h2>
            <p>Silakan pilih tagihan dan klik tombol bayar untuk melakukan simulasi transaksi.</p>
            <br />
            {unpaidBills.map((bill) => (
              <div key={bill.id} className="br" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '8px', background: '#fff' }}>
                <div className="bin">
                  <div className="bn">{bill.paymentType?.name}</div>
                  <div className="ba u">{rp(bill.amount)}</div>
                </div>
                <button className="btn-b" onClick={() => handleBayar(bill)} disabled={loading}>
                  {loading ? "Memuat..." : "💳 Bayar Sekarang"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;background:#eef5f0}
        .toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;padding:11px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.15);}
        .toast.success{background:#1a3d28;color:#fff}
        .toast.error{background:#c62828;color:#fff}
        .toast.info{background:#1565c0;color:#fff}
        .app{min-height:100vh;display:flex;flex-direction:column;}
        .topbar{background:#fff;border-bottom:1px solid #e4ede6;height:58px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;}
        .tb-brand{display:flex;align-items:center;gap:9px}
        .tb-name{font-family:'Lora',serif;font-size:16px;font-weight:700;color:#1a3d28}
        .tb-name span{color:#3a8f50}
        .btn-out{background:#fff0f0;color:#c62828;border:1px solid #fecaca;padding:7px 14px;border-radius:8px;cursor:pointer;}
        .main{display:flex;flex:1;}
        .br{display:flex;align-items:center;justify-content:space-between;}
        .bn{font-size:14px;font-weight:700;}
        .ba.u{color:#c62828;font-weight:700;}
        .btn-b{background:linear-gradient(135deg,#1a6b35,#3a8f50);color:#fff;border:none;padding:9px 14px;border-radius:10px;cursor:pointer;font-weight:700;}
      `}</style>
    </>
  );
}