// pages/api/ustadz/create.js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method tidak diizinkan" })
  try {
    const { name, jabatan, phone, email, address, subjects, classId } = req.body

    if (!name) return res.status(400).json({ message: "Nama wajib diisi" })

    // Cek apakah kelas sudah punya wali kelas lain
    if (classId) {
      const existing = await prisma.ustadz.findFirst({
        where: { classId: parseInt(classId) }
      })
      if (existing) {
        return res.status(400).json({ message: `Kelas ini sudah punya wali kelas: ${existing.name}` })
      }
    }

    const ustadz = await prisma.ustadz.create({
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
    console.error(e)
    return res.status(500).json({ message: "Gagal menyimpan", detail: e.message })
  }
}