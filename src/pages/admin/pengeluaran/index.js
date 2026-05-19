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
  const [uploadingFile, setUploadingFile] = useState(false)

  // State preview kwitansi
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")

  const [form, setForm] = useState({
    title: "", amount: "", note: "",
    date: new Date().toISOString().slice(0, 10),
    receiptUrl: "",
  })

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
    setForm({ title: "", amount: "", note: "", date: new Date().toISOString().slice(0, 10), receiptUrl: "" })
    setShowForm(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({
      title: item.title,
      amount: String(item.amount),
      note: item.note || "",
      date: new Date(item.date).toISOString().slice(0, 10),
      receiptUrl: item.receiptUrl || "",
    })
    setShowForm(true)
  }

  // ===== UPLOAD KE CLOUDINARY =====
  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi ukuran (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB")
      return
    }

    setUploadingFile(true)
    try {
      const fd = new FormData()
      fd.append("file", file)

      const res = await fetch("/api/upload/receipt", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setForm(p => ({ ...p, receiptUrl: data.url }))
    } catch (e) {
      alert("Upload gagal: " + e.message)
    } finally {
      setUploadingFile(false)
      // Reset input file supaya bisa upload ulang file yang sama
      e.target.value = ""
    }
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
        body: JSON.stringify({
          ...form,
          amount: parseInt(form.amount),
          receiptUrl: form.receiptUrl || null,
        }),
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
  const avgPerTransaksi = data.length ? Math.round(totalBulanIni / data.length) : 0
  const maxItem = data.length ? data.reduce((a, b) => a.amount > b.amount ? a : b) : null
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]

  const formatAmount = (v) => {
    const raw = String(v).replace(/\D/g, "")
    return raw ? Number(raw).toLocaleString("id-ID") : ""
  }

  const categoryColor = (title) => {
    const t = title?.toLowerCase() || ""
    if (t.includes("listrik") || t.includes("air") || t.includes("internet")) return { bg: "#ede9fe", color: "#6d28d9" }
    if (t.includes("atk") || t.includes("alat") || t.includes("kertas")) return { bg: "#fef3c7", color: "#92400e" }
    if (t.includes("makan") || t.includes("konsumsi") || t.includes("dapur")) return { bg: "#dcfce7", color: "#15803d" }
    if (t.includes("gaji") || t.includes("honor")) return { bg: "#dbeafe", color: "#1d4ed8" }
    return { bg: "#f1f5f9", color: "#475569" }
  }

  const isPdf = (url) => url?.toLowerCase().includes(".pdf") || url?.toLowerCase().includes("/raw/")

  return (
    <AdminLayout>
      <div className="page-wrapper">

        {/* HEADER */}
        <div className="page-header">
          <div className="header-left">
            <div>
              <h1 className="page-title">Pengeluaran</h1>
              <p className="page-subtitle">Catat dan kelola pengeluaran madrasah</p>
            </div>
          </div>
          <button className="btn-add" onClick={openNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Pengeluaran
          </button>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">💸</div>
            <div>
              <div className="stat-value">{rp(totalBulanIni)}</div>
              <div className="stat-label">Total Bulan Ini</div>
            </div>
          </div>
          <div className="stat-card stat-count">
            <div className="stat-icon">📋</div>
            <div>
              <div className="stat-value">{data.length}</div>
              <div className="stat-label">Transaksi</div>
            </div>
          </div>
          <div className="stat-card stat-avg">
            <div className="stat-icon">📊</div>
            <div>
              <div className="stat-value">{rp(avgPerTransaksi)}</div>
              <div className="stat-label">Rata-rata / Transaksi</div>
            </div>
          </div>
          <div className="stat-card stat-max">
            <div className="stat-icon">⬆️</div>
            <div>
              <div className="stat-value">{maxItem ? rp(maxItem.amount) : "—"}</div>
              <div className="stat-label">Pengeluaran Terbesar</div>
            </div>
          </div>
        </div>

        {/* FILTER */}
        <div className="filter-bar">
          <div className="filter-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filter:
          </div>
          <select className="filter-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="filter-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="filter-result">{months[filterMonth-1]} {filterYear}</div>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <div className="table-card-header">
            <div className="header-dot" />
            <span className="table-card-title">Daftar Pengeluaran</span>
            <span className="table-card-count">{data.length} item</span>
          </div>

          {loading ? (
            <div className="state-box"><div className="spinner" /><p>Memuat data...</p></div>
          ) : data.length === 0 ? (
            <div className="state-box">
              <div className="empty-icon">📭</div>
              <p>Tidak ada pengeluaran di bulan ini</p>
              <button className="btn-add-inline" onClick={openNew}>+ Tambah sekarang</button>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Catatan</th>
                    <th>Kwitansi</th>
                    <th>Jumlah</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, i) => {
                    const cat = categoryColor(item.title)
                    return (
                      <tr key={item.id} className="table-row">
                        <td className="td-no">{i + 1}</td>
                        <td className="td-date">
                          <div className="date-block">
                            <div className="date-day">{new Date(item.date).toLocaleDateString("id-ID", { day: "numeric" })}</div>
                            <div className="date-mon">{new Date(item.date).toLocaleDateString("id-ID", { month: "short", year: "2-digit" })}</div>
                          </div>
                        </td>
                        <td>
                          <span className="cat-badge" style={{ background: cat.bg, color: cat.color }}>{item.title}</span>
                        </td>
                        <td className="td-note">{item.note || <span className="no-note">—</span>}</td>

                        {/* KOLOM KWITANSI */}
                        <td>
                          {item.receiptUrl ? (
                            <button
                              className="receipt-thumb-btn"
                              onClick={() => { setPreviewUrl(item.receiptUrl); setShowReceiptModal(true) }}
                            >
                              {isPdf(item.receiptUrl) ? (
                                <span className="receipt-pdf-icon">📄 PDF</span>
                              ) : (
                                <img
                                  src={item.receiptUrl}
                                  alt="kwitansi"
                                  className="receipt-thumb"
                                />
                              )}
                            </button>
                          ) : (
                            <span className="no-receipt">—</span>
                          )}
                        </td>

                        <td className="td-amount">{rp(item.amount)}</td>
                        <td>
                          <div className="action-group">
                            <button className="action-btn edit" onClick={() => openEdit(item)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </button>
                            <button className="action-btn danger" onClick={() => handleDelete(item.id)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data.length > 0 && (
            <div className="table-footer">
              <span>Total: <strong>{rp(totalBulanIni)}</strong></span>
              <span>{data.length} transaksi di {months[filterMonth-1]} {filterYear}</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL FORM ===== */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-icon-wrap">{editItem ? "✏️" : "➕"}</div>
              <div>
                <div className="modal-title">{editItem ? "Edit Pengeluaran" : "Tambah Pengeluaran"}</div>
                <div className="modal-subtitle">{editItem ? "Ubah data pengeluaran" : "Catat pengeluaran baru"}</div>
              </div>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              {/* Keterangan */}
              <div className="modal-field">
                <label className="field-label">Keterangan <span className="required">*</span></label>
                <input className="field-input" placeholder="contoh: Beli ATK, Bayar listrik..."
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>

              {/* Jumlah + Tanggal */}
              <div className="modal-row">
                <div className="modal-field">
                  <label className="field-label">Jumlah (Rp) <span className="required">*</span></label>
                  <div className="amount-wrap">
                    <span className="amount-prefix">Rp</span>
                    <input className="field-input amount-input" type="text" inputMode="numeric"
                      placeholder="0" value={form.amount ? formatAmount(form.amount) : ""}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value.replace(/\D/g, "") }))} required />
                  </div>
                </div>
                <div className="modal-field">
                  <label className="field-label">Tanggal <span className="required">*</span></label>
                  <input className="field-input" type="date" value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
              </div>

              {/* Catatan */}
              <div className="modal-field">
                <label className="field-label">Catatan <span className="optional-tag">opsional</span></label>
                <textarea className="field-textarea" placeholder="Keterangan tambahan..."
                  value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
              </div>

              {/* ===== UPLOAD KWITANSI ===== */}
              <div className="modal-field">
                <label className="field-label">
                  Bukti / Kwitansi
                  <span className="optional-tag">opsional · maks 5MB</span>
                </label>

                {form.receiptUrl ? (
                  /* Preview setelah upload */
                  <div className="receipt-preview-wrap">
                    {isPdf(form.receiptUrl) ? (
                      <a href={form.receiptUrl} target="_blank" rel="noreferrer" className="receipt-pdf-link">
                        <span>📄</span>
                        <span>Lihat PDF Kwitansi</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    ) : (
                      <img src={form.receiptUrl} alt="Kwitansi" className="receipt-preview-img" />
                    )}
                    <div className="receipt-actions">
                      <span className="receipt-success">✅ Upload berhasil</span>
                      <button type="button" className="receipt-remove-btn"
                        onClick={() => setForm(p => ({ ...p, receiptUrl: "" }))}>
                        🗑 Hapus & Upload Ulang
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Area upload */
                  <label className={`upload-area ${uploadingFile ? "uploading" : ""}`}>
                    {uploadingFile ? (
                      <div className="upload-loading">
                        <span className="upload-spinner" />
                        <span>Mengupload ke Cloudinary...</span>
                      </div>
                    ) : (
                      <div className="upload-idle">
                        <div className="upload-icon">☁️</div>
                        <div className="upload-text">
                          <span className="upload-main">Klik untuk upload kwitansi</span>
                          <span className="upload-sub">JPG, PNG, PDF · Maks 5MB</span>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn-save" disabled={saving || uploadingFile}>
                  {saving ? (
                    <><span className="btn-spinner" /> Menyimpan...</>
                  ) : (
                    <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Simpan</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL PREVIEW KWITANSI ===== */}
      {showReceiptModal && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="receipt-modal-box" onClick={e => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <span>🧾 Bukti Kwitansi</span>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={previewUrl} target="_blank" rel="noreferrer" className="receipt-open-btn">
                  Buka di tab baru ↗
                </a>
                <button className="modal-close" onClick={() => setShowReceiptModal(false)}>✕</button>
              </div>
            </div>
            <div className="receipt-modal-body">
              {isPdf(previewUrl) ? (
                <iframe src={previewUrl} className="receipt-iframe" title="Kwitansi PDF" />
              ) : (
                <img src={previewUrl} alt="Kwitansi" className="receipt-full-img" />
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-wrapper { padding: 24px; max-width: 1100px; margin: 0 auto; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; }

        /* HEADER */
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .header-left { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .btn-back { display: inline-flex; align-items: center; gap: 6px; background: white; border: 1.5px solid #e2e8f0; color: #475569; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .18s; white-space: nowrap; }
        .btn-back:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
        .page-title { margin: 0; font-size: clamp(18px, 3vw, 24px); font-weight: 700; color: #1e293b; letter-spacing: -.4px; }
        .page-subtitle { margin: 2px 0 0; font-size: 13px; color: #94a3b8; }
        .btn-add { display: inline-flex; align-items: center; gap: 7px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 10px 18px; border-radius: 10px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap; box-shadow: 0 3px 12px rgba(99,102,241,.3); }
        .btn-add:hover { opacity: .9; transform: translateY(-1px); }

        /* STATS */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        .stat-card { background: white; border-radius: 14px; padding: 18px 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1.5px solid #f1f5f9; transition: transform .15s, box-shadow .15s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
        .stat-icon { font-size: 22px; flex-shrink: 0; }
        .stat-value { font-size: 15px; font-weight: 700; color: #1e293b; line-height: 1.2; }
        .stat-label { font-size: 11px; color: #94a3b8; margin-top: 3px; font-weight: 500; }
        .stat-total { border-top: 3px solid #ef4444; }
        .stat-count { border-top: 3px solid #6366f1; }
        .stat-avg { border-top: 3px solid #f59e0b; }
        .stat-max { border-top: 3px solid #22c55e; }

        /* FILTER */
        .filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
        .filter-label { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 500; color: #64748b; }
        .filter-select { padding: 9px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; color: #475569; background: white; outline: none; cursor: pointer; transition: border-color .15s; }
        .filter-select:focus { border-color: #6366f1; }
        .filter-result { margin-left: auto; font-size: 13px; font-weight: 600; color: #6366f1; background: #f5f3ff; border: 1.5px solid #ede9fe; padding: 7px 14px; border-radius: 20px; }

        /* TABLE */
        .table-card { background: white; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1.5px solid #f1f5f9; overflow: hidden; }
        .table-card-header { display: flex; align-items: center; gap: 8px; padding: 14px 20px; background: #fafafa; border-bottom: 1.5px solid #f1f5f9; }
        .header-dot { width: 8px; height: 8px; border-radius: 50%; background: #6366f1; flex-shrink: 0; }
        .table-card-title { font-size: 13px; font-weight: 700; color: #1e293b; }
        .table-card-count { margin-left: auto; font-size: 11px; font-weight: 600; background: #ede9fe; color: #6d28d9; padding: 3px 10px; border-radius: 20px; }
        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 650px; }
        th { padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; white-space: nowrap; }
        .table-row { border-bottom: 1px solid #f8fafc; transition: background .12s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: #fafbff; }
        td { padding: 12px 16px; font-size: 13.5px; color: #334155; vertical-align: middle; }
        .td-no { color: #94a3b8; font-size: 12px; width: 40px; }
        .td-date { width: 72px; }
        .date-block { text-align: center; }
        .date-day { font-size: 16px; font-weight: 700; color: #1e293b; line-height: 1; }
        .date-mon { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .cat-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
        .td-note { font-size: 12px; color: #94a3b8; max-width: 180px; }
        .no-note, .no-receipt { color: #cbd5e1; }
        .td-amount { font-size: 14px; font-weight: 700; color: #dc2626; white-space: nowrap; }

        /* KWITANSI THUMBNAIL */
        .receipt-thumb-btn { background: none; border: none; cursor: pointer; padding: 0; }
        .receipt-thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1.5px solid #e2e8f0; transition: transform .15s, box-shadow .15s; display: block; }
        .receipt-thumb:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0,0,0,.15); }
        .receipt-pdf-icon { display: inline-flex; align-items: center; gap: 4px; background: #ede9fe; color: #6d28d9; padding: 5px 10px; border-radius: 8px; font-size: 12px; font-weight: 500; }

        /* ACTIONS */
        .action-group { display: flex; gap: 6px; }
        .action-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; border: 1.5px solid transparent; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .action-btn.edit { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        .action-btn.edit:hover { background: #fde68a; }
        .action-btn.danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
        .action-btn.danger:hover { background: #fecaca; }
        .table-footer { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; font-size: 13px; color: #94a3b8; background: #fafafa; border-top: 1.5px solid #f1f5f9; flex-wrap: wrap; gap: 8px; }

        /* STATES */
        .state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 12px; color: #94a3b8; font-size: 14px; }
        .empty-icon { font-size: 40px; }
        .btn-add-inline { background: #ede9fe; color: #6d28d9; border: none; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; margin-top: 4px; }
        .spinner { width: 28px; height: 28px; border: 3px solid #f1f5f9; border-top-color: #6366f1; border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* MODAL FORM */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-box { background: white; border-radius: 20px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.15); animation: modalIn .2s ease; }
        @keyframes modalIn { from { opacity: 0; transform: scale(.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-header { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1.5px solid #f1f5f9; position: sticky; top: 0; background: white; z-index: 1; }
        .modal-icon-wrap { font-size: 26px; }
        .modal-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
        .modal-subtitle { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .modal-close { margin-left: auto; background: #f1f5f9; border: none; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 12px; color: #64748b; display: flex; align-items: center; justify-content: center; transition: background .15s; flex-shrink: 0; }
        .modal-close:hover { background: #e2e8f0; }
        .modal-body { padding: 20px; }
        .modal-field { margin-bottom: 16px; }
        .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #475569; margin-bottom: 7px; flex-wrap: wrap; }
        .required { color: #ef4444; }
        .optional-tag { background: #f1f5f9; color: #94a3b8; font-size: 11px; padding: 2px 7px; border-radius: 20px; font-weight: 400; }
        .field-input { width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #1e293b; background: white; outline: none; transition: border-color .15s, box-shadow .15s; box-sizing: border-box; font-family: inherit; }
        .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .field-textarea { width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #1e293b; background: white; outline: none; transition: border-color .15s, box-shadow .15s; box-sizing: border-box; resize: vertical; min-height: 72px; font-family: inherit; }
        .field-textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .amount-wrap { position: relative; }
        .amount-prefix { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #64748b; font-weight: 500; pointer-events: none; }
        .amount-input { padding-left: 34px !important; font-weight: 600; }

        /* UPLOAD AREA */
        .upload-area { display: flex; align-items: center; justify-content: center; border: 2px dashed #c4b5fd; border-radius: 12px; padding: 24px 16px; background: #faf5ff; cursor: pointer; transition: all .15s; width: 100%; box-sizing: border-box; }
        .upload-area:hover { background: #f5f3ff; border-color: #8b5cf6; }
        .upload-area.uploading { border-color: #e2e8f0; background: #f8fafc; cursor: not-allowed; }
        .upload-idle { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .upload-icon { font-size: 32px; }
        .upload-text { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .upload-main { font-size: 13px; font-weight: 600; color: #6366f1; }
        .upload-sub { font-size: 11px; color: #94a3b8; }
        .upload-loading { display: flex; align-items: center; gap: 10px; color: #64748b; font-size: 13px; }
        .upload-spinner { width: 18px; height: 18px; border: 2px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin .6s linear infinite; flex-shrink: 0; }

        /* RECEIPT PREVIEW */
        .receipt-preview-wrap { display: flex; flex-direction: column; gap: 10px; }
        .receipt-preview-img { width: 100%; max-height: 180px; object-fit: cover; border-radius: 10px; border: 1.5px solid #e2e8f0; }
        .receipt-pdf-link { display: inline-flex; align-items: center; gap: 8px; background: #ede9fe; color: #6d28d9; padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; text-decoration: none; }
        .receipt-pdf-link:hover { background: #ddd6fe; }
        .receipt-actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .receipt-success { font-size: 12px; color: #15803d; font-weight: 500; }
        .receipt-remove-btn { background: #fee2e2; color: #991b1b; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; transition: background .15s; }
        .receipt-remove-btn:hover { background: #fecaca; }

        /* MODAL FOOTER */
        .modal-footer { display: flex; gap: 10px; justify-content: flex-end; padding-top: 8px; }
        .btn-cancel { padding: 10px 18px; border: 1.5px solid #e2e8f0; background: white; color: #64748b; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all .15s; font-family: inherit; }
        .btn-cancel:hover { background: #f8fafc; }
        .btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 10px 22px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; box-shadow: 0 3px 10px rgba(99,102,241,.3); font-family: inherit; }
        .btn-save:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .btn-save:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: white; border-radius: 50%; animation: spin .6s linear infinite; }

        /* MODAL RECEIPT PREVIEW */
        .receipt-modal-box { background: white; border-radius: 16px; width: 100%; max-width: 680px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.2); animation: modalIn .2s ease; }
        .receipt-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1.5px solid #f1f5f9; font-size: 14px; font-weight: 600; color: #1e293b; }
        .receipt-open-btn { background: #ede9fe; color: #6d28d9; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; text-decoration: none; }
        .receipt-modal-body { flex: 1; overflow: auto; padding: 16px; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
        .receipt-full-img { max-width: 100%; max-height: 70vh; border-radius: 10px; object-fit: contain; }
        .receipt-iframe { width: 100%; height: 65vh; border: none; border-radius: 10px; }

        /* RESPONSIVE */
        @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) {
          .page-wrapper { padding: 16px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .stat-card { padding: 14px 12px; }
          .stat-value { font-size: 13px; }
          .page-header { flex-direction: column; }
          .btn-add { width: 100%; justify-content: center; }
          .filter-bar { flex-direction: column; align-items: stretch; }
          .filter-result { margin-left: 0; text-align: center; }
          .modal-row { grid-template-columns: 1fr; }
          .action-btn span { display: none; }
        }
      `}</style>
    </AdminLayout>
  )
}