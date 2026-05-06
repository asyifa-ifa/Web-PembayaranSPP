import { useState, useEffect } from "react"
import AdminLayout from "@/components/AdminLayout"

export default function ReportsPage() {

  const [activeTab, setActiveTab] = useState("monthly")
  const [data, setData] = useState(null)
  const [santri, setSantri] = useState([])
  const [kelas, setKelas] = useState([])

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [semester, setSemester] = useState(1)
  const [kelasId, setKelasId] = useState("")

  const rp = n => "Rp " + Number(n || 0).toLocaleString("id-ID")

  // ================= FETCH =================
  const fetchReport = async () => {
    let url = ""

    if (activeTab === "monthly") {
      url = `/api/reports/summary?type=monthly&year=${year}&month=${month}`
    }
    if (activeTab === "semester") {
      url = `/api/reports/summary?type=semester&year=${year}&semester=${semester}`
    }
    if (activeTab === "yearly") {
      url = `/api/reports/summary?type=yearly&tahunAjar=${year}/${year+1}`
    }
    if (activeTab === "kelas") {
      url = `/api/reports/summary?type=kelas&year=${year}&month=${month}&kelasId=${kelasId}`
    }

    const res = await fetch(url)
    const json = await res.json()
    setData(json)
  }

  const fetchSantri = async () => {
    const res = await fetch(`/api/students/list${kelasId ? `?kelasId=${kelasId}` : ""}`)
    const json = await res.json()
    setSantri(json)
  }

  const fetchKelas = async () => {
    const res = await fetch(`/api/classes`)
    const json = await res.json()
    setKelas(json)
  }

  useEffect(() => {
    fetchKelas()
  }, [])

  useEffect(() => {
    if (activeTab === "santri") fetchSantri()
    else fetchReport()
  }, [activeTab, year, month, semester, kelasId])

  // ================= UI =================
  return (
    <AdminLayout>
      <div className="container">

        <h1 className="title">📊 Dashboard Laporan</h1>
        <p className="subtitle">Rekapan pembayaran & data santri</p>

        {/* TAB */}
        <div className="tabs">
          <button onClick={() => setActiveTab("monthly")}>Bulanan</button>
          <button onClick={() => setActiveTab("semester")}>Semester</button>
          <button onClick={() => setActiveTab("yearly")}>Tahunan</button>
          <button onClick={() => setActiveTab("kelas")}>Per Kelas</button>
          <button onClick={() => setActiveTab("santri")}>Data Santri</button>
        </div>

        {/* FILTER */}
        <div className="filter">

          {(activeTab !== "santri") && (
            <>
              <select value={year} onChange={e => setYear(e.target.value)}>
                {[2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
              </select>
            </>
          )}

          {(activeTab === "monthly" || activeTab === "kelas") && (
            <select value={month} onChange={e => setMonth(e.target.value)}>
              {[...Array(12)].map((_,i)=>(
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
          )}

          {activeTab === "semester" && (
            <select value={semester} onChange={e => setSemester(e.target.value)}>
              <option value={1}>Ganjil</option>
              <option value={2}>Genap</option>
            </select>
          )}

          {(activeTab === "kelas" || activeTab === "santri") && (
            <select value={kelasId} onChange={e => setKelasId(e.target.value)}>
              <option value="">Semua Kelas</option>
              {kelas.map(k => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          )}

          <button onClick={activeTab === "santri" ? fetchSantri : fetchReport}>
            Tampilkan
          </button>

          {activeTab === "santri" && (
            <button onClick={() => window.print()} className="print">
              🖨️ Cetak
            </button>
          )}
        </div>

        {/* ================= LAPORAN PEMBAYARAN ================= */}
        {activeTab !== "santri" && data && (
          <>
            <div className="cards">
              <div className="card">
                <p>Total</p>
                <h2>{rp(data.totalAll)}</h2>
              </div>

              <div className="card">
                <p>Transaksi</p>
                <h2>{data.totals?.reduce((s,t)=>s+(t.count||0),0)}</h2>
              </div>

              <div className="card">
                <p>Santri</p>
                <h2>{data.jumlahSantri}</h2>
              </div>
            </div>

            <div className="table-box">
              <h3>Rincian Pembayaran</h3>
              <table>
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Transaksi</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.totals?.map((t,i)=>(
                    <tr key={i}>
                      <td>{t.category}</td>
                      <td>{t.count}</td>
                      <td>{rp(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ================= DATA SANTRI ================= */}
        {activeTab === "santri" && (
          <>
            <div className="print-header">
              <h2>DAFTAR ABSENSI SANTRI</h2>
              <p>{new Date().toLocaleDateString("id-ID")}</p>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Kelas</th>
                  <th>S</th>
                  <th>I</th>
                  <th>A</th>
                  <th>TTD</th>
                </tr>
              </thead>

              <tbody>
                {santri.map((s,i)=>(
                  <tr key={s.id}>
                    <td>{i+1}</td>
                    <td>{s.name}</td>
                    <td>{s.class?.name}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

      </div>

      {/* ================= CSS ================= */}
      <style jsx>{`
        .container {
          padding: 30px;
          background: #f4f6f9;
        }

        .title {
          font-size: 26px;
          font-weight: bold;
        }

        .subtitle {
          color: #666;
          margin-bottom: 20px;
        }

        .tabs button {
          margin-right: 8px;
          padding: 8px 12px;
          border: none;
          background: #ddd;
          cursor: pointer;
        }

        .filter {
          margin: 20px 0;
          display: flex;
          gap: 10px;
        }

        select, button {
          padding: 8px;
        }

        .print {
          background: green;
          color: white;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 15px;
        }

        .card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .table-box {
          margin-top: 20px;
          background: white;
          padding: 20px;
          border-radius: 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }

        .table td:nth-child(4),
        .table td:nth-child(5),
        .table td:nth-child(6),
        .table td:nth-child(7) {
          border: 1px solid black;
          height: 30px;
        }

        .print-header {
          display: none;
          text-align: center;
        }

        @media print {
          .tabs, .filter, .title, .subtitle {
            display: none;
          }

          .print-header {
            display: block;
          }
        }
      `}</style>

    </AdminLayout>
  )
}