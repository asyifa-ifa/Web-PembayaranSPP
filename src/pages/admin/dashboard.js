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
  { icon: "📊", title: "Analisis Keuangan",    desc: "Visualisasi tren pemasukan per semester untuk pengambilan keputusan." },
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
  box:   { background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:"10px 16px", boxShadow:"0 4px 16px rgba(0,0,0,0.08)" },
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

  const totalPengeluaranBulanIni = summary?.totalPengeluaran || 0;
  const totalPemasukanBulanIni   = summary?.totalPayments || 0;
  const selisih = totalPemasukanBulanIni - totalPengeluaranBulanIni;

  return (
    <AdminLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .dash-root { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fu { animation: fadeUp 0.45s cubic-bezier(.22,.68,0,1.2) both; }
        .stat-card { transition: box-shadow 0.2s, transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.09) !important; }
        .chart-card { transition: box-shadow 0.2s; }
        .chart-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.07) !important; }
        .feat-card { transition: box-shadow 0.2s, transform 0.2s; }
        .feat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.07) !important; }
        .year-btn {
          padding: 5px 13px; border-radius: 6px;
          border: 1px solid #e5e7eb; background: white;
          font-size: 12px; font-weight: 500; color: #6b7280;
          cursor: pointer; transition: all .15s; font-family: inherit;
        }
        .year-btn.active { background: #111827; border-color: #111827; color: white; }
        .year-btn:hover:not(.active) { border-color: #9ca3af; color: #374151; }
      `}</style>

      <div className="dash-root" style={{ padding:"4px 0 32px", display:"flex", flexDirection:"column", gap:24 }}>

        {/* ── HEADER ── */}
        <div className="fu" style={{ animationDelay:"0ms", display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
          <div>
            <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:600, color:"#9ca3af", letterSpacing:"0.08em", textTransform:"uppercase" }}>Overview</p>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:"#111827", letterSpacing:"-0.3px" }}>Dashboard Admin</h1>
            <p style={{ margin:"3px 0 0", fontSize:13, color:"#9ca3af" }}>Ringkasan data SIBATAMU-SPP hari ini</p>
          </div>
          <span style={{ fontSize:12, color:"#6b7280", background:"#f9fafb", border:"1px solid #f3f4f6", borderRadius:8, padding:"7px 14px", fontWeight:500, whiteSpace:"nowrap" }}>
            {new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </span>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="fu" style={{ animationDelay:"60ms", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))", gap:12 }}>
          <StatCard
            label="Pemasukan Bulan Ini"
            value={summary ? formatRupiah(summary.totalPayments) : "Memuat..."}
            sub="Total SPP masuk"
            accent="#16a34a"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            }
          />
          <StatCard
            label="Pengeluaran Bulan Ini"
            value={summary ? formatRupiah(totalPengeluaranBulanIni) : "Memuat..."}
            sub="Total biaya operasional"
            accent="#dc2626"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            }
          />
          <StatCard
            label="Saldo Bersih Bulan Ini"
            value={summary ? formatRupiah(Math.abs(selisih)) : "Memuat..."}
            sub={selisih >= 0 ? "▲ Surplus" : "▼ Defisit"}
            accent={selisih >= 0 ? "#2563eb" : "#d97706"}
            subColor={selisih >= 0 ? "#2563eb" : "#d97706"}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selisih >= 0 ? "#2563eb" : "#d97706"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            }
          />
          <StatCard
            label="Jumlah Santri Aktif"
            value={summary ? summary.totalSantri : "Memuat..."}
            sub="Terdaftar & aktif"
            accent="#7c3aed"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
          />
        </div>

        {/* ── GRAFIK PENGELUARAN PER BULAN ── */}
        <div className="fu chart-card" style={{ animationDelay:"120ms", background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:12 }}>
            <div>
              <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#111827" }}>Pengeluaran Per Bulan</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#9ca3af" }}>Total pengeluaran madrasah setiap bulan dalam setahun</p>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {yearOptions.map(y => (
                <button key={y} className={`year-btn ${yearFilter === y ? "active" : ""}`} onClick={() => setYearFilter(y)}>{y}</button>
              ))}
            </div>
          </div>

          {loadingGrafik ? (
            <div style={{ textAlign:"center", padding:"48px 0", color:"#d1d5db", fontSize:13 }}>⏳ Memuat data...</div>
          ) : pengeluaranData.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", color:"#d1d5db", fontSize:13 }}>📭 Belum ada data pengeluaran di tahun {yearFilter}</div>
          ) : (
            <>
              <div style={{ display:"flex", gap:32, marginBottom:16, flexWrap:"wrap" }}>
                {[
                  { label:"Total Setahun", val: formatRupiah(pengeluaranData.reduce((a,b)=>a+(b.pengeluaran||0),0)), color:"#dc2626" },
                  { label:"Bulan Tertinggi", val: pengeluaranData.reduce((a,b)=>(b.pengeluaran||0)>(a.pengeluaran||0)?b:a,{}).bulan||"—", color:"#7c3aed" },
                  { label:"Rata-rata / Bulan", val: formatRupiah(Math.round(pengeluaranData.reduce((a,b)=>a+(b.pengeluaran||0),0)/(pengeluaranData.filter(d=>d.pengeluaran>0).length||1))), color:"#2563eb" },
                ].map((item,i) => (
                  <div key={i}>
                    <p style={{ margin:0, fontSize:11, color:"#9ca3af", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</p>
                    <p style={{ margin:"3px 0 0", fontSize:15, fontWeight:700, color:item.color }}>{item.val}</p>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={pengeluaranData} margin={{ top:8, right:16, left:8, bottom:0 }}>
                  <defs>
                    <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                  <XAxis dataKey="bulan" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={76}/>
                  <Tooltip content={<TooltipPengeluaran />} cursor={{ stroke:"#f3f4f6", strokeWidth:1 }}/>
                  <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#ef4444" strokeWidth={2.5} fill="url(#gradExp)" dot={{ r:4, fill:"#ef4444", strokeWidth:0 }} activeDot={{ r:6, strokeWidth:0 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* ── GRAFIK PEMASUKAN VS PENGELUARAN ── */}
        {pengeluaranData.length > 0 && keuanganData.length > 0 && (
          <div className="fu chart-card" style={{ animationDelay:"160ms", background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px 16px" }}>
            <div style={{ marginBottom:16 }}>
              <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#111827" }}>Pemasukan vs Pengeluaran</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#9ca3af" }}>Perbandingan arus masuk dan keluar keuangan madrasah per semester</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={keuanganData} margin={{ top:8, right:16, left:8, bottom:0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                <XAxis dataKey="semester" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={76}/>
                <Tooltip content={<TooltipPengeluaran />} cursor={{ fill:"#f9fafb" }}/>
                <Legend formatter={v => <span style={{ fontSize:11, color:"#6b7280" }}>{v}</span>}/>
                <Bar dataKey="pemasukan"   name="Pemasukan"   fill="#16a34a" radius={[4,4,0,0]} maxBarSize={36} opacity={0.85}/>
                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={36} opacity={0.85}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── 2 KOLOM: Pemasukan + Santri ── */}
        <div className="fu" style={{ animationDelay:"200ms", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:16 }}>

          <div className="chart-card" style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px 16px" }}>
            <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:600, color:"#111827" }}>Pemasukan Per Semester</p>
            <p style={{ margin:"0 0 16px", fontSize:12, color:"#9ca3af" }}>Tren total pemasukan SPP dalam beberapa semester terakhir</p>
            {loadingGrafik ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:"#d1d5db", fontSize:12 }}>⏳ Memuat...</div>
            ) : keuanganData.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:"#d1d5db", fontSize:12 }}>📭 Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={keuanganData} margin={{ top:8, right:8, left:4, bottom:0 }}>
                  <defs>
                    <linearGradient id="gradKeu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                  <XAxis dataKey="semester" tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={68}/>
                  <Tooltip content={<TooltipKeuangan />} cursor={{ stroke:"#f3f4f6" }}/>
                  <Area type="monotone" dataKey="pemasukan" stroke="#16a34a" strokeWidth={2.5} fill="url(#gradKeu)" dot={{ r:4, fill:"#16a34a", strokeWidth:0 }} activeDot={{ r:5 }}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card" style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", padding:"20px 24px 16px" }}>
            <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:600, color:"#111827" }}>Santri Per Semester</p>
            <p style={{ margin:"0 0 16px", fontSize:12, color:"#9ca3af" }}>Perkembangan jumlah santri aktif per semester</p>
            {loadingGrafik ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:"#d1d5db", fontSize:12 }}>⏳ Memuat...</div>
            ) : santriData.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:"#d1d5db", fontSize:12 }}>📭 Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={santriData} margin={{ top:8, right:8, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                  <XAxis dataKey="semester" tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TooltipSantri />} cursor={{ fill:"#f9fafb" }}/>
                  <Bar dataKey="santri" fill="#7c3aed" radius={[4,4,0,0]} maxBarSize={44} opacity={0.85}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── FITUR UNGGULAN ── */}
        <div className="fu" style={{ animationDelay:"260ms" }}>
          <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:600, color:"#111827" }}>Fitur Unggulan Sistem</p>
          <p style={{ margin:"0 0 16px", fontSize:12, color:"#9ca3af" }}>Kemampuan utama platform SIBATAMU-SPP</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:12 }}>
            {features.map((f, i) => (
              <div key={i} className="feat-card fu" style={{ animationDelay:`${300 + i * 50}ms`, background:"#fff", borderRadius:12, padding:"18px 20px", border:"1px solid #e5e7eb" }}>
                <div style={{ fontSize:26, marginBottom:10 }}>{f.icon}</div>
                <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:600, color:"#111827" }}>{f.title}</p>
                <p style={{ margin:0, fontSize:12, color:"#6b7280", lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, sub, accent, subColor, icon }) {
  return (
    <div className="stat-card" style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"18px 20px", display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <p style={{ margin:0, fontSize:12, color:"#6b7280", fontWeight:500 }}>{label}</p>
        <div style={{ width:32, height:32, borderRadius:8, background:"#f9fafb", border:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {icon}
        </div>
      </div>
      <p style={{ margin:0, fontSize:22, fontWeight:700, color:"#111827", letterSpacing:"-0.5px", lineHeight:1 }}>{value}</p>
      {sub && <p style={{ margin:0, fontSize:11, color: subColor || "#9ca3af", fontWeight:500 }}>{sub}</p>}
      <div style={{ height:3, borderRadius:99, background:"#f3f4f6", overflow:"hidden" }}>
        <div style={{ height:"100%", width:"55%", borderRadius:99, background: accent, opacity:0.4 }}/>
      </div>
    </div>
  );
}