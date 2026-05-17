import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/components/AdminLayout"

export default function NewStudent() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: "",
    nisn: "",       // opsional
    gender: "",
    phone: "",
    email: "",
    address: "",
    birthplace: "",
    birthdate: "",
    guardian: "",
    classId: "",
    entryYear: "",  // wajib sekarang
  })

  const [classes, setClasses] = useState([])
  const [loadingClass, setLoadingClass] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/classes/list")
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setClasses(data)
      })
      .catch(() => {})
      .finally(() => setLoadingClass(false))
  }, [])

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // Preview format NIS berdasarkan kelas & tahun yang dipilih
  const getNisPreview = () => {
    const prefixMap = {
      "Persiapan": "p0",
      "Wustho 1": "w1",
      "Wustho 2": "w2",
      "Wustho 3": "w3",
      "Ulya 4": "u4",
      "Ulya 5": "u5",
      "Ulya 6": "u6",
    }
    const cls = classes.find(c => String(c.id) === String(form.classId))
    if (!cls || !form.entryYear) return null
    const pfx = prefixMap[cls.name]
    if (!pfx) return null
    const yr = String(form.entryYear).slice(2, 4)
    if (!yr || yr.length < 2) return null
    return `${pfx}${yr}xx`
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.classId || isNaN(parseInt(form.classId))) {
      alert("Pilih kelas terlebih dahulu")
      return
    }

    if (!form.entryYear.trim()) {
      alert("Tahun ajaran masuk wajib diisi (untuk generate NIS otomatis)")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/students/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nisn: form.nisn.trim() || null,
          entryYear: form.entryYear.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan")

      alert(`Santri berhasil ditambahkan!\nNIS: ${data.nis}\nInfo login dikirim ke email santri.`)
      router.push("/admin/students")
    } catch (e) {
      alert("Error: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const nisPreview = getNisPreview()

  return (
    <AdminLayout>
      <style jsx>{`
        .page-wrapper {
          max-width: 780px;
          margin: 0 auto;
          padding: 8px 0 40px;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }

        .page-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1a3d28;
          margin: 0;
        }

        .page-header span {
          font-size: 13px;
          color: #7a9a85;
        }

        .section {
          background: #ffffff;
          border: 1px solid #e4e9e6;
          border-radius: 14px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .section-header {
          background: #f7faf8;
          border-bottom: 1px solid #e4e9e6;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-header .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3a8f50;
        }

        .section-header span {
          font-size: 12px;
          font-weight: 600;
          color: #3a8f50;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .section-body {
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field.span2 {
          grid-column: span 2;
        }

        .field label {
          font-size: 12px;
          font-weight: 600;
          color: #5a7a66;
          letter-spacing: 0.3px;
        }

        .field label .req {
          color: #e05252;
          margin-left: 2px;
        }

        .field label .opt {
          color: #9ab5a3;
          font-weight: 400;
          margin-left: 4px;
          font-size: 11px;
        }

        .field input,
        .field select,
        .field textarea {
          border: 1.5px solid #dde5e0;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 14px;
          color: #1a3d28;
          background: #fafcfb;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #3a8f50;
          box-shadow: 0 0 0 3px rgba(58, 143, 80, 0.1);
          background: #fff;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #b0c4b8;
          font-size: 13px;
        }

        .field textarea {
          resize: vertical;
          min-height: 80px;
        }

        .field select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7a66' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }

        .hint {
          font-size: 11px;
          color: #9ab5a3;
          margin-top: 2px;
        }

        .nis-preview {
          font-size: 11px;
          color: #2e7340;
          background: #edf7ef;
          border: 1px solid #c3dfc9;
          border-radius: 6px;
          padding: 6px 10px;
          margin-top: 2px;
        }

        .nis-preview code {
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn-save {
          background: #3a8f50;
          color: #fff;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          font-family: inherit;
        }

        .btn-save:hover:not(:disabled) { background: #2e7340; }
        .btn-save:active:not(:disabled) { transform: scale(0.98); }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-cancel {
          background: #fff;
          color: #5a7a66;
          border: 1.5px solid #dde5e0;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          font-family: inherit;
        }

        .btn-cancel:hover {
          border-color: #3a8f50;
          color: #3a8f50;
        }

        @media (max-width: 600px) {
          .section-body { grid-template-columns: 1fr; }
          .field.span2 { grid-column: span 1; }
        }
      `}</style>

      <div className="page-wrapper">

        <div className="page-header">
          <div>
            <h2>Tambah Data Santri</h2>
            <span>Isi form berikut untuk mendaftarkan santri baru. NIS & akun login dibuat otomatis.</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* SECTION 1: DATA PRIBADI */}
          <div className="section">
            <div className="section-header">
              <div className="dot" />
              <span>Data Pribadi</span>
            </div>
            <div className="section-body">
              <div className="field span2">
                <label>Nama Lengkap <span className="req">*</span></label>
                <input
                  placeholder="Masukkan nama lengkap"
                  value={form.name}
                  onChange={e => handleChange("name", e.target.value)}
                  required
                />
              </div>

              {/* NISN opsional */}
              <div className="field">
                <label>NISN <span className="opt">(opsional)</span></label>
                <input
                  placeholder="Kosongkan jika tidak ada"
                  value={form.nisn}
                  onChange={e => handleChange("nisn", e.target.value.replace(/\D/g, ""))}
                />
                <span className="hint">Nomor Induk Siswa Nasional, isi jika tersedia</span>
              </div>

              <div className="field">
                <label>Jenis Kelamin <span className="req">*</span></label>
                <select
                  value={form.gender}
                  onChange={e => handleChange("gender", e.target.value)}
                  required
                >
                  <option value="">-- Pilih --</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className="field">
                <label>Tempat Lahir <span className="req">*</span></label>
                <input
                  placeholder="Kota/Kabupaten"
                  value={form.birthplace}
                  onChange={e => handleChange("birthplace", e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Tanggal Lahir <span className="req">*</span></label>
                <input
                  type="date"
                  value={form.birthdate}
                  onChange={e => handleChange("birthdate", e.target.value)}
                  required
                />
              </div>

              <div className="field span2">
                <label>Alamat <span className="req">*</span></label>
                <textarea
                  placeholder="Alamat lengkap santri"
                  value={form.address}
                  onChange={e => handleChange("address", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: KONTAK */}
          <div className="section">
            <div className="section-header">
              <div className="dot" />
              <span>Kontak & Wali</span>
            </div>
            <div className="section-body">
              <div className="field">
                <label>No HP <span className="req">*</span></label>
                <input
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={e => handleChange("phone", e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>

              <div className="field">
                <label>Email <span className="req">*</span></label>
                <input
                  type="email"
                  placeholder="email@gmail.com"
                  value={form.email}
                  onChange={e => handleChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="field span2">
                <label>Nama Wali <span className="req">*</span></label>
                <input
                  placeholder="Nama orang tua / wali santri"
                  value={form.guardian}
                  onChange={e => handleChange("guardian", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: DATA AKADEMIK */}
          <div className="section">
            <div className="section-header">
              <div className="dot" />
              <span>Data Akademik</span>
            </div>
            <div className="section-body">
              <div className="field">
                <label>Kelas <span className="req">*</span></label>
                <select
                  value={form.classId}
                  onChange={e => handleChange("classId", e.target.value)}
                  required
                >
                  <option value="">
                    {loadingClass ? "Memuat kelas..." : "-- Pilih Kelas --"}
                  </option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Tahun Masuk <span className="req">*</span></label>
                <input
                  placeholder="contoh: 2025"
                  value={form.entryYear}
                  onChange={e => handleChange("entryYear", e.target.value)}
                  required
                />
                {nisPreview ? (
                  <span className="nis-preview">
                    🎫 NIS otomatis, format: <code>{nisPreview}</code>
                  </span>
                ) : (
                  <span className="hint">Wajib diisi — dipakai untuk generate NIS</span>
                )}
              </div>
            </div>
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => router.push("/admin/students")}
            >
              Batal
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  )
}