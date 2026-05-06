import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/components/AdminLayout"

export default function NewBill() {
  const router = useRouter()
  const [students, setStudents] = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [studentId, setStudentId] = useState("")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/students/list").then(r => r.json()).then(setStudents)
    fetch("/api/payment-types").then(r => r.json()).then(setPaymentTypes)
  }, [])

  const toggleItem = (pt) => {
    setItems(prev => {
      const exists = prev.find(i => i.paymentTypeId === pt.id)
      if (exists) return prev.filter(i => i.paymentTypeId !== pt.id)
      return [...prev, { paymentTypeId: pt.id, name: pt.name, amount: pt.amount, dueDate: "" }]
    })
  }

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(i => i.paymentTypeId === id ? { ...i, [field]: value } : i))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!studentId) return alert("Pilih santri dulu")
    if (items.length === 0) return alert("Pilih minimal satu jenis tagihan")

    setLoading(true)
    try {
      const res = await fetch("/api/bills/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, items }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      alert("Tagihan berhasil dibuat!")
      router.push("/admin/payments")
    } catch (err) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatRupiah = (v) => new Intl.NumberFormat("id-ID").format(v)

  return (
    <AdminLayout>
      <style jsx>{`
        .page { padding: 30px; background: #f5f6fa; min-height: 100vh; }
        .card { background: white; border-radius: 12px; padding: 25px; max-width: 600px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        h2 { margin-bottom: 20px; color: #2e6b3e; }
        .field { margin-bottom: 15px; }
        label { display: block; font-size: 13px; color: #555; margin-bottom: 5px; }
        select, input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; font-size: 14px; }
        .pt-item { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; }
        .pt-item input[type=checkbox] { width: auto; }
        .pt-item input[type=number], .pt-item input[type=date] { width: 140px; }
        .pt-name { flex: 1; font-size: 14px; }
        .pt-amount { color: #888; font-size: 13px; width: 100px; }
        .btn { background: #2e6b3e; color: white; padding: 12px; width: 100%; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; margin-top: 10px; font-size: 15px; }
        .btn:disabled { background: #aaa; }
        .btn-back { background: none; border: 1px solid #2e6b3e; color: #2e6b3e; padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-bottom: 15px; }
      `}</style>

      <div className="page">
        <button className="btn-back" onClick={() => router.back()}>← Kembali</button>
        <div className="card">
          <h2>Buat Tagihan Santri</h2>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Pilih Santri</label>
              <select value={studentId} onChange={e => setStudentId(e.target.value)} required>
                <option value="">-- Pilih Santri --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {s.class?.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Pilih Jenis Tagihan</label>
              {paymentTypes.map(pt => {
                const selected = items.find(i => i.paymentTypeId === pt.id)
                return (
                  <div key={pt.id} className="pt-item">
                    <input type="checkbox" checked={!!selected} onChange={() => toggleItem(pt)} />
                    <span className="pt-name">{pt.name}</span>
                    <span className="pt-amount">Rp {formatRupiah(pt.amount)}</span>
                    {selected && (
                      <>
                        <input type="number" placeholder="Nominal"
                          value={selected.amount}
                          onChange={e => updateItem(pt.id, "amount", e.target.value)} />
                        <input type="date" title="Jatuh Tempo"
                          value={selected.dueDate}
                          onChange={e => updateItem(pt.id, "dueDate", e.target.value)} />
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Menyimpan..." : "Buat Tagihan"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}