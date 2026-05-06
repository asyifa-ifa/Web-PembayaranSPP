import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

const features = [
  { icon: "💳", title: "Pembayaran Digital",   desc: "Catat & kelola pembayaran SPP santri secara digital, cepat, dan akurat." },
  { icon: "📈", title: "Laporan Real-time",    desc: "Pantau laporan keuangan terkini kapan saja tanpa perlu rekap manual." },
  { icon: "📧", title: "Notifikasi Email",     desc: "Kirim notifikasi tagihan & konfirmasi pembayaran otomatis ke wali santri." },
  { icon: "🔐", title: "Keamanan Terjamin",    desc: "Data santri dan keuangan terlindungi dengan sistem autentikasi berlapis." },
  { icon: "🧾", title: "Cetak Kwitansi",       desc: "Cetak atau unduh kwitansi pembayaran resmi dalam hitungan detik." },
  { icon: "📊", title: "Analisis Keuangan",   desc: "Visualisasi tren pemasukan per semester untuk pengambilan keputusan." },
];

const formatRupiah = (n) => "Rp " + (Number(n) || 0).toLocaleString("id-ID");
const formatRupiahShort = (n) => {
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1) + "jt";
  if (n >= 1_000)     return "Rp " + (n / 1_000).toFixed(0) + "rb";
  return "Rp " + n;
};

function TooltipKeuangan({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltip.box}>
      <p style={tooltip.label}>{label}</p>
      <p style={tooltip.val}>{formatRupiah(payload[0].value)}</p>
    </div>
  );
}

function TooltipSantri({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltip.box}>
      <p style={tooltip.label}>{label}</p>
      <p style={tooltip.val}>{payload[0].value} santri</p>
    </div>
  );
}

const tooltip = {
  box:   { background:"#fff", border:"1px solid #d1fae5", borderRadius:10, padding:"10px 16px", boxShadow:"0 4px 16px rgba(0,0,0,0.08)" },
  label: { margin:0, fontSize:12, color:"#6b7280", fontWeight:600 },
  val:   { margin:"4px 0 0", fontSize:15, color:"#14532d", fontWeight:700 },
};

export default function Dashboard() {
  const [summary, setSummary]       = useState(null);
  const [keuanganData, setKeuangan] = useState([]);
  const [santriData, setSantri]     = useState([]);
  const [loadingGrafik, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stat cards
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setSummary({ totalPayments: 0, totalSantri: 0 }));

    // Fetch data grafik
    fetch("/api/dashboard/grafik")
      .then((r) => r.json())
      .then((data) => {
        setKeuangan(data.keuanganData || []);
        setSantri(data.santriData || []);
      })
      .catch(() => {
        setKeuangan([]);
        setSantri([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .dash-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) both; }
        .stat-card:hover { transform:translateY(-4px); box-shadow:0 12px 36px rgba(20,83,45,0.14) !important; }
        .feat-card:hover { transform:translateY(-5px); box-shadow:0 10px 30px rgba(0,0,0,0.08) !important; }
        .stat-card, .feat-card { transition: all 0.25s ease; }
      `}</style>

      <div className="dash-root" style={s.page}>

        {/* HEADER */}
        <div className="fade-up" style={{ animationDelay:"0ms", ...s.header }}>
          <div>
            <h2 style={s.pageTitle}>Dashboard Admin</h2>
            <p style={s.pageSubtitle}>Selamat datang kembali — ringkasan data SIBATAMU-SPP hari ini</p>
          </div>
          <div style={s.dateBadge}>
            📅 {new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="fade-up" style={{ animationDelay:"80ms", ...s.statGrid }}>
          <StatCard
            icon="💰"
            label="Total Pemasukan Bulan Ini"
            value={summary ? formatRupiah(summary.totalPayments) : "Memuat..."}
            bg="linear-gradient(135deg,#14532d 0%,#22c55e 100%)"
          />
          <StatCard
            icon="🎓"
            label="Jumlah Santri Aktif"
            value={summary ? summary.totalSantri : "Memuat..."}
            bg="linear-gradient(135deg,#0369a1 0%,#38bdf8 100%)"
          />
        </div>

        {/* GRAFIK KEUANGAN */}
        <div className="fade-up" style={{ animationDelay:"160ms", ...s.chartCard }}>
          <div style={s.chartHeader}>
            <div>
              <h3 style={s.chartTitle}>📈 Grafik Pemasukan Per Semester</h3>
              <p style={s.chartSub}>Tren total pemasukan SPP dalam beberapa semester terakhir</p>
            </div>
            {loadingGrafik && <span style={s.loadingBadge}>⏳ Memuat...</span>}
          </div>
          {!loadingGrafik && keuanganData.length === 0 ? (
            <div style={s.emptyState}>📭 Belum ada data pemasukan</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={keuanganData} margin={{ top:10, right:20, left:10, bottom:0 }}>
                <defs>
                  <linearGradient id="gradKeu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="semester" tick={{ fontSize:11, fill:"#6b7280" }} />
                <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:11, fill:"#6b7280" }} width={72} />
                <Tooltip content={<TooltipKeuangan />} />
                <Area type="monotone" dataKey="pemasukan" stroke="#16a34a" strokeWidth={3} fill="url(#gradKeu)" dot={{ r:5, fill:"#16a34a", strokeWidth:2, stroke:"#fff" }} activeDot={{ r:7 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* GRAFIK SANTRI */}
        <div className="fade-up" style={{ animationDelay:"240ms", ...s.chartCard }}>
          <div style={s.chartHeader}>
            <div>
              <h3 style={s.chartTitle}>🎓 Grafik Santri Per Semester</h3>
              <p style={s.chartSub}>Perkembangan jumlah santri aktif per semester</p>
            </div>
            {loadingGrafik && <span style={s.loadingBadge}>⏳ Memuat...</span>}
          </div>
          {!loadingGrafik && santriData.length === 0 ? (
            <div style={s.emptyState}>📭 Belum ada data santri</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={santriData} margin={{ top:10, right:20, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="gradSantri" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#0ea5e9" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" />
                <XAxis dataKey="semester" tick={{ fontSize:11, fill:"#6b7280" }} />
                <YAxis tick={{ fontSize:11, fill:"#6b7280" }} />
                <Tooltip content={<TooltipSantri />} />
                <Bar dataKey="santri" fill="url(#gradSantri)" radius={[8,8,0,0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* FITUR UNGGULAN */}
        <div className="fade-up" style={{ animationDelay:"320ms" }}>
          <h3 style={{ ...s.chartTitle, marginBottom:6 }}>✨ Fitur Unggulan Sistem</h3>
          <p style={{ ...s.chartSub, marginBottom:24 }}>Kemampuan utama platform SIBATAMU-SPP</p>
          <div style={s.featGrid}>
            {features.map((f, i) => (
              <div key={i} className="feat-card fade-up" style={{ animationDelay:`${360 + i * 60}ms`, ...s.featCard }}>
                <div style={s.featIcon}>{f.icon}</div>
                <h4 style={s.featTitle}>{f.title}</h4>
                <p style={s.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

function StatCard({ icon, label, value, bg }) {
  return (
    <div className="stat-card" style={{ background:bg, borderRadius:18, padding:"28px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 6px 24px rgba(0,0,0,0.10)", color:"#fff" }}>
      <div>
        <p style={{ margin:0, fontSize:13, opacity:0.85, fontWeight:500 }}>{label}</p>
        <p style={{ margin:"8px 0 0", fontSize:30, fontWeight:800, letterSpacing:-1 }}>{value}</p>
      </div>
      <div style={{ fontSize:42, background:"rgba(255,255,255,0.18)", borderRadius:14, width:68, height:68, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {icon}
      </div>
    </div>
  );
}

const s = {
  page:         { padding:"32px 36px", maxWidth:1100, display:"flex", flexDirection:"column", gap:28 },
  header:       { display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 },
  pageTitle:    { margin:0, fontSize:26, fontWeight:800, color:"#111827" },
  pageSubtitle: { margin:"4px 0 0", fontSize:14, color:"#6b7280" },
  dateBadge:    { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"8px 16px", fontSize:13, color:"#14532d", fontWeight:600 },
  statGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20 },
  chartCard:    { background:"#ffffff", borderRadius:18, padding:"28px 28px 20px", boxShadow:"0 4px 20px rgba(0,0,0,0.06)", border:"1px solid #f3f4f6" },
  chartHeader:  { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
  chartTitle:   { margin:0, fontSize:17, fontWeight:700, color:"#111827" },
  chartSub:     { margin:"4px 0 0", fontSize:13, color:"#9ca3af" },
  loadingBadge: { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"4px 12px", fontSize:12, color:"#16a34a", fontWeight:600 },
  emptyState:   { textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:14 },
  featGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:18 },
  featCard:     { background:"#ffffff", borderRadius:16, padding:"24px 22px", boxShadow:"0 4px 16px rgba(0,0,0,0.05)", border:"1px solid #f3f4f6" },
  featIcon:     { fontSize:36, marginBottom:12 },
  featTitle:    { margin:"0 0 8px", fontSize:15, fontWeight:700, color:"#111827" },
  featDesc:     { margin:0, fontSize:13, color:"#6b7280", lineHeight:1.6 },
};