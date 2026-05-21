// pages/admin/pengeluaran/index.js
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/components/AdminLayout"

export default function PengeluaranList() {
  const router = useRouter()
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([]) // State hasil filter & search
  const [searchQuery, setSearchQuery] = useState("") // State untuk live search
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

  // Efek untuk menangani Live Search secara Realtime
  useEffect(() => {
    if (!searchQuery) {
      setFilteredData(data)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = data.filter(item => 
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.note && item.note.toLowerCase().includes(query))
      )
      setFilteredData(filtered)
    }
  }, [searchQuery, data])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/pengeluaran/list?month=${filterMonth}&year=${filterYear}`)
      const json = await res.json()
      setData(json)
      setFilteredData(json)
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
    } file.target.value = ""
    setUploadingFile(false)
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
  
  // Kalkulasi total tetap merujuk pada data asli bulan ini atau data hasil filter (disesuaikan menjadi data asli agar stat card akurat)
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
    if (t.includes("gaji") || t.includes("honor") || t.includes("ustadz")) return { bg: "#e0f2fe", color: "#0369a1" }
    return { bg: "#f1f5f9", color: "#475569" }
  }

  const isPdf = (url) => url?.toLowerCase().includes(".pdf") || url?.toLowerCase().includes("/raw/")

  return (
    <AdminLayout>
      <div className="page-wrapper">

        {/* HEADER */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Pengeluaran</h1>
            <p className="page-subtitle">Catat dan kelola pengeluaran madrasah</p>
          </div>
          <button className="btn-add" onClick={openNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Pengeluaran
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="stats-grid">
          <div className="stat-card border-red">
            <div className="stat-icon-bg bg-light-red">💸</div>
            <div>
              <div className="stat-value text-red">{rp(totalBulanIni)}</div>
              <div className="stat-label">Total Bulan Ini</div>
            </div>
          </div>
          <div className="stat-card border-blue">
            <div className="stat-icon-bg bg-light-blue">📋</div>
            <div>
              <div className="stat-value">{data.length}</div>
              <div className="stat-label">Transaksi</div>
            </div>
          </div>
          <div className="stat-card border-orange">
            <div className="stat-icon-bg bg-light-orange">📊</div>
            <div>
              <div className="stat-value">{rp(avgPerTransaksi)}</div>
              <div className="stat-label">Rata-rata / Transaksi</div>
            </div>
          </div>
          <div className="stat-card border-teal">
            <div className="stat-icon-bg bg-light-teal">⬆️</div>
            <div>
              <div className="stat-value">{maxItem ? rp(maxItem.amount) : "—"}</div>
              <div className="stat-label">Pengeluaran Terbesar</div>
            </div>
          </div>
        </div>

        {/* CONTROLS (SEARCH & FILTER) */}
        <div className="control-bar">
          {/* Live Search Bar */}
          <div className="search-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Cari keterangan atau catatan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="filter-group">
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
        </div>

        {/* TABLE CARD */}
        <div className="table-card">
          <div className="table-card-header">
            <div className="header-dot" />
            <span className="table-card-title">Daftar Pengeluaran</span>
            <span className="table-card-count">{filteredData.length} item</span>
          </div>

          {loading ? (
            <div className="state-box"><div className="spinner" /><p>Memuat data...</p></div>
          ) : filteredData.length === 0 ? (
            <div className="state-box">
              <div className="empty-icon">📭</div>
              <p>{searchQuery ? "Data tidak ditemukan dengan kata kunci tersebut" : "Tidak ada pengeluaran di bulan ini"}</p>
              {!searchQuery && <button className="btn-add-inline" onClick={openNew}>+ Tambah sekarang</button>}
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>No</th>
                    <th style={{ width: "100px" }}>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Catatan</th>
                    <th style={{ width: "100px", textAlign: "center" }}>Kwitansi</th>
                    <th>Jumlah</th>
                    <th style={{ width: "160px", textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, i) => {
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
                        <td style={{ textAlign: "center" }}>
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

          {filteredData.length > 0 && (
            <div className="table-footer">
              <span>Total Ditemukan: <strong>{rp(filteredData.reduce((s, d) => s + d.amount, 0))}</strong></span>
              <span>{filteredData.length} transaksi</span>
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
              <div className="modal-field">
                <label className="field-label">Keterangan <span className="required">*</span></label>
                <input className="field-input" placeholder="contoh: Beli ATK, Bayar listrik..."
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>

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

              <div className="modal-field">
                <label className="field-label">Catatan <span className="optional-tag">opsional</span></label>
                <textarea className="field-textarea" placeholder="Keterangan tambahan..."
                  value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
              </div>

              <div className="modal-field">
                <label className="field-label">Bukti / Kwitansi <span className="optional-tag">opsional · maks 5MB</span></label>

                {form.receiptUrl ? (
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
        .page-wrapper { padding: 24px; max-width: 1200px; margin: 0 auto; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; }

        /* HEADER */
        .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .page-title { margin: 0; font-size: 24px; font-weight: 700; color: #1e293b; letter-spacing: -.5px; }
        .page-subtitle { margin: 4px 0 0; font-size: 13.5px; color: #64748b; }
        
        .btn-add { 
          display: inline-flex; align-items: center; gap: 8px; 
          background: #10b981; color: white; /* Hijau Emerald agar match dengan tema aktif */
          padding: 10px 18px; border-radius: 10px; border: none; 
          font-size: 14px; font-weight: 600; cursor: pointer; 
          transition: all .2s; white-space: nowrap; 
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); 
        }
        .btn-add:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3); }

        /* STATS CARDS */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { 
          background: white; border-radius: 14px; padding: 20px; 
          display: flex; align-items: center; gap: 16px; 
          box-shadow: 0 1px 3px rgba(0,0,0,.05); border: 1.5px solid #e2e8f0; 
          transition: transform .2s, box-shadow .2s; 
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.06); }
        
        /* Bulatan background icon stat card */
        .stat-icon-bg { 
          width: 48px; height: 48px; border-radius: 12px; 
          display: flex; align-items: center; justify-content: center; 
          font-size: 20px; flex-shrink: 0; 
        }
        .bg-light-red { background-color: #fef2f2; }
        .bg-light-blue { background-color: #f0fdf4; } /* Diubah ke hijau soft */
        .bg-light-orange { background-color: #fffbeb; }
        .bg-light-teal { background-color: #f0fdfa; }

        .stat-value { font-size: 18px; font-weight: 700; color: #1e293b; line-height: 1.2; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }
        
        /* Border kiri berwarna lembut */
        .border-red { border-left: 4px solid #ef4444; }
        .border-blue { border-left: 4px solid #10b981; } /* Dicocokkan ke hijau aktif */
        .border-orange { border-left: 4px solid #f59e0b; }
        .border-teal { border-left: 4px solid #06b6d4; }
        .text-red { color: #ef4444; }

        /* SEARCH & FILTER BAR (CONTROLS) */
        .control-bar { 
          display: flex; align-items: center; justify-content: space-between; 
          gap: 16px; margin-bottom: 20px; flex-wrap: wrap; 
        }
        
        /* Live Search Style */
        .search-wrapper { position: relative; flex: 1; min-width: 280px; max-width: 400px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .search-input { 
          width: 100%; padding: 10px 14px 10px 40px; 
          border: 1.5px solid #e2e8f0; border-radius: 10px; 
          font-size: 13.5px; color: #1e293b; background: white; 
          outline: none; transition: all .2s; 
        }
        .search-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }

        .filter-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .filter-label { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 500; color: #64748b; }
        .filter-select { padding: 9px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13.5px; color: #475569; background: white; outline: none; cursor: pointer; transition: border-color .15s; }
        .filter-select:focus { border-color: #10b981; }
        .filter-result { font-size: 13px; font-weight: 600; color: #047857; background: #ecfdf5; border: 1.5px solid #d1fae5; padding: 7px 14px; border-radius: 20px; }

        /* TABLE */
        .table-card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.05); border: 1.5px solid #e2e8f0; overflow: hidden; }
        .table-card-header { display: flex; align-items: center; gap: 8px; padding: 16px 20px; background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
        .header-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; flex-shrink: 0; }
        .table-card-title { font-size: 14px; font-weight: 700; color: #1e293b; }
        .table-card-count { margin-left: auto; font-size: 11px; font-weight: 600; background: #d1fae5; color: #065f46; padding: 3px 10px; border-radius: 20px; }
        
        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .5px; white-space: nowrap; background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
        .table-row { border-bottom: 1px solid #f1f5f9; transition: background .15s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: #f8fdfa; } /* Highlight hijau tipis saat hover row */
        td { padding: 14px 16px; font-size: 13.5px; color: #334155; vertical-align: middle; }
        
        .td-no { color: #94a3b8; font-size: 12px; }
        .date-block { text-align: left; }
        .date-day { font-size: 15px; font-weight: 700; color: #1e293b; line-height: 1.1; }
        .date-mon { font-size: 11px; color: #64748b; margin-top: 1px; }
        .cat-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12.5px; font-weight: 500; }
        .td-note { font-size: 13px; color: #64748b; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .no-note, .no-receipt { color: #cbd5e1; font-style: italic; }
        .td-amount { font-size: 14.5px; font-weight: 700; color: #dc2626; white-space: nowrap; }

        /* RECEIPT ACTION BUTTON */
        .receipt-thumb-btn { background: none; border: none; cursor: pointer; padding: 0; outline: none; }
        .receipt-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1.5px solid #e2e8f0; transition: all .15s; display: block; margin: 0 auto; }
        .receipt-thumb:hover { transform: scale(1.1); border-color: #10b981; box-shadow: 0 4px 10px rgba(0,0,0,.1); }
        .receipt-pdf-icon { display: inline-flex; align-items: center; gap: 4px; background: #fee2e2; color: #991b1b; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }

        /* ACTIONS BUTTONS */
        .action-group { display: flex; gap: 6px; justify-content: center; }
        .action-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; border: 1px solid transparent; cursor: pointer; transition: all .15s; }
        .action-btn.edit { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .action-btn.edit:hover { background: #fef3c7; }
        .action-btn.danger { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
        .action-btn.danger:hover { background: #fee2e2; }
        
        .table-footer { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; font-size: 13px; color: #64748b; background: #f8fafc; border-top: 1.5px solid #e2e8f0; }

        /* MODAL & LOADER STATE */
        .state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 20px; gap: 12px; color: #94a3b8; font-size: 14px; }
        .spinner { width: 24px; height: 24px; border: 2.5px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-add-inline { background: #e6f4ea; color: #137333; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 4px; }

        /* FORM MODAL STYLES */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-box { background: white; border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,.1); }
        .modal-header { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1.5px solid #f1f5f9; }
        .modal-title { font-size: 16px; font-weight: 700; color: #1e293b; }
        .modal-subtitle { font-size: 12px; color: #64748b; }
        .modal-close { margin-left: auto; background: #f1f5f9; border: none; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; color: #64748b; font-size: 11px; }
        .modal-body { padding: 20px; }
        .modal-field { margin-bottom: 16px; }
        .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field-label { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; display: block; }
        .field-input, .field-textarea { width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #1e293b; outline: none; transition: border-color .15s; box-sizing: border-box; font-family: inherit; }
        .field-input:focus, .field-textarea:focus { border-color: #10b981; }
        .amount-wrap { position: relative; }
        .amount-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #64748b; font-weight: 600; }
        .amount-input { padding-left: 36px !important; }

        /* UPLOAD REGION */
        .upload-area { display: flex; align-items: center; justify-content: center; border: 2px dashed #a7f3d0; border-radius: 10px; padding: 20px; background: #f0fdf4; cursor: pointer; width: 100%; box-sizing: border-box; }
        .upload-main { font-size: 13px; font-weight: 600; color: #059669; }
        .upload-sub { font-size: 11px; color: #64748b; display: block; margin-top: 2px; }

        .modal-footer { display: flex; justify-content: flex-end; gap: 10px; border-top: 1.5px solid #f1f5f9; padding: 14px 20px; background: #f8fafc; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; }
        .btn-cancel { background: white; border: 1.5px solid #e2e8f0; color: #475569; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; }
        .btn-save { background: #10b981; border: none; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
        .btn-save:hover { background: #059669; }

        /* RECEIPT PREVIEW MODAL SPECIFIC */
        .receipt-modal-box { background: white; border-radius: 16px; width: 100%; max-width: 600px; box-shadow: 0 25px 50px -12px rgba(0,0,0,.25); }
        .receipt-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1.5px solid #e2e8f0; font-weight: 700; font-size: 14px; }
        .receipt-open-btn { font-size: 12px; color: #10b981; text-decoration: none; font-weight: 600; background: #f0fdf4; padding: 4px 10px; border-radius: 6px; }
        .receipt-modal-body { padding: 12px; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 200px; }
        .receipt-full-img { max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px; }
        .receipt-iframe { width: 100%; height: 70vh; border: none; border-radius: 8px; }
      `}</style>
    </AdminLayout>
  )
}