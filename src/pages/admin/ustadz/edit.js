// pages/admin/ustadz/edit.js
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import AdminLayout from "@/components/AdminLayout"
import { UstadzForm } from "./new"

export default function EditUstadz() {
  const router = useRouter()
  const { id } = router.query
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subjectInput, setSubjectInput] = useState("")

  const [form, setForm] = useState({
    name: "", jabatan: "", phone: "", email: "",
    address: "", subjects: [], classId: "",
  })

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  function addSubject() {
    const val = subjectInput.trim()
    if (!val) return
    if (form.subjects.includes(val)) { setSubjectInput(""); return }
    setForm(prev => ({ ...prev, subjects: [...prev.subjects, val] }))
    setSubjectInput("")
  }

  function removeSubject(s) {
    setForm(prev => ({ ...prev, subjects: prev.subjects.filter(x => x !== s) }))
  }

  useEffect(() => {
    if (!router.isReady) return
    Promise.all([
      fetch("/api/classes/list").then(r => r.json()),
      fetch(`/api/ustadz/${id}`).then(r => r.json()),
    ]).then(([cls, u]) => {
      setClasses(cls)
      setForm({
        name: u.name || "",
        jabatan: u.jabatan || "",
        phone: u.phone || "",
        email: u.email || "",
        address: u.address || "",
        subjects: u.subjects || [],
        classId: u.classId ? String(u.classId) : "",
      })
    }).catch(e => alert("Gagal memuat: " + e.message))
    .finally(() => setLoading(false))
  }, [router.isReady, id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return alert("Nama wajib diisi")
    setSaving(true)
    try {
      const res = await fetch(`/api/ustadz/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, classId: form.classId || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      alert("Data berhasil diupdate!")
      router.push("/admin/ustadz")
    } catch (e) {
      alert("Error: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout><p style={{ padding: 40, color: "#7a9a85" }}>Memuat data...</p></AdminLayout>

  return (
    <AdminLayout>
      <UstadzForm
        title="Edit Data Ustadz"
        subtitle="Perbarui informasi ustadz"
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