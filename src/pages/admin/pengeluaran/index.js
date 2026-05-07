// pages/admin/pengeluaran/index.js
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/components/AdminLayout"

export default function PengeluaranList() {
  const router = useRouter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ title: "", amount: "", note: "", date: new Date().toISOString().slice(0, 10) })

  useEffect(() => { loadData() }, [filterMonth, filterYear])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/pengeluaran/list?month=${filterMonth}&year=${filterYear}`)
      const json = await res.json()
      setData(json)
    } catch {}
    finally { setLoading(false) }
  }

  function openNew() {
    setEditItem(null)
    setForm({ title: "", amount: "", note: "", date: new Date().toISOString().slice(0, 10) })
    setShowForm(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({
      title: item.title,
      amount: String(item.amount),
      note: item.note || "",
      date: new Date(item.date).toISOString().slice(0, 10),
    })
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editItem ? `/api/pengeluaran/${editItem.id}` : "/api/pengeluaran/create"
      const method = editItem ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseInt(form.amount) }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      setShowForm(false)
      loadData()
    } catch (e) {
      alert("Error: " + e.message)
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm("Yakin hapus pengeluaran ini?")) return
    try {
      await fetch(`/api/pengeluaran/${id}`, { method: "DELETE" })
      loadData()
    } catch { alert("Gagal menghapus") }
  }

  const rp = n => "Rp " + Number(n || 0).toLocaleString("id-ID")
  const totalBulanIni = data.reduce((s, d) => s + d.amount, 0)

  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]

  return (
    <AdminLayout>
      <style jsx>{`
        .page-wrapper { padding: 8px 0 40px; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .page-header h2 { font-size: 20px; font-weight: 700; color: #1a3d28; margin: 0 0 4px; }
        .page-header span { font-size: 13px; color: #7a9a85; }

        .btn-add { background: #3a8f50; color: white; padding: 9px 18px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: 0.2s; white-space: nowrap; }
        .btn-add:hover { background: #2e7340; }

        .filter-row { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
        .filter-select { border: 1.5px solid #dde5e0; border-radius: 8px; padding: 8px 30px 8px 12px; font-size: 13.5px; color: #1a3d28; background: #fafcfb; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7a66' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; cursor: pointer; font-family: inherit; }

        /* SUMMARY */
        .summary-card { background: linear-gradient(135deg, #1a3d28, #3a8f50); border-radius: 16px; padding: 20px 24px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
        .summary-label { font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 600; margin-bottom: 4px; }
        .summary-val { font-size: 24px; font-weight: 800; color: #fff; }
        .summary-sub { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; }
        .summary-icon { font-size: 40px; opacity: 0.6; }

        /* TABLE */
        .table-card { background: #fff; border: 1px solid #e4e9e6; border-radius: 14px; overflow: hidden; }
        .table-card-header { background: #f7faf8; border-bottom: 1.5px solid #e4e9e6; padding: 13px 20px; display: flex; align-items: center; gap: 8px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a8f50; }
        .table-card-header span { font-size: 12px; font-weight: 700; color: #3a8f50; text-transform: uppercase; letter-spacing: 0.5px; }
        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 600px; }
        th { padding: 11px 14px; font-size: 11px; font-weight: 700; color: #5a7a66; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; white-space: nowrap; }
        td { padding: 12px 14px; font-size: 13.5px; color: #2d4a35; border-bottom: 1px solid #f0f4f1; vertical-align: middle; }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: #f9fcfa; }

        .action-group { display: flex; gap: 6px; }
        .btn-action { padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: 0.15s; border: 1.5px solid transparent; font-family: inherit; }
        .btn-edit { background: #fff8e6; color: #b07800; border-color: #e6d08a; }
        .btn-edit:hover { background: #fdf0c0; }
        .btn-delete { background: #fff0f0; color: #d32f2f; border-color: #f5bebe; }
        .btn-delete:hover { background: #ffe0e0; }

        .empty-state { text-align: center; padding: 60px 20px; color: #9ab5a3; font-size: 14px; }

        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: #fff; border-radius: 20px; padding: 28px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
        .modal-title { font-size: 18px; font-weight: 700; color: #1a3d28; margin-bottom: 20px; }
        .modal-field { margin-bottom: 14px; }
        .modal-field label { font-size: 12px; font-weight: 600; color: #5a7a66; display: block; margin-bottom: 6px; }
        .modal-field input, .modal-field textarea {
          width: 100%; border: 1.5px solid #dde5e0; border-radius: 8px;
          padding: 10px 12px; font-size: 14px; color: #1a3d28; background: #fafcfb;
          outline: none; font-family: inherit; box-sizing: border-box; transition: 0.2s;
        }
        .modal-field input:focus, .modal-field textarea:focus { border-color: #3a8f50; box-shadow: 0 0 0 3px rgba(58,143,80,0.1); }
        .modal-field textarea { resize: vertical; min-height: 70px; }
        .modal-field input::placeholder, .modal-field textarea::placeholder { color: #b0c4b8; }
        .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
        .btn-save { flex: 1; background: #3a8f50; color: #fff; border: none; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: 0.2s; }
        .btn-save:hover:not(:disabled) { background: #2e7340; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cancel { background: #f5f8f5; color: #5a7a66; border: none; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
      `}</style>

      <div className="page-wrapper">
        <div className="page-header">
          <div>
            <h2>Pengeluaran</h2>
            <span>Catat dan kelola pengeluaran madrasah</span>
          </div>
          <button className="btn-add" onClick={openNew}>+ Tambah Pengeluaran</button>
        </div>

        <div className="filter-row">
          <select className="filter-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="filter-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* SUMMARY */}
        <div className="summary-card">
          <div>
            <div className="summary-label">Total Pengeluaran — {months[filterMonth-1]} {filterYear}</div>
            <div className="summary-val">{rp(totalBulanIni)}</div>
            <div className="summary-sub">{data.length} transaksi</div>
          </div>
          <div className="summary-icon">💸</div>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <div className="table-card-header">
            <div className="dot" />
            <span>Daftar Pengeluaran ({data.length})</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Catatan</th>
                  <th>Jumlah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="empty-state">Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">Tidak ada pengeluaran bulan ini</td></tr>
                ) : data.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td>{new Date(item.date).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}</td>
                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                    <td style={{ color: "#9ab5a3", fontSize: 12 }}>{item.note || "-"}</td>
                    <td style={{ fontWeight: 700, color: "#d32f2f" }}>{rp(item.amount)}</td>
                    <td>
                      <div className="action-group">
                        <button className="btn-action btn-edit" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(item.id)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="modal">
            <div className="modal-title">{editItem ? "Edit Pengeluaran" : "Tambah Pengeluaran"}</div>
            <form onSubmit={handleSubmit}>
              <div className="modal-field">
                <label>Keterangan *</label>
                <input placeholder="contoh: Beli ATK, Bayar listrik" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="modal-field">
                <label>Jumlah (Rp) *</label>
                <input type="number" placeholder="contoh: 150000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min="0" />
              </div>
              <div className="modal-field">
                <label>Tanggal *</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div className="modal-field">
                <label>Catatan</label>
                <textarea placeholder="Keterangan tambahan (opsional)" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn-save" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}