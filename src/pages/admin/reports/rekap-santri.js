import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

export default function RekapSantri() {
  const [academicYears, setAcademicYears] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedYear, setSelectedYear] = useState("")
  const [customYear, setCustomYear] = useState("")
  const [selectedClassId, setSelectedClassId] = useState("")
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetch("/api/students/academic-years")
      .then(r => r.json())
      .then(years => {
        setAcademicYears(years)
        if (years.length > 0) setSelectedYear(years[0])
      })

    fetch("/api/classes/list")
      .then(r => r.json())
      .then(setClasses)
  }, [])

  async function handleSearch() {
    const year = customYear.trim() || selectedYear
    if (!year) return alert("Pilih tahun ajaran")

    setLoading(true)
    setSearched(false)

    try {
      const params = new URLSearchParams()
      params.append("academicYear", year)
      if (selectedClassId) params.append("classId", selectedClassId)

      const res = await fetch(`/api/students/rekap?${params}`)
      const json = await res.json()

      setData(json)
      setSearched(true)
    } catch {
      alert("Gagal mengambil data")
    } finally {
      setLoading(false)
    }
  }

  const activeYear = customYear.trim() || selectedYear

  // ✅ FIX: pakai row.class
  const perKelas = data.reduce((acc, row) => {
    const nama = row.class?.name || "-"
    if (!acc[nama]) acc[nama] = { name: nama, total: 0, L: 0, P: 0 }
    acc[nama].total++
    if (row.student.gender === "L") acc[nama].L++
    else acc[nama].P++
    return acc
  }, {})

  const totalL = data.filter(r => r.student.gender === "L").length
  const totalP = data.filter(r => r.student.gender === "P").length

  return (
    <AdminLayout>
      <h2>Rekap Santri</h2>

      <button onClick={handleSearch}>
        {loading ? "Loading..." : "Tampilkan"}
      </button>

      {searched && (
        <>
          <p>Total: {data.length}</p>
          <p>L: {totalL} | P: {totalP}</p>

          <table border="1">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Kelas</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.student.name}</td>
                  <td>{r.class.name}</td> {/* ✅ FIX */}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </AdminLayout>
  )
}