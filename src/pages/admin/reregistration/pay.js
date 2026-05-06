import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

export default function PayReRegistration() {
  const [students, setStudents] = useState([])
  const [fees, setFees] = useState([])
  const [studentId, setStudentId] = useState("")
  const [semester, setSemester] = useState("")
  const [method, setMethod] = useState("Transfer")

  useEffect(() => {
    fetch("/api/students").then(res => res.json()).then(setStudents)
    fetch("/api/reregistration/fees").then(res => res.json()).then(setFees)
  }, [])

  async function submitPayment() {
    const semesterFees = fees.filter(f => f.semester == semester)
    const totalAmount = semesterFees.reduce((sum, f) => sum + f.amount, 0)

    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        category: "DAFTAR_ULANG",
        amount: totalAmount,
        method,
      }),
    })

    alert("Pembayaran daftar ulang berhasil dicatat.")
  }

  return (
    <AdminLayout>
      <h2 className="text-lg font-bold mb-4">💳 Pembayaran Daftar Ulang</h2>

      <div className="flex flex-col gap-3 max-w-md">
        <select className="border p-2" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          <option value="">Pilih Santri</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select className="border p-2" value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="">Pilih Semester</option>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select className="border p-2" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option>Transfer</option>
          <option>Cash</option>
        </select>

        <button
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={submitPayment}
        >
          Simpan Pembayaran
        </button>
      </div>
    </AdminLayout>
  )
}
