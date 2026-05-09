// pages/admin/pengeluaran/index.js
import { useEffect, useState, useRef } from "react"
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
  const [exporting, setExporting] = useState(null) // "pdf" | "excel" | null
  const [form, setForm] = useState({ title: "", amount: "", note: "", date: new Date().toISOString().slice(0, 10), receiptUrl: "" })

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

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
    setReceiptFile(null)
    setReceiptPreview(null)
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
    setReceiptFile(null)
    setReceiptPreview(item.receiptUrl || null)
    setShowForm(true)
  }

  // Handle file selection & preview
  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFile(file)
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => setReceiptPreview(ev.target.result)
      reader.readAsDataURL(file)
    } else {
      // PDF — show icon instead
      setReceiptPreview("__pdf__")
    }
  }

  function removeReceipt() {
    setReceiptFile(null)
    setReceiptPreview(null)
    setForm(p => ({ ...p, receiptUrl: "" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Upload to Cloudinary via /api/upload/receipt
  async function uploadReceipt() {
    if (!receiptFile) return form.receiptUrl || null
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", receiptFile)
      const res = await fetch("/api/upload/receipt", { method: "POST", body: fd })
      if (!res.ok) throw new Error("Upload gagal")
      const json = await res.json()
      return json.url
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const uploadedUrl = await uploadReceipt()
      const payload = {
        ...form,
        amount: parseInt(form.amount),
        receiptUrl: uploadedUrl || null,
      }
      const url = editItem ? `/api/pengeluaran/${editItem.id}` : "/api/pengeluaran/create"
      const method = editItem ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.message) }
      setShowForm(false)
      loadData()
    } catch (err) {
      alert("Error: " + err.message)
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm("Yakin hapus pengeluaran ini?")) return
    try {
      await fetch(`/api/pengeluaran/${id}`, { method: "DELETE" })
      loadData()
    } catch { alert("Gagal menghapus") }
  }

  // Export handler
  async function handleExport(format) {
    setExporting(format)
    try {
      const url = `/api/pengeluaran/export?format=${format}&month=${filterMonth}&year=${filterYear}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Gagal export")
      const blob = await res.blob()
      const ext = format === "excel" ? "xlsx" : "pdf"
      const monthName = months[filterMonth - 1]
      const filename = `Pengeluaran_${monthName}_${filterYear}.${ext}`
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      alert("Export gagal: " + err.message)
    } finally {
      setExporting(null)
    }
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

  return (
    <AdminLayout>
      <div className="page-wrapper">

        {/* HEADER */}
        <div className="page-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => router.push("/admin/dashboard")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Kembali
            </button>
            <div>
              <h1 className="page-title">Pengeluaran</h1>
              <p className="page-subtitle">Catat dan kelola pengeluaran madrasah</p>
            </div>
          </div>
          <div className="header-actions">
            {/* Export buttons */}
            <div className="export-group">
              <button
                className="btn-export pdf"
                onClick={() => handleExport("pdf")}
                disabled={!!exporting}
              >
                {exporting === "pdf" ? (
                  <><span className="btn-spinner dark" /> Mengekspor...</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>PDF</>
                )}
              </button>
              <button
                className="btn-export excel"
                onClick={() => handleExport("excel")}
                disabled={!!exporting}
              >
                {exporting === "excel" ? (
                  <><span className="btn-spinner dark" /> Mengekspor...</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Excel</>
                )}
              </button>
            </div>
            <button className="btn-add" onClick={openNew}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah Pengeluaran
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
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
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="filter-result">
            {months[filterMonth-1]} {filterYear}
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="table-card">
          <div className="table-card-header">
            <div className="header-dot" />
            <span className="table-card-title">Daftar Pengeluaran</span>
            <span className="table-card-count">{data.length} item</span>
          </div>

          {loading ? (
            <div className="state-box">
              <div className="spinner" />
              <p>Memuat data...</p>
            </div>
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
                    <th>Jumlah</th>
                    <th>Struk</th>
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
                        <td className="td-amount">{rp(item.amount)}</td>
                        <td className="td-receipt">
                          {item.receiptUrl ? (
                            <a
                              href={item.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="receipt-link"
                              title="Lihat struk"
                            >
                              {item.receiptUrl.match(/\.(pdf)$/i) ? (
                                <span className="receipt-pdf-badge">PDF</span>
                              ) : (
                                <img
                                  src={item.receiptUrl}
                                  alt="struk"
                                  className="receipt-thumb"
                                />
                              )}
                            </a>
                          ) : (
                            <span className="no-note">—</span>
                          )}
                        </td>
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

      {/* MODAL */}
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
                <input
                  className="field-input"
                  placeholder="contoh: Beli ATK, Bayar listrik..."
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label className="field-label">Jumlah (Rp) <span className="required">*</span></label>
                  <div className="amount-wrap">
                    <span className="amount-prefix">Rp</span>
                    <input
                      className="field-input amount-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={form.amount ? formatAmount(form.amount) : ""}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value.replace(/\D/g, "") }))}
                      required
                    />
                  </div>
                </div>

                <div className="modal-field">
                  <label className="field-label">Tanggal <span className="required">*</span></label>
                  <input
                    className="field-input"
                    type="date"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="modal-field">
                <label className="field-label">
                  Catatan
                  <span className="optional-tag">opsional</span>
                </label>
                <textarea
                  className="field-textarea"
                  placeholder="Keterangan tambahan..."
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                />
              </div>

              {/* ── RECEIPT UPLOAD ── */}
              <div className="modal-field">
                <label className="field-label">
                  Struk / Bukti Pembayaran
                  <span className="optional-tag">opsional</span>
                </label>

                {receiptPreview ? (
                  <div className="receipt-preview-wrap">
                    {receiptPreview === "__pdf__" ? (
                      <div className="receipt-pdf-preview">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span>{receiptFile?.name || "File PDF"}</span>
                      </div>
                    ) : (
                      <a href={receiptPreview} target="_blank" rel="noopener noreferrer">
                        <img src={receiptPreview} alt="preview struk" className="receipt-preview-img" />
                      </a>
                    )}
                    <button type="button" className="receipt-remove-btn" onClick={removeReceipt}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ) : (
                  <div
                    className="upload-zone"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag-over") }}
                    onDragLeave={e => e.currentTarget.classList.remove("drag-over")}
                    onDrop={e => {
                      e.preventDefault()
                      e.currentTarget.classList.remove("drag-over")
                      const file = e.dataTransfer.files?.[0]
                      if (file) {
                        // simulate the same flow as file input
                        const ev = { target: { files: [file] } }
                        handleFileChange(ev)
                      }
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p className="upload-text">Klik atau seret file ke sini</p>
                    <p className="upload-hint">JPG, PNG, WEBP, PDF — maks. 5 MB</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn-save" disabled={saving || uploading}>
                  {(saving || uploading) ? (
                    <><span className="btn-spinner" /> {uploading ? "Mengunggah..." : "Menyimpan..."}</>
                  ) : (
                    <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Simpan</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ===== BASE ===== */
        .page-wrapper {
          padding: 24px;
          max-width: 1160px;
          margin: 0 auto;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
        }

        /* ===== HEADER ===== */
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .header-left { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .btn-back {
          display: inline-flex; align-items: center; gap: 6px;
          background: white; border: 1.5px solid #e2e8f0; color: #475569;
          padding: 8px 14px; border-radius: 10px; font-size: 13px;
          font-weight: 500; cursor: pointer; transition: all .18s; white-space: nowrap;
        }
        .btn-back:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
        .page-title { margin: 0; font-size: clamp(18px, 3vw, 24px); font-weight: 700; color: #1e293b; letter-spacing: -.4px; }
        .page-subtitle { margin: 2px 0 0; font-size: 13px; color: #94a3b8; }

        /* Export buttons */
        .export-group { display: flex; gap: 6px; }
        .btn-export {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 14px; border-radius: 10px; font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all .15s;
          white-space: nowrap; border: 1.5px solid transparent;
        }
        .btn-export.pdf {
          background: #fee2e2; color: #991b1b; border-color: #fecaca;
        }
        .btn-export.pdf:hover:not(:disabled) { background: #fecaca; }
        .btn-export.excel {
          background: #dcfce7; color: #15803d; border-color: #bbf7d0;
        }
        .btn-export.excel:hover:not(:disabled) { background: #bbf7d0; }
        .btn-export:disabled { opacity: .55; cursor: not-allowed; }

        .btn-add {
          display: inline-flex; align-items: center; gap: 7px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; padding: 10px 18px; border-radius: 10px;
          border: none; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all .15s; white-space: nowrap;
          box-shadow: 0 3px 12px rgba(99,102,241,.3);
        }
        .btn-add:hover { opacity: .9; transform: translateY(-1px); box-shadow: 0 5px 18px rgba(99,102,241,.4); }

        /* ===== STATS ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: white; border-radius: 14px; padding: 18px 16px;
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1.5px solid #f1f5f9;
          transition: transform .15s, box-shadow .15s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
        .stat-icon { font-size: 22px; flex-shrink: 0; }
        .stat-value { font-size: 16px; font-weight: 700; color: #1e293b; line-height: 1.2; }
        .stat-label { font-size: 11px; color: #94a3b8; margin-top: 3px; font-weight: 500; }
        .stat-total { border-top: 3px solid #ef4444; }
        .stat-count { border-top: 3px solid #6366f1; }
        .stat-avg  { border-top: 3px solid #f59e0b; }
        .stat-max  { border-top: 3px solid #22c55e; }

        /* ===== FILTER ===== */
        .filter-bar {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 18px; flex-wrap: wrap;
        }
        .filter-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 13px; font-weight: 500; color: #64748b;
        }
        .filter-select {
          padding: 9px 14px; border: 1.5px solid #e2e8f0;
          border-radius: 10px; font-size: 13px; color: #475569;
          background: white; outline: none; cursor: pointer; transition: border-color .15s;
        }
        .filter-select:focus { border-color: #6366f1; }
        .filter-result {
          margin-left: auto; font-size: 13px; font-weight: 600; color: #6366f1;
          background: #f5f3ff; border: 1.5px solid #ede9fe; padding: 7px 14px; border-radius: 20px;
        }

        /* ===== TABLE CARD ===== */
        .table-card {
          background: white; border-radius: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,.06); border: 1.5px solid #f1f5f9; overflow: hidden;
        }
        .table-card-header {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 20px; background: #fafafa; border-bottom: 1.5px solid #f1f5f9;
        }
        .header-dot { width: 8px; height: 8px; border-radius: 50%; background: #6366f1; flex-shrink: 0; }
        .table-card-title { font-size: 13px; font-weight: 700; color: #1e293b; }
        .table-card-count {
          margin-left: auto; font-size: 11px; font-weight: 600;
          background: #ede9fe; color: #6d28d9; padding: 3px 10px; border-radius: 20px;
        }
        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 640px; }
        th {
          padding: 11px 16px; text-align: left; font-size: 11px;
          font-weight: 600; color: #94a3b8; text-transform: uppercase;
          letter-spacing: .5px; white-space: nowrap;
        }
        .table-row { border-bottom: 1px solid #f8fafc; transition: background .12s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: #fafbff; }
        td { padding: 13px 16px; font-size: 13.5px; color: #334155; vertical-align: middle; }
        .td-no { color: #94a3b8; font-size: 12px; width: 40px; }
        .td-date { width: 80px; }
        .date-block { text-align: center; }
        .date-day { font-size: 16px; font-weight: 700; color: #1e293b; line-height: 1; }
        .date-mon { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .cat-badge {
          display: inline-block; padding: 5px 12px;
          border-radius: 20px; font-size: 13px; font-weight: 500;
        }
        .td-note { font-size: 12px; color: #94a3b8; max-width: 180px; }
        .no-note { color: #cbd5e1; }
        .td-amount { font-size: 14px; font-weight: 700; color: #dc2626; white-space: nowrap; }

        /* Receipt column */
        .td-receipt { width: 64px; text-align: center; }
        .receipt-link { display: inline-block; }
        .receipt-thumb {
          width: 44px; height: 44px; object-fit: cover;
          border-radius: 8px; border: 1.5px solid #e2e8f0;
          transition: transform .15s, box-shadow .15s;
        }
        .receipt-thumb:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0,0,0,.15); }
        .receipt-pdf-badge {
          display: inline-block; padding: 4px 8px; font-size: 10px; font-weight: 700;
          background: #fee2e2; color: #991b1b; border-radius: 6px; letter-spacing: .5px;
        }

        .action-group { display: flex; gap: 6px; }
        .action-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 8px; font-size: 12px;
          font-weight: 500; border: 1.5px solid transparent;
          cursor: pointer; transition: all .15s; white-space: nowrap;
        }
        .action-btn.edit { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        .action-btn.edit:hover { background: #fde68a; }
        .action-btn.danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
        .action-btn.danger:hover { background: #fecaca; }

        .table-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 20px; font-size: 13px; color: #94a3b8;
          background: #fafafa; border-top: 1.5px solid #f1f5f9; flex-wrap: wrap; gap: 8px;
        }

        /* ===== STATES ===== */
        .state-box {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 60px 20px; gap: 12px;
          color: #94a3b8; font-size: 14px;
        }
        .empty-icon { font-size: 40px; }
        .btn-add-inline {
          background: #ede9fe; color: #6d28d9; border: none;
          padding: 8px 18px; border-radius: 8px; font-size: 13px;
          font-weight: 500; cursor: pointer; margin-top: 4px;
        }
        .spinner {
          width: 28px; height: 28px; border: 3px solid #f1f5f9;
          border-top-color: #6366f1; border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15,23,42,.45);
          backdrop-filter: blur(5px); display: flex; align-items: center;
          justify-content: center; z-index: 1000; padding: 20px;
        }
        .modal-box {
          background: white; border-radius: 20px; width: 100%;
          max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,.15);
          animation: modalIn .2s ease; overflow: hidden;
          max-height: 92vh; display: flex; flex-direction: column;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header {
          display: flex; align-items: center; gap: 12px;
          padding: 20px; border-bottom: 1.5px solid #f1f5f9; flex-shrink: 0;
        }
        .modal-icon-wrap { font-size: 26px; }
        .modal-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
        .modal-subtitle { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .modal-close {
          margin-left: auto; background: #f1f5f9; border: none;
          width: 28px; height: 28px; border-radius: 8px; cursor: pointer;
          font-size: 12px; color: #64748b; display: flex; align-items: center;
          justify-content: center; transition: background .15s; flex-shrink: 0;
        }
        .modal-close:hover { background: #e2e8f0; }
        .modal-body { padding: 20px; overflow-y: auto; }
        .modal-field { margin-bottom: 16px; }
        .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 500; color: #475569; margin-bottom: 7px;
        }
        .required { color: #ef4444; }
        .optional-tag {
          background: #f1f5f9; color: #94a3b8; font-size: 11px;
          padding: 2px 7px; border-radius: 20px; font-weight: 400;
        }
        .field-input {
          width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0;
          border-radius: 10px; font-size: 14px; color: #1e293b; background: white;
          outline: none; transition: border-color .15s, box-shadow .15s;
          box-sizing: border-box; font-family: inherit;
        }
        .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .field-textarea {
          width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0;
          border-radius: 10px; font-size: 14px; color: #1e293b; background: white;
          outline: none; transition: border-color .15s, box-shadow .15s;
          box-sizing: border-box; resize: vertical; min-height: 72px; font-family: inherit;
        }
        .field-textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .amount-wrap { position: relative; }
        .amount-prefix {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          font-size: 13px; color: #64748b; font-weight: 500; pointer-events: none;
        }
        .amount-input { padding-left: 34px !important; font-weight: 600; }

        /* ── Upload zone ── */
        .upload-zone {
          border: 2px dashed #e2e8f0; border-radius: 12px;
          padding: 24px 16px; display: flex; flex-direction: column;
          align-items: center; gap: 8px; cursor: pointer;
          transition: border-color .2s, background .2s; background: #fafafa;
        }
        .upload-zone:hover, .upload-zone.drag-over {
          border-color: #6366f1; background: #f5f3ff;
        }
        .upload-text { font-size: 13px; color: #64748b; margin: 0; font-weight: 500; }
        .upload-hint { font-size: 11px; color: #94a3b8; margin: 0; }

        /* ── Receipt preview ── */
        .receipt-preview-wrap {
          position: relative; display: inline-block;
        }
        .receipt-preview-img {
          width: 100%; max-height: 160px; object-fit: cover;
          border-radius: 10px; border: 1.5px solid #e2e8f0; display: block;
        }
        .receipt-pdf-preview {
          display: flex; align-items: center; gap: 10px;
          background: #fee2e2; border: 1.5px solid #fecaca;
          border-radius: 10px; padding: 12px 16px; font-size: 13px;
          color: #991b1b; font-weight: 500;
        }
        .receipt-remove-btn {
          position: absolute; top: -8px; right: -8px;
          width: 22px; height: 22px; border-radius: 50%;
          background: #ef4444; color: white; border: none;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,.2);
          transition: background .15s;
        }
        .receipt-remove-btn:hover { background: #dc2626; }

        .modal-footer {
          display: flex; gap: 10px; justify-content: flex-end;
          padding: 16px 20px 20px; flex-shrink: 0;
          border-top: 1.5px solid #f1f5f9;
        }
        .btn-cancel {
          padding: 10px 18px; border: 1.5px solid #e2e8f0; background: white;
          color: #64748b; border-radius: 10px; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all .15s; font-family: inherit;
        }
        .btn-cancel:hover { background: #f8fafc; }
        .btn-save {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 22px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; border: none; border-radius: 10px; font-size: 14px;
          font-weight: 600; cursor: pointer; transition: all .15s;
          box-shadow: 0 3px 10px rgba(99,102,241,.3); font-family: inherit;
        }
        .btn-save:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .btn-save:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .btn-spinner {
          width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3);
          border-top-color: white; border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        .btn-spinner.dark {
          border-color: rgba(0,0,0,.15);
          border-top-color: currentColor;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .page-wrapper { padding: 16px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .stat-card { padding: 14px 12px; }
          .stat-value { font-size: 13px; }
          .page-header { flex-direction: column; }
          .header-actions { width: 100%; justify-content: flex-end; }
          .btn-add { width: 100%; justify-content: center; }
          .filter-bar { flex-direction: column; align-items: stretch; }
          .filter-result { margin-left: 0; text-align: center; }
          .modal-row { grid-template-columns: 1fr; }
          .action-btn span { display: none; }
        }
        @media (max-width: 400px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </AdminLayout>
  )
}