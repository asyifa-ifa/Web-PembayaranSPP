import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import AdminLayout from "@/components/AdminLayout"

export default function StudentDetail() {
  const router = useRouter()
  const { id } = router.query
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/students/${id}`)
      .then(res => res.json())
      .then(data => setStudent(data))
      .catch(err => alert("Gagal memuat: " + err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <AdminLayout>
      <p style={{ color: "#7a9a85", padding: "40px 0" }}>Memuat data...</p>
    </AdminLayout>
  )

  if (!student) return (
    <AdminLayout>
      <p style={{ color: "#d32f2f", padding: "40px 0" }}>Data tidak ditemukan.</p>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <style jsx>{`
        .page-wrapper {
          max-width: 680px;
          margin: 0 auto;
          padding: 8px 0 40px;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
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

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .btn-edit {
          background: #fff8e6;
          color: #b07800;
          border: 1.5px solid #e6d08a;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }
        .btn-edit:hover { background: #fdf0c0; }

        .btn-back {
          background: #fff;
          color: #5a7a66;
          border: 1.5px solid #dde5e0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .btn-back:hover { border-color: #3a8f50; color: #3a8f50; }

        /* AVATAR SECTION */
        .profile-card {
          background: #fff;
          border: 1px solid #e4e9e6;
          border-radius: 14px;
          padding: 24px 20px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #edf7ef;
          border: 2px solid #c3dfc9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: #3a8f50;
          flex-shrink: 0;
        }

        .profile-info h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1a3d28;
          margin: 0 0 4px;
        }

        .profile-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge-kelas {
          background: #edf7ef;
          color: #2e6b3e;
          border: 1px solid #c3dfc9;
        }
        .badge-gender-l {
          background: #e3f0ff;
          color: #2563a8;
        }
        .badge-gender-p {
          background: #fde8f0;
          color: #a8256b;
        }
        .badge-tahun {
          background: #f5f3e7;
          color: #7a6a2e;
          border: 1px solid #e0d89a;
        }

        /* INFO SECTIONS */
        .section {
          background: #fff;
          border: 1px solid #e4e9e6;
          border-radius: 14px;
          margin-bottom: 14px;
          overflow: hidden;
        }

        .section-header {
          background: #f7faf8;
          border-bottom: 1px solid #e4e9e6;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3a8f50;
        }

        .section-header span {
          font-size: 11px;
          font-weight: 700;
          color: #3a8f50;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .section-body {
          padding: 4px 0;
        }

        .info-row {
          display: flex;
          align-items: flex-start;
          padding: 12px 20px;
          border-bottom: 1px solid #f0f4f1;
          gap: 12px;
        }
        .info-row:last-child { border-bottom: none; }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #8aab96;
          width: 140px;
          flex-shrink: 0;
          padding-top: 1px;
        }

        .info-value {
          font-size: 14px;
          color: #1a3d28;
          flex: 1;
        }

        .info-value.muted {
          color: #b0c4b8;
        }

        .registered-note {
          text-align: center;
          font-size: 12px;
          color: #b0c4b8;
          margin-top: 20px;
        }
      `}</style>

      <div className="page-wrapper">
        <div className="page-header">
          <div>
            <h2>Detail Santri</h2>
            <span>Informasi lengkap data santri</span>
          </div>
          <div className="header-actions">
            <button className="btn-back" onClick={() => router.push("/admin/students")}>
              ← Kembali
            </button>
            <button className="btn-edit" onClick={() => router.push(`/admin/students/edit?id=${student.id}`)}>
              Edit
            </button>
          </div>
        </div>

        {/* PROFILE CARD */}
        <div className="profile-card">
          <div className="avatar">
            {student.name?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h3>{student.name}</h3>
            <div className="profile-meta">
              <span className={`badge ${student.gender === "L" ? "badge-gender-l" : "badge-gender-p"}`}>
                {student.gender === "L" ? "Laki-laki" : "Perempuan"}
              </span>
              {student.class?.name && (
                <span className="badge badge-kelas">{student.class.name}</span>
              )}
              {student.entryYear && (
                <span className="badge badge-tahun">TA {student.entryYear}</span>
              )}
            </div>
          </div>
        </div>

        {/* DATA PRIBADI */}
        <div className="section">
          <div className="section-header">
            <div className="dot" />
            <span>Data Pribadi</span>
          </div>
          <div className="section-body">
            <div className="info-row">
              <span className="info-label">NIS</span>
              <span className="info-value">{student.nis || <span className="muted">-</span>}</span>
            </div>
            <div className="info-row">
              <span className="info-label">NISN</span>
              <span className="info-value">{student.nisn || <span className="muted">-</span>}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tempat, Tgl Lahir</span>
              <span className="info-value">
                {student.birthplace && student.birthdate
                  ? `${student.birthplace}, ${new Date(student.birthdate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                  : <span className="muted">-</span>}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Alamat</span>
              <span className="info-value">{student.address || <span className="muted">-</span>}</span>
            </div>
          </div>
        </div>

        {/* KONTAK & WALI */}
        <div className="section">
          <div className="section-header">
            <div className="dot" />
            <span>Kontak & Wali</span>
          </div>
          <div className="section-body">
            <div className="info-row">
              <span className="info-label">No HP</span>
              <span className="info-value">{student.phone || <span className="muted">-</span>}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{student.email || <span className="muted">-</span>}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Nama Wali</span>
              <span className="info-value">{student.guardian || <span className="muted">-</span>}</span>
            </div>
          </div>
        </div>

        {/* AKADEMIK */}
        <div className="section">
          <div className="section-header">
            <div className="dot" />
            <span>Data Akademik</span>
          </div>
          <div className="section-body">
            <div className="info-row">
              <span className="info-label">Kelas</span>
              <span className="info-value">{student.class?.name || <span className="muted">-</span>}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tahun Ajaran Masuk</span>
              <span className="info-value">
                {student.entryYear || <span className="muted">Tidak diketahui</span>}
              </span>
            </div>
          </div>
        </div>

        <p className="registered-note">
          Terdaftar sejak {new Date(student.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </AdminLayout>
  )
}