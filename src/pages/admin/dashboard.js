import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const formatRupiah = (n) => "Rp " + (Number(n) || 0).toLocaleString("id-ID");
const formatRupiahShort = (n) => {
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1) + "jt";
  if (n >= 1_000)     return "Rp " + (n / 1_000).toFixed(0) + "rb";
  return "Rp " + n;
};

function CustomTooltip({ active, payload, label, type }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px 14px", boxShadow:"0 4px 16px rgba(0,0,0,0.08)", fontSize:13 }}>
      <p style={{ margin:"0 0 6px", color:"#6b7280", fontWeight:600, fontSize:11 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin:"2px 0", color: p.color || "#111827", fontWeight:700 }}>
          {p.name}: {type === "santri" ? `${p.value} santri` : formatRupiah(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary]         = useState(null);
  const [keuanganData, setKeuangan]   = useState([]);
  const [santriData, setSantri]       = useState([]);
  const [pengeluaranData, setPengeluaran] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [yearFilter, setYearFilter]   = useState(new Date().getFullYear());

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then(r => r.json())
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

  const totalPengeluaran = summary?.totalPengeluaran || 0;
  const totalPemasukan   = summary?.totalPayments || 0;
  const selisih          = totalPemasukan - totalPengeluaran;
  const isDefisit        = selisih < 0;

  return (
    <AdminLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .dash { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fu { animation: fadeUp 0.4s ease both; }
        .stat-item:hover { background: #f9fafb !important; }
        .chart-card { transition: box-shadow 0.2s; }
        .chart-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.09) !important; }
        .yr-btn {
          padding: 5px 13px; border-radius: 6px; border: 1px solid #e5e7eb;
          background: white; font-size: 12px; font-weight: 500; color: #6b7280;
          cursor: pointer; transition: all .15s; font-family: inherit;
        }
        .yr-btn.on { background: #111827; border-color: #111827; color: white; }
        .yr-btn:hover:not(.on) { border-color: #9ca3af; color: #374151; }
        .prog-bar { height: 4px; border-radius: 99px; background: #f3f4f6; overflow: hidden; margin-top: 8px; }
        .prog-fill { height: 100%; border-radius: 99px; transition: width 0.8s ease; }
      `}</style>

      <div className="dash" style={{ padding:"28px 0", display:"flex", flexDirection:"column", gap:28 }}>

        {/* ── HEADER ── */}
        <div className="fu" style={{ animationDelay:"0ms", display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
          <div>
            <p style={{ margin:"0 0 4px", fontSize:12, fontWeight:600, color:"#9ca3af", letterSpacing:"0.06em", textTransform:"uppercase" }}>Overview</p>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:"#111827", letterSpacing:"-0.4px" }}>Dashboard Admin</h1>
          </div>
          <span style={{ fontSize:12, color:"#6b7280", background:"#f9fafb", border:"1px solid #f3f4f6", borderRadius:8, padding:"6px 12px", fontWeight:500 }}>
            {new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </span>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="fu" style={{ animationDelay:"60ms", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))", gap:1, background:"#e5e7eb", borderRadius:14, overflow:"hidden", border:"1px solid #e5e7eb" }}>
          <StatItem
            label="Pemasukan Bulan Ini"
            value={summary ? formatRupiah(totalPemasukan) : "—"}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            }
            accent="#16a34a"
            sub="Total SPP masuk"
          />
          <StatItem
            label="Pengeluaran Bulan Ini"
            value={summary ? formatRupiah(totalPengeluaran) : "—"}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
            }
            accent="#dc2626"
            sub="Total biaya operasional"
          />
          <StatItem
            label="Saldo Bersih"
            value={summary ? formatRupiah(Math.abs(selisih)) : "—"}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDefisit ? "#d97706":"#2563eb"} strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            }
            accent={isDefisit ? "#d97706" : "#2563eb"}
            sub={isDefisit ? "▼ Defisit bulan ini" : "▲ Surplus bulan ini"}
            subColor={isDefisit ? "#d97706" : "#16a34a"}
          />
          <StatItem
            label="Santri Aktif"
            value={summary ? String(summary.totalSantri) : "—"}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            }
            accent="#7c3aed"
            sub="Terdaftar & aktif"
          />
        </div>

        {/* ── GRAFIK PENGELUARAN ── */}
        <div className="fu chart-card" style={{ animationDelay:"120ms", background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
          <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div>
              <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#111827" }}>Pengeluaran Per Bulan</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#9ca3af" }}>Total pengeluaran madrasah setiap bulan</p>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {yearOptions.map(y => (
                <button key={y} className={`yr-btn ${yearFilter === y ? "on" : ""}`} onClick={() => setYearFilter(y)}>{y}</button>
              ))}
            </div>
          </div>

          {/* mini summary */}
          {!loading && pengeluaranData.length > 0 && (
            <div style={{ display:"flex", gap:24, padding:"16px 24px 0", flexWrap:"wrap" }}>
              {[
                { label:"Total Setahun", val: formatRupiah(pengeluaranData.reduce((a,b)=>a+(b.pengeluaran||0),0)), color:"#dc2626" },
                { label:"Bulan Tertinggi", val: pengeluaranData.reduce((a,b)=>(b.pengeluaran||0)>(a.pengeluaran||0)?b:a,{}).bulan||"—", color:"#7c3aed" },
                { label:"Rata-rata/Bulan", val: formatRupiah(Math.round(pengeluaranData.reduce((a,b)=>a+(b.pengeluaran||0),0)/(pengeluaranData.filter(d=>d.pengeluaran>0).length||1))), color:"#2563eb" },
              ].map((item,i) => (
                <div key={i}>
                  <p style={{ margin:0, fontSize:11, color:"#9ca3af", fontWeight:500 }}>{item.label}</p>
                  <p style={{ margin:"2px 0 0", fontSize:14, fontWeight:700, color:item.color }}>{item.val}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding:"16px 12px 16px" }}>
            {loading ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:"#d1d5db", fontSize:13 }}>Memuat data...</div>
            ) : pengeluaranData.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px 0", color:"#d1d5db", fontSize:13 }}>Belum ada data pengeluaran {yearFilter}</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={pengeluaranData} margin={{ top:8, right:16, left:8, bottom:0 }}>
                  <defs>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.12}/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                  <XAxis dataKey="bulan" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke:"#f3f4f6", strokeWidth:1 }}/>
                  <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#ef4444" strokeWidth={2} fill="url(#gExp)" dot={{ r:3, fill:"#ef4444", strokeWidth:0 }} activeDot={{ r:5, strokeWidth:0 }}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── GRAFIK PEMASUKAN VS PENGELUARAN ── */}
        {keuanganData.length > 0 && (
          <div className="fu chart-card" style={{ animationDelay:"160ms", background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
            <div style={{ padding:"20px 24px 0" }}>
              <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#111827" }}>Pemasukan vs Pengeluaran</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#9ca3af" }}>Perbandingan arus keuangan per semester</p>
            </div>
            <div style={{ padding:"16px 12px 16px" }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={keuanganData} margin={{ top:8, right:16, left:8, bottom:0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                  <XAxis dataKey="semester" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={72}/>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:"#f9fafb" }}/>
                  <Legend formatter={v => <span style={{ fontSize:11, color:"#6b7280" }}>{v}</span>}/>
                  <Bar dataKey="pemasukan"   name="Pemasukan"   fill="#111827" radius={[4,4,0,0]} maxBarSize={32}/>
                  <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#e5e7eb" radius={[4,4,0,0]} maxBarSize={32}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── 2 KOLOM: Pemasukan + Santri ── */}
        <div className="fu" style={{ animationDelay:"200ms", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

          {/* Pemasukan per semester */}
          <div className="chart-card" style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
            <div style={{ padding:"20px 24px 0" }}>
              <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#111827" }}>Pemasukan Per Semester</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#9ca3af" }}>Tren total SPP masuk</p>
            </div>
            <div style={{ padding:"12px 12px 16px" }}>
              {loading ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:"#d1d5db", fontSize:12 }}>Memuat...</div>
              ) : keuanganData.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:"#d1d5db", fontSize:12 }}>Belum ada data</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={keuanganData} margin={{ top:8, right:8, left:4, bottom:0 }}>
                    <defs>
                      <linearGradient id="gKeu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#111827" stopOpacity={0.08}/>
                        <stop offset="100%" stopColor="#111827" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                    <XAxis dataKey="semester" tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={64}/>
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke:"#f3f4f6" }}/>
                    <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#111827" strokeWidth={2} fill="url(#gKeu)" dot={{ r:3, fill:"#111827", strokeWidth:0 }} activeDot={{ r:4 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Santri per semester */}
          <div className="chart-card" style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", overflow:"hidden" }}>
            <div style={{ padding:"20px 24px 0" }}>
              <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#111827" }}>Santri Per Semester</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#9ca3af" }}>Perkembangan jumlah santri aktif</p>
            </div>
            <div style={{ padding:"12px 12px 16px" }}>
              {loading ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:"#d1d5db", fontSize:12 }}>Memuat...</div>
              ) : santriData.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:"#d1d5db", fontSize:12 }}>Belum ada data</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={santriData} margin={{ top:8, right:8, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                    <XAxis dataKey="semester" tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CustomTooltip type="santri"/>} cursor={{ fill:"#f9fafb" }}/>
                    <Bar dataKey="santri" name="Santri" fill="#111827" radius={[4,4,0,0]} maxBarSize={40}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

function StatItem({ label, value, icon, accent, sub, subColor }) {
  return (
    <div className="stat-item" style={{ background:"#fff", padding:"20px 24px", display:"flex", flexDirection:"column", gap:12, cursor:"default", transition:"background .15s" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <p style={{ margin:0, fontSize:12, color:"#6b7280", fontWeight:500 }}>{label}</p>
        <div style={{ width:30, height:30, borderRadius:8, background:"#f9fafb", border:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {icon}
        </div>
      </div>
      <p style={{ margin:0, fontSize:22, fontWeight:700, color:"#111827", letterSpacing:"-0.5px", lineHeight:1 }}>{value}</p>
      {sub && <p style={{ margin:0, fontSize:11, color: subColor || "#9ca3af", fontWeight:500 }}>{sub}</p>}
      <div className="prog-bar"><div className="prog-fill" style={{ width:"60%", background: accent, opacity:0.35 }}/></div>
    </div>
  );
}