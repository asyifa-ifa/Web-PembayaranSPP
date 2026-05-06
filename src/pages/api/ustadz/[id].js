// pages/api/ustadz/[id].js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === "GET") {
    try {
      const ustadz = await prisma.ustadz.findUnique({
        where: { id: parseInt(id) },
        include: { class: { select: { id: true, name: true } } }
      })
      if (!ustadz) return res.status(404).json({ message: "Tidak ditemukan" })
      return res.status(200).json(ustadz)
    } catch (e) {
      return res.status(500).json({ message: "Gagal mengambil data", detail: e.message })
    }
  }

  if (req.method === "PUT") {
    try {
      const { name, jabatan, phone, email, address, subjects, classId } = req.body

      // Cek wali kelas duplikat (kecuali diri sendiri)
      if (classId) {
        const existing = await prisma.ustadz.findFirst({
          where: { classId: parseInt(classId), NOT: { id: parseInt(id) } }
        })
        if (existing) {
          return res.status(400).json({ message: `Kelas ini sudah punya wali kelas: ${existing.name}` })
        }
      }

      const ustadz = await prisma.ustadz.update({
        where: { id: parseInt(id) },
        data: {
          name,
          jabatan: jabatan || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          subjects: Array.isArray(subjects) ? subjects : [],
          classId: classId ? parseInt(classId) : null,
        }
      })
      return res.status(200).json(ustadz)
    } catch (e) {
      return res.status(500).json({ message: "Gagal update", detail: e.message })
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.ustadz.delete({ where: { id: parseInt(id) } })
      return res.status(200).json({ message: "Berhasil dihapus" })
    } catch (e) {
      return res.status(500).json({ message: "Gagal menghapus", detail: e.message })
    }
  }

  return res.status(405).json({ message: "Method tidak diizinkan" })
}