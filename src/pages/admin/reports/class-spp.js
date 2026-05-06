import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

export default function ClassSPPReport() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState([])

  async function loadReport() {
    const res = await fetch(`/api/reports/class-spp?year=${year}&month=${month}`)
    const json = await res.json()
    setData(json)
  }

  useEffect(() => { loadReport() }, [])

  const bulanNama = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ]

  return (
    <AdminLayout>
      <h2 className="text-lg font-bold mb-4">📘 Laporan SPP per Kelas</h2>

      <div className="flex gap-2 mb-4">
        <select value={month} onChange={e => setMonth(e.target.value)} className="border p-2">
          {bulanNama.map((b, i) => <option key={i} value={i+1}>{b}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)} className="border p-2">
          {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={loadReport} className="bg-blue-500 text-white px-3 py-1 rounded">Tampilkan</button>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-left">Kelas</th>
            <th className="p-2 text-right">Total SPP (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.kelas} className="border-t">
              <td className="p-2">{d.kelas}</td>
              <td className="p-2 text-right">{d.total.toLocaleString()}</td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan="2" className="p-2 text-center">Belum ada data</td></tr>}
        </tbody>
      </table>
    </AdminLayout>
  )
}
