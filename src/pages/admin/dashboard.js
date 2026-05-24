import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

// PALET WARNA (Soft Green, Cream, White, Black Accents)
const COLORS = {
  bgPage: "#FDFBF7",      // Cream lembut untuk background dasar
  card: "#FFFFFF",        // Putih bersih untuk kontainer kartu
  border: "#EFEBE4",      // Border cream gelap tipis
  textBlack: "#1A1C1A",   // Hitam arang (tidak kaku)
  textMuted: "#8C928C",   // Abu-abu kehijauan redup
  greenSoft: "#5F8567",   // Hijau Sage / Soft Green Utama
  greenLight: "#EBF1EC",  // Hijau sangat muda untuk bg-icon
  creamAccent: "#D9C3A0", // Aksen cream emas redup
};

// ICON SVG PROFESIONAL UNTUK FITUR UNGGULAN
const features = [
  { 
    title: "Pembayaran Digital",   
    desc: "Catat & kelola pembayaran SPP santri secara digital, cepat, dan akurat.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.greenSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    )
  },
  { 
    title: "Laporan Real-time",    
    desc: "Pantau laporan keuangan terkini kapan saja tanpa perlu rekap manual.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.greenSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )
  },
  { 
    title: "Notifikasi Email",     
    desc: "Kirim notifikasi tagihan & konfirmasi pembayaran otomatis ke wali santri.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.greenSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    )
  },
  { 
    title: "Keamanan Terjamin",    
    desc: "Data santri dan keuangan terlindungi dengan sistem autentikasi berlapis.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.greenSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    )
  },
  { 
    title: "Cetak Kwitansi",       
    desc: "Cetak atau unduh kwitansi pembayaran resmi dalam hitungan detik.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.greenSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    )
  },
  { 
    title: "Analisis Keuangan",    
    desc: "Visualisasi tren pemasukan per semester untuk pengambilan keputusan.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.greenSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    )
  },
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

function TooltipPengeluaran({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltip.box}>
      <p style={tooltip.label}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ ...tooltip.val, color: p.color === "#ef4444" ? COLORS.creamAccent : p.color, margin: "4px 0 0", fontSize: 13 }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  );
}

const tooltip = {
  box:   { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 16px", boxShadow: "0 4px 20px rgba(95,133,103,0.08)" },
  label: { margin: 0, fontSize: 12, color: COLORS.textMuted, fontWeight: 600 },
  val:   { margin: "4px 0 0", fontSize: 15, color: COLORS.textBlack, fontWeight: 700 },
};

export default function Dashboard() {
  const [summary, setSummary]             = useState(null);
  const [keuanganData, setKeuangan]       = useState([]);
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
        .dash-root { font-family: 'Inter', sans-serif; background-color: ${COLORS.bgPage}; min-height: 100vh; padding: 24px; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fu { animation: fadeUp 0.4s cubic-bezier(.16,1,0.3,1) both; }
        .stat-card { transition: all 0.25s ease; border: 1px solid ${COLORS.border} !important; background: ${COLORS.card} !important; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(95,133,103,0.06) !important; border-color: ${COLORS.greenSoft} !important; }
        .chart-card { transition: all 0.2s; border: 1px solid ${COLORS.border} !important; background: ${COLORS.card} !important; }
        .chart-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.03) !important; }
        .feat-card { transition: all 0.2s; border: 1px solid ${COLORS.border} !important; background: ${COLORS.card} !important; }
        .feat-card:hover { transform: translateY(-2px); border-color: ${COLORS.greenSoft} !important; }
        .year-btn {
          padding: 6px 14px; border-radius: 8px;
          border: 1px solid ${COLORS.border}; background: ${COLORS.card};
          font-size: 12px; font-weight: 500; color: ${COLORS.textMuted};
          cursor: pointer; transition: all .2s; font-family: inherit;
        }
        .year-btn.active { background: ${COLORS.textBlack}; border-color: ${COLORS.textBlack}; color: white; }
        .year-btn:hover:not(.active) { border-color: ${COLORS.greenSoft}; color: ${COLORS.greenSoft}; }
      `}</style>

      <div className="dash-root" style={{ display:"flex", flexDirection:"column", gap:24 }}>

        {/* ── HEADER ── */}
        <div className="fu" style={{ animationDelay:"0ms", display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
          <div>
            <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:600, color: COLORS.greenSoft, letterSpacing:"0.08em", textTransform:"uppercase" }}>Overview</p>
            <h1 style={{ margin:0, fontSize:24, fontWeight:700, color: COLORS.textBlack, letterSpacing:"-0.5px" }}>Dashboard Admin</h1>
            <p style={{ margin:"4px 0 0", fontSize:13, color: COLORS.textMuted }}>Ringkasan data SIBATAMU-SPP hari ini</p>
          </div>
          <span style={{ fontSize:12, color: COLORS.textBlack, background: COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:8, padding:"8px 16px", fontWeight:500, boxShadow:"0 2px 8px rgba(0,0,0,0.02)" }}>
            {new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </span>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="fu" style={{ animationDelay:"60ms", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:16 }}>
          <StatCard
            label="Pemasukan Bulan Ini"
            value={summary ? formatRupiah(summary.totalPayments) : "Memuat..."}
            sub="Total SPP masuk"
            accent={COLORS.greenSoft}
            iconColor={COLORS.greenSoft}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            }
          />
          <StatCard
            label="Pengeluaran Bulan Ini"
            value={summary ? formatRupiah(totalPengeluaranBulanIni) : "Memuat..."}
            sub="Total biaya operasional"
            accent={COLORS.creamAccent}
            iconColor={COLORS.creamAccent}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            }
          />
          <StatCard
            label="Saldo Bersih"
            value={summary ? formatRupiah(Math.abs(selisih)) : "Memuat..."}
            sub={selisih >= 0 ? "▲ Surplus Keuangan" : "▼ Defisit Keuangan"}
            accent={COLORS.textBlack}
            iconColor={COLORS.textBlack}
            subColor={selisih >= 0 ? COLORS.greenSoft : COLORS.creamAccent}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            }
          />
          <StatCard
            label="Jumlah Santri Aktif"
            value={summary ? summary.totalSantri : "Memuat..."}
            sub="Terdaftar & aktif"
            accent={COLORS.greenSoft}
            iconColor={COLORS.greenSoft}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            }
          />
        </div>

        {/* ── GRAFIK 1: TOTAL PENGELUARAN PER BULAN (AREA CHART Full Width) ── */}
        <div className="fu chart-card" style={{ borderRadius:16, padding:"24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
            <div>
              <p style={{ margin:0, fontSize:15, fontWeight:600, color: COLORS.textBlack }}>Grafik Total Pengeluaran Per Bulan</p>
              <p style={{ margin:"3px 0 0", fontSize:12, color: COLORS.textMuted }}>Total pengeluaran madrasah setiap bulan dalam setahun</p>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {yearOptions.map(y => (
                <button key={y} className={`year-btn ${yearFilter === y ? "active" : ""}`} onClick={() => setYearFilter(y)}>{y}</button>
              ))}
            </div>
          </div>

          {loadingGrafik ? (
            <div style={{ textAlign:"center", padding:"48px 0", color: COLORS.textMuted, fontSize:13 }}>⏳ Memuat data...</div>
          ) : pengeluaranData.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 0", color: COLORS.textMuted, fontSize:13 }}>📭 Belum ada data pengeluaran di tahun {yearFilter}</div>
          ) : (
            <>
              <div style={{ display:"flex", gap:32, marginBottom:20, borderBottom:`1px solid ${COLORS.border}`, paddingBottom:14, flexWrap:"wrap" }}>
                {[
                  { label:"Total Pengeluaran Setahun", val: formatRupiah(pengeluaranData.reduce((a,b)=>a+(b.pengeluaran||0),0)), color: COLORS.textBlack },
                  { label:"Bulan Pengeluaran Tertinggi", val: pengeluaranData.reduce((a,b)=>(b.pengeluaran||0)>(a.pengeluaran||0)?b:a,{}).bulan||"—", color: COLORS.greenSoft },
                  { label:"Rata-rata / Bulan", val: formatRupiah(Math.round(pengeluaranData.reduce((a,b)=>a+(b.pengeluaran||0),0)/(pengeluaranData.filter(d=>d.pengeluaran>0).length||1))), color: COLORS.textMuted },
                ].map((item,i) => (
                  <div key={i}>
                    <p style={{ margin:0, fontSize:11, color: COLORS.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</p>
                    <p style={{ margin:"4px 0 0", fontSize:16, fontWeight:700, color:item.color }}>{item.val}</p>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={pengeluaranData} margin={{ top:8, right:16, left:8, bottom:0 }}>
                  <defs>
                    <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.creamAccent} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={COLORS.creamAccent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#F1EDE7" vertical={false}/>
                  <XAxis dataKey="bulan" tick={{ fontSize:11, fill: COLORS.textMuted }} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} width={76}/>
                  <Tooltip content={<TooltipPengeluaran />} cursor={{ stroke: COLORS.border, strokeWidth:1 }}/>
                  <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke={COLORS.creamAccent} strokeWidth={2.5} fill="url(#gradExp)" dot={{ r:4, fill: COLORS.creamAccent, strokeWidth:0 }} activeDot={{ r:6, strokeWidth:0 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* ── GRAFIK 2: TOTAL PEMASUKAN VS PENGELUARAN (BAR & AREA SPLIT) ── */}
        <div className="fu style-2-columns" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
          
          {/* Sisi Kiri: Perbandingan Bar */}
          <div className="chart-card" style={{ borderRadius:16, padding:"24px" }}>
            <div style={{ marginBottom:20 }}>
              <p style={{ margin:0, fontSize:15, fontWeight:600, color: COLORS.textBlack }}>Perbandingan Arus Keuangan</p>
              <p style={{ margin:"3px 0 0", fontSize:12, color: COLORS.textMuted }}>Komparasi pemasukan dan pengeluaran madrasah per semester</p>
            </div>
            {keuanganData.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0", color: COLORS.textMuted, fontSize:12 }}>📭 Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={keuanganData} margin={{ top:8, right:16, left:8, bottom:0 }} barGap={6}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#F1EDE7" vertical={false}/>
                  <XAxis dataKey="semester" tick={{ fontSize:11, fill: COLORS.textMuted }} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} width={76}/>
                  <Tooltip content={<TooltipPengeluaran />} cursor={{ fill: COLORS.bgPage }}/>
                  <Legend formatter={v => <span style={{ fontSize:12, color: COLORS.textBlack, fontWeight: 500 }}>{v}</span>}/>
                  <Bar dataKey="pemasukan"   name="Pemasukan"   fill={COLORS.greenSoft} radius={[6,6,0,0]} maxBarSize={32} />
                  <Bar dataKey="pengeluaran" name="Pengeluaran" fill={COLORS.creamAccent} radius={[6,6,0,0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sisi Kanan: Tren Pemasukan Area */}
          <div className="chart-card" style={{ borderRadius:16, padding:"24px" }}>
            <p style={{ margin:"0 0 2px", fontSize:15, fontWeight:600, color: COLORS.textBlack }}>Grafik Total Pemasukan</p>
            <p style={{ margin:"0 0 20px", fontSize:12, color: COLORS.textMuted }}>Tren total keseluruhan pemasukan dana SPP per semester</p>
            {loadingGrafik || keuanganData.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0", color: COLORS.textMuted, fontSize:12 }}>📭 Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={keuanganData} margin={{ top:8, right:8, left:4, bottom:0 }}>
                  <defs>
                    <linearGradient id="gradKeu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.greenSoft} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={COLORS.greenSoft} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1EDE7" vertical={false}/>
                  <XAxis dataKey="semester" tick={{ fontSize:11, fill: COLORS.textMuted }} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} width={68}/>
                  <Tooltip content={<TooltipKeuangan />} cursor={{ stroke: COLORS.border }}/>
                  <Area type="monotone" dataKey="pemasukan" stroke={COLORS.greenSoft} strokeWidth={2.5} fill="url(#gradKeu)" dot={{ r:4, fill: COLORS.greenSoft, strokeWidth:0 }} activeDot={{ r:5 }}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── FITUR UNGGULAN (DENGAN ICON SVG OUTLINE) ── */}
        <div className="fu" style={{ animationDelay:"260ms", marginTop: 8 }}>
          <p style={{ margin:"0 0 2px", fontSize:15, fontWeight:600, color: COLORS.textBlack }}>Fitur Utama Sistem</p>
          <p style={{ margin:"0 0 20px", fontSize:12, color: COLORS.textMuted }}>Kemampuan utama platform SIBATAMU-SPP</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:16 }}>
            {features.map((f, i) => (
              <div key={i} className="feat-card fu" style={{ animationDelay:`${300 + i * 40}ms`, borderRadius:14, padding:"20px", display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:10, backgroundColor: COLORS.greenLight, display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:600, color: COLORS.textBlack }}>{f.title}</p>
                  <p style={{ margin:0, fontSize:12, color: COLORS.textMuted, lineHeight:1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, sub, accent, iconColor, subColor, icon }) {
  return (
    <div className="stat-card" style={{ borderRadius:14, padding:"20px", display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start" }}>
        <p style={{ margin:0, fontSize:13, color: COLORS.textMuted, fontWeight:500 }}>{label}</p>
        <div style={{ width:36, height:36, borderRadius:10, background: COLORS.bgPage, border:`1px solid ${COLORS.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color: iconColor }}>
          {icon}
        </div>
      </div>
      <div>
        <p style={{ margin:0, fontSize:24, fontWeight:700, color: COLORS.textBlack, letterSpacing:"-0.5px", lineHeight:1 }}>{value}</p>
        {sub && <p style={{ margin:"6px 0 0", fontSize:12, color: subColor || COLORS.textMuted, fontWeight:600 }}>{sub}</p>}
      </div>
      <div style={{ height:4, borderRadius:99, background: COLORS.bgPage, overflow:"hidden", marginTop:4 }}>
        <div style={{ height:"100%", width:"100%", borderRadius:99, background: accent, opacity: 0.7 }}/>
      </div>
    </div>
  );
}