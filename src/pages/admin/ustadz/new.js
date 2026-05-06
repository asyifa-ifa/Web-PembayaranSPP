// pages/admin/ustadz/new.js
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/components/AdminLayout"

export default function NewUstadz() {
  const router = useRouter()
  const [classes, setClasses] = useState([])
  const [saving, setSaving] = useState(false)
  const [subjectInput, setSubjectInput] = useState("")

  const [form, setForm] = useState({
    name: "",
    jabatan: "",
    phone: "",
    email: "",
    address: "",
    subjects: [],
    classId: "",
  })

  useEffect(() => {
    fetch("/api/classes/list").then(r => r.json()).then(setClasses).catch(() => {})
  }, [])

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  function addSubject() {
    const val = subjectInput.trim()
    if (!val) return
    if (form.subjects.includes(val)) {
      setSubjectInput("")
      return
    }
    setForm(prev => ({ ...prev, subjects: [...prev.subjects, val] }))
    setSubjectInput("")
  }

  function removeSubject(s) {
    setForm(prev => ({ ...prev, subjects: prev.subjects.filter(x => x !== s) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return alert("Nama wajib diisi")
    setSaving(true)
    try {
      const res = await fetch("/api/ustadz/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, classId: form.classId || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      alert("Ustadz berhasil ditambahkan!")
      router.push("/admin/ustadz")
    } catch (e) {
      alert("Error: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <UstadzForm
        title="Tambah Data Ustadz"
        subtitle="Isi form berikut untuk menambahkan ustadz baru"
        form={form}
        handleChange={handleChange}
        subjectInput={subjectInput}
        setSubjectInput={setSubjectInput}
        addSubject={addSubject}
        removeSubject={removeSubject}
        classes={classes}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/admin/ustadz")}
      />
    </AdminLayout>
  )
}

// =====================
// SHARED FORM COMPONENT
// =====================
export function UstadzForm({ title, subtitle, form, handleChange, subjectInput, setSubjectInput, addSubject, removeSubject, classes, saving, onSubmit, onCancel }) {
  return (
    <>
      <style jsx>{`
        .page-wrapper { max-width: 780px; margin: 0 auto; padding: 8px 0 40px; }
        .page-header { margin-bottom: 28px; }
        .page-header h2 { font-size: 20px; font-weight: 700; color: #1a3d28; margin: 0 0 4px; }
        .page-header span { font-size: 13px; color: #7a9a85; }

        .section { background: #fff; border: 1px solid #e4e9e6; border-radius: 14px; margin-bottom: 16px; overflow: hidden; }
        .section-header { background: #f7faf8; border-bottom: 1px solid #e4e9e6; padding: 13px 20px; display: flex; align-items: center; gap: 8px; }
        .section-header .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a8f50; }
        .section-header span { font-size: 12px; font-weight: 600; color: #3a8f50; text-transform: uppercase; letter-spacing: 0.6px; }
        .section-body { padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field.span2 { grid-column: span 2; }
        .field label { font-size: 12px; font-weight: 600; color: #5a7a66; letter-spacing: 0.3px; }
        .field label .req { color: #e05252; margin-left: 2px; }
        .field input, .field select, .field textarea {
          border: 1.5px solid #dde5e0; border-radius: 8px; padding: 9px 12px;
          font-size: 14px; color: #1a3d28; background: #fafcfb; outline: none;
          font-family: inherit; width: 100%; box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field input:focus, .field select:focus, .field textarea:focus {
          border-color: #3a8f50; box-shadow: 0 0 0 3px rgba(58,143,80,0.1); background: #fff;
        }
        .field input::placeholder, .field textarea::placeholder { color: #b0c4b8; font-size: 13px; }
        .field textarea { resize: vertical; min-height: 80px; }
        .field select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7a66' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; cursor: pointer;
        }
        .hint { font-size: 11px; color: #9ab5a3; margin-top: 2px; }

        /* SUBJECTS */
        .subject-input-row { display: flex; gap: 8px; }
        .subject-input-row input { flex: 1; }
        .btn-add-subject {
          background: #edf7ef; color: #2e6b3e; border: 1.5px solid #c3dfc9;
          padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit; white-space: nowrap; transition: 0.15s;
        }
        .btn-add-subject:hover { background: #d6f0dc; }
        .subjects-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .subject-tag {
          display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
          background: #edf7ef; color: #2e6b3e; border: 1px solid #c3dfc9;
          border-radius: 20px; font-size: 12px; font-weight: 600;
        }
        .subject-tag button {
          background: none; border: none; cursor: pointer; color: #2e6b3e;
          font-size: 14px; line-height: 1; padding: 0; font-family: inherit;
        }
        .subject-tag button:hover { color: #d32f2f; }

        /* ACTIONS */
        .actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }
        .btn-save {
          background: #3a8f50; color: #fff; border: none; padding: 10px 24px;
          border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.2s;
        }
        .btn-save:hover:not(:disabled) { background: #2e7340; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cancel {
          background: #fff; color: #5a7a66; border: 1.5px solid #dde5e0;
          padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;
          cursor: pointer; font-family: inherit; transition: 0.15s;
        }
        .btn-cancel:hover { border-color: #3a8f50; color: #3a8f50; }

        @media (max-width: 600px) {
          .section-body { grid-template-columns: 1fr; }
          .field.span2 { grid-column: span 1; }
        }
      `}</style>

      <div className="page-wrapper">
        <div className="page-header">
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>

        <form onSubmit={onSubmit}>
          {/* DATA PRIBADI */}
          <div className="section">
            <div className="section-header">
              <div className="dot" />
              <span>Data Pribadi</span>
            </div>
            <div className="section-body">
              <div className="field span2">
                <label>Nama Lengkap <span className="req">*</span></label>
                <input placeholder="Nama ustadz" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
              </div>
              <div className="field">
                <label>Jabatan</label>
                <input placeholder="contoh: Kepala Madrasah, Pengajar" value={form.jabatan} onChange={e => handleChange("jabatan", e.target.value)} />
              </div>
              <div className="field">
                <label>No HP</label>
                <input placeholder="08xxxxxxxxxx" value={form.phone} onChange={e => handleChange("phone", e.target.value.replace(/\D/g, ""))} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="email@gmail.com" value={form.email} onChange={e => handleChange("email", e.target.value)} />
              </div>
              <div className="field">
                <label>Alamat</label>
                <input placeholder="Alamat ustadz" value={form.address} onChange={e => handleChange("address", e.target.value)} />
              </div>
            </div>
          </div>

          {/* MENGAJAR */}
          <div className="section">
            <div className="section-header">
              <div className="dot" />
              <span>Mata Pelajaran & Wali Kelas</span>
            </div>
            <div className="section-body">
              <div className="field span2">
                <label>Mata Pelajaran yang Diajarkan</label>
                <div className="subject-input-row">
                  <input
                    placeholder="Ketik mata pelajaran, lalu klik Tambah"
                    value={subjectInput}
                    onChange={e => setSubjectInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubject() } }}
                  />
                  <button type="button" className="btn-add-subject" onClick={addSubject}>+ Tambah</button>
                </div>
                {form.subjects.length > 0 && (
                  <div className="subjects-tags">
                    {form.subjects.map((s, i) => (
                      <span key={i} className="subject-tag">
                        {s}
                        <button type="button" onClick={() => removeSubject(s)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <span className="hint">Tekan Enter atau klik Tambah untuk menambah mapel</span>
              </div>

              <div className="field span2">
                <label>Wali Kelas</label>
                <select value={form.classId} onChange={e => handleChange("classId", e.target.value)}>
                  <option value="">-- Bukan Wali Kelas --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span className="hint">Kosongkan jika ustadz ini bukan wali kelas</span>
              </div>
            </div>
          </div>

          <div className="actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>Batal</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}