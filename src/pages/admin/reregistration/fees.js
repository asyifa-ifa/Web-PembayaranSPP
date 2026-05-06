import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

export default function FeesPage() {
  const [fees, setFees] = useState([])
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [semester, setSemester] = useState("")

  async function loadFees() {
    const res = await fetch("/api/reregistration/fees")
    const data = await res.json()
    setFees(data)
  }

  async function addFee() {
    await fetch("/api/reregistration/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount, semester }),
    })
    setName("")
    setAmount("")
    setSemester("")
    loadFees()
  }

  useEffect(() => {
    loadFees()
  }, [])

  return (
    <AdminLayout>
      <h2 className="text-lg font-bold mb-4">🧾 Pengaturan Biaya Daftar Ulang</h2>

      <div className="border p-3 rounded mb-4">
        <h3 className="font-semibold mb-2">Tambah Komponen Baru</h3>
        <div className="flex gap-2 mb-2">
          <input
            className="border p-2 flex-1"
            placeholder="Nama (misal Kitab)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border p-2 w-32"
            placeholder="Nominal"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="border p-2 w-24"
            placeholder="Semester"
            type="number"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
          <button
            className="bg-green-500 text-white px-3 py-1 rounded"
            onClick={addFee}
          >
            Tambah
          </button>
        </div>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-left">Nama</th>
            <th className="p-2 text-right">Nominal (Rp)</th>
            <th className="p-2 text-center">Semester</th>
          </tr>
        </thead>
        <tbody>
          {fees.map((f) => (
            <tr key={f.id} className="border-t">
              <td className="p-2">{f.name}</td>
              <td className="p-2 text-right">{f.amount.toLocaleString()}</td>
              <td className="p-2 text-center">{f.semester}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  )
}
