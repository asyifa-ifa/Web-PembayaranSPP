// pages/kepala/laporan/pengeluaran.js
import { useEffect, useState } from "react"
import KepalaLayout from "@/components/KepalaLayout"

export default function LaporanPengeluaran() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan]     = useState(new Date().getMonth() + 1)
  const [tahun, setTahun]     = useState(new Date().getFullYear())
  const [search, setSearch]   = useState("")

  useEffect(() => {
    setLoading(true)

    const params = new URLSearchParams({
      month: bulan,
      year: tahun
    })

    // ✅ FIX: pakai API kamu sendiri
    fetch(`/api/pengeluaran/list?${params.toString()}`)
      .then(r => r.json())
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))

  }, [bulan, tahun])

  const namaBulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]

  // ✅ search sesuai field DB
  const filtered = data.filter(r => {
    const text = (r.title || r.note || "").toLowerCase()
    return text.includes(search.toLowerCase())
  })

  const totalKeluar = filtered.reduce((s, r) => s + Number(r.amount || 0), 0)
  const rp = n => "Rp " + Number(n || 0).toLocaleString("id-ID")

  return (
    <KepalaLayout>
      <div className="wrap">
        <div className="page-title">💸 Laporan Pengeluaran</div>

        <div className="toolbar">
          <select value={bulan} onChange={e => setBulan(Number(e.target.value))}>
            {namaBulan.map((n, i) => (
              <option key={i} value={i + 1}>{n}</option>
            ))}
          </select>

          <select value={tahun} onChange={e => setTahun(Number(e.target.value))}>
            {[2026, 2025, 2024, 2023].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <input
            placeholder="Cari..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : filtered.length === 0 ? (
          <div>Tidak ada data</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id}>
                  <td>{i + 1}</td>

                  <td>
                    {row.date
                      ? new Date(row.date).toLocaleDateString("id-ID")
                      : "-"}
                  </td>

                  <td>{row.title}</td>

                  <td style={{ color: "red" }}>
                    {rp(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </KepalaLayout>
  )
}