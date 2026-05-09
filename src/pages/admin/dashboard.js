import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
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

function TooltipPengeluaran({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltip.box}>
      <p style={tooltip.label}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ ...tooltip.val, color: p.color, margin: "4px 0 0", fontSize: 13 }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  );
}

const tooltip = {
  box:   { background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:"10px 16px", boxShadow:"0 4px 16px rgba(0,0,0,0.08)" },
  label: { margin:0, fontSize:12, color:"#6b7280", fontWeight:600 },
  val:   { margin:"4px 0 0", fontSize:15, color:"#14532d", fontWeight:700 },
};

export default function Dashboard() {
  const [summary, setSummary]             = useState(null);
  const [keuanganData, setKeuangan]       = useState([]);
  const [santriData, setSantri]           = useState([]);
  const [pengeluaranData, setPengeluaran] = useState([]);
  const [loadingGrafik, setLoading]       = useState(true);
  const [yearFilter, setYearFilter]       = useState(new Date().getFullYear());

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setSummary({ totalPayments: 0, totalSantri: 0, totalPengeluaran: 0 }));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/dashboard/grafik").then(r => r.json()).catch(() => ({})),
      fetch(`/api/dashboard/pengeluaran-grafik?year=${yearFilter}`).then(r => r.json()).catch(() => []),
    ]).then(([grafik, pengeluaran]) => {
      setKeuangan(grafik.keuanganData || []);
      setSantri(grafik.santriData || []);
      setPengeluaran(pengeluaran || []);
    }).finally(() => setLoading(false));
  }, [yearFilter]);

  // Hitung selisih pemasukan vs pengeluaran bulan ini
  const totalPengeluaranBulanIni = summary?.totalPengeluaran || 0;
  const totalPemasukanBulanIni   = summary?.totalPayments || 0;
  const selisih = totalPemasukanBulanIni - totalPengeluaranBulanIni;

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
        .stat-card:hover { transform:translateY(-4px); box-shadow:0 12px 36px rgba(0,0,0,0.16) !important; }
        .feat-card:hover { transform:translateY(-5px); box-shadow:0 10px 30px rgba(0,0,0,0.08) !important; }
        .stat-card, .feat-card { transition: all 0.25s ease; }
        .year-btn { padding: 6px 14px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: white; font-size: 13px; font-weight: 500; color: #475569; cursor: pointer; transition: all .15s; font-family: inherit; }
        .year-btn.active { background: #6366f1; border-color: #6366f1; color: white; }
        .year-btn:hover:not(.active) { border-color: #6366f1; color: #6366f1; }
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

        {/* STAT CARDS — 4 kartu */}
        <div className="fade-up" style={{ animationDelay:"80ms", ...s.statGrid }}>
          <StatCard
            icon="💰"
            label="Total Pemasukan Bulan Ini"
            value={summary ? formatRupiah(summary.totalPayments) : "Memuat..."}
            bg="linear-gradient(135deg,#14532d 0%,#22c55e 100%)"
          />
          <StatCard
            icon="💸"
            label="Total Pengeluaran Bulan Ini"
            value={summary ? formatRupiah(totalPengeluaranBulanIni) : "Memuat..."}
            bg="linear-gradient(135deg,#7f1d1d 0%,#ef4444 100%)"
          />
          <StatCard
            icon={selisih >= 0 ? "📈" : "📉"}
            label="Saldo Bersih Bulan Ini"
            value={summary ? formatRupiah(Math.abs(selisih)) : "Memuat..."}
            bg={selisih >= 0
              ? "linear-gradient(135deg,#0369a1 0%,#38bdf8 100%)"
              : "linear-gradient(135deg,#78350f 0%,#f59e0b 100%)"}
            note={selisih >= 0 ? "▲ Surplus" : "▼ Defisit"}
          />
          <StatCard
            icon="🎓"
            label="Jumlah Santri Aktif"
            value={summary ? summary.totalSantri : "Memuat..."}
            bg="linear-gradient(135deg,#4c1d95 0%,#8b5cf6 100%)"
          />
        </div>

        {/* GRAFIK PENGELUARAN PER BULAN */}
        <div className="fade-up" style={{ animationDelay:"160ms", ...s.chartCard }}>
          <div style={s.chartHeader}>
            <div>
              <h3 style={s.chartTitle}>💸 Grafik Pengeluaran Per Bulan</h3>
              <p style={s.chartSub}>Total pengeluaran madrasah setiap bulan dalam setahun</p>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {yearOptions.map(y => (
                <button
                  key={y}
                  className={`year-btn ${yearFilter === y ? "active" : ""}`}
                  onClick={() => setYearFilter(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {loadingGrafik ? (
            <div style={s.emptyState}>⏳ Memuat data...</div>
          ) : pengeluaranData.length === 0 ? (
            <div style={s.emptyState}>📭 Belum ada data pengeluaran di tahun {yearFilter}</div>
          ) : (
            <>
              {/* Summary bar di atas grafik */}
              <div style={s.summaryRow}>
                <div style={s.summaryItem}>
                  <span style={s.summaryLabel}>Total Setahun</span>
                  <span style={{ ...s.summaryVal, color:"#dc2626" }}>
                    {formatRupiah(pengeluaranData.reduce((a, b) => a + (b.pengeluaran || 0), 0))}
                  </span>
                </div>
                <div style={s.summaryDivider} />
                <div style={s.summaryItem}>
                  <span style={s.summaryLabel}>Bulan Tertinggi</span>
                  <span style={{ ...s.summaryVal, color:"#7c3aed" }}>
                    {pengeluaranData.reduce((a, b) => (b.pengeluaran || 0) > (a.pengeluaran || 0) ? b : a, {}).bulan || "—"}
                  </span>
                </div>
                <div style={s.summaryDivider} />
                <div style={s.summaryItem}>
                  <span style={s.summaryLabel}>Rata-rata / Bulan</span>
                  <span style={{ ...s.summaryVal, color:"#0369a1" }}>
                    {formatRupiah(Math.round(
                      pengeluaranData.reduce((a, b) => a + (b.pengeluaran || 0), 0) /
                      pengeluaranData.filter(d => d.pengeluaran > 0).length || 1
                    ))}
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={pengeluaranData} margin={{ top:10, right:20, left:10, bottom:0 }}>
                  <defs>
                    <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fef2f2" />
                  <XAxis dataKey="bulan" tick={{ fontSize:11, fill:"#6b7280" }} />
                  <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:11, fill:"#6b7280" }} width={76} />
                  <Tooltip content={<TooltipPengeluaran />} />
                  <Area
                    type="monotone"
                    dataKey="pengeluaran"
                    name="Pengeluaran"
                    stroke="#ef4444"
                    strokeWidth={3}
                    fill="url(#gradExp)"
                    dot={{ r:5, fill:"#ef4444", strokeWidth:2, stroke:"#fff" }}
                    activeDot={{ r:7 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* GRAFIK PEMASUKAN VS PENGELUARAN (gabungan) */}
        {pengeluaranData.length > 0 && keuanganData.length > 0 && (
          <div className="fade-up" style={{ animationDelay:"220ms", ...s.chartCard }}>
            <div style={s.chartHeader}>
              <div>
                <h3 style={s.chartTitle}>⚖️ Pemasukan vs Pengeluaran</h3>
                <p style={s.chartSub}>Perbandingan arus masuk dan keluar keuangan madrasah per semester</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={keuanganData} margin={{ top:10, right:20, left:10, bottom:0 }}>
                <defs>
                  <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="semester" tick={{ fontSize:11, fill:"#6b7280" }} />
                <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:11, fill:"#6b7280" }} width={76} />
                <Tooltip content={<TooltipPengeluaran />} />
                <Legend
                  formatter={(val) => <span style={{ fontSize:12, color:"#475569" }}>{val}</span>}
                />
                <Bar dataKey="pemasukan" name="Pemasukan" fill="url(#gradIn)" radius={[6,6,0,0]} maxBarSize={40} />
                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="url(#gradOut)" radius={[6,6,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* GRAFIK PEMASUKAN */}
        <div className="fade-up" style={{ animationDelay:"300ms", ...s.chartCard }}>
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
        <div className="fade-up" style={{ animationDelay:"380ms", ...s.chartCard }}>
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
                    <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ff" />
                <XAxis dataKey="semester" tick={{ fontSize:11, fill:"#6b7280" }} />
                <YAxis tick={{ fontSize:11, fill:"#6b7280" }} />
                <Tooltip content={<TooltipSantri />} />
                <Bar dataKey="santri" fill="url(#gradSantri)" radius={[8,8,0,0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* FITUR UNGGULAN */}
        <div className="fade-up" style={{ animationDelay:"460ms" }}>
          <h3 style={{ ...s.chartTitle, marginBottom:6 }}>✨ Fitur Unggulan Sistem</h3>
          <p style={{ ...s.chartSub, marginBottom:24 }}>Kemampuan utama platform SIBATAMU-SPP</p>
          <div style={s.featGrid}>
            {features.map((f, i) => (
              <div key={i} className="feat-card fade-up" style={{ animationDelay:`${500 + i * 60}ms`, ...s.featCard }}>
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

function StatCard({ icon, label, value, bg, note }) {
  return (
    <div className="stat-card" style={{ background:bg, borderRadius:18, padding:"24px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 6px 24px rgba(0,0,0,0.10)", color:"#fff" }}>
      <div>
        <p style={{ margin:0, fontSize:12, opacity:0.85, fontWeight:500 }}>{label}</p>
        <p style={{ margin:"8px 0 0", fontSize:26, fontWeight:800, letterSpacing:-1 }}>{value}</p>
        {note && <p style={{ margin:"4px 0 0", fontSize:11, opacity:0.8, fontWeight:600 }}>{note}</p>}
      </div>
      <div style={{ fontSize:36, background:"rgba(255,255,255,0.18)", borderRadius:14, width:60, height:60, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {icon}
      </div>
    </div>
  );
}

const s = {
  page:         { padding:"28px 32px", maxWidth:1100, display:"flex", flexDirection:"column", gap:24 },
  header:       { display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 },
  pageTitle:    { margin:0, fontSize:26, fontWeight:800, color:"#111827" },
  pageSubtitle: { margin:"4px 0 0", fontSize:14, color:"#6b7280" },
  dateBadge:    { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"8px 16px", fontSize:13, color:"#14532d", fontWeight:600, whiteSpace:"nowrap" },
  statGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:16 },
  chartCard:    { background:"#ffffff", borderRadius:18, padding:"24px 24px 16px", boxShadow:"0 4px 20px rgba(0,0,0,0.06)", border:"1px solid #f3f4f6" },
  chartHeader:  { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:10 },
  chartTitle:   { margin:0, fontSize:16, fontWeight:700, color:"#111827" },
  chartSub:     { margin:"4px 0 0", fontSize:13, color:"#9ca3af" },
  loadingBadge: { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"4px 12px", fontSize:12, color:"#16a34a", fontWeight:600 },
  emptyState:   { textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:14 },
  featGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:16 },
  featCard:     { background:"#ffffff", borderRadius:16, padding:"22px 20px", boxShadow:"0 4px 16px rgba(0,0,0,0.05)", border:"1px solid #f3f4f6" },
  featIcon:     { fontSize:32, marginBottom:10 },
  featTitle:    { margin:"0 0 6px", fontSize:14, fontWeight:700, color:"#111827" },
  featDesc:     { margin:0, fontSize:13, color:"#6b7280", lineHeight:1.6 },
  summaryRow:   { display:"flex", gap:0, background:"#fafafa", borderRadius:12, border:"1px solid #f1f5f9", marginBottom:16, overflow:"hidden", flexWrap:"wrap" },
  summaryItem:  { flex:1, display:"flex", flexDirection:"column", padding:"12px 20px", minWidth:140 },
  summaryLabel: { fontSize:11, color:"#94a3b8", fontWeight:500, marginBottom:4 },
  summaryVal:   { fontSize:15, fontWeight:700 },
  summaryDivider: { width:1, background:"#f1f5f9", flexShrink:0 },
};