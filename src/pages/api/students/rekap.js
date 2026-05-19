// pages/api/students/rekap.js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method tidak diizinkan" })

  try {
    const { academicYear, classId } = req.query

    if (!academicYear) {
      return res.status(400).json({ message: "academicYear wajib diisi" })
    }

    const where = { entryYear: academicYear }

    // ✅ Filter kelas kalau ada
    if (classId) {
      where.classId = parseInt(classId)
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        name: true,
        nis: true,
        nisn: true,
        gender: true,
        guardian: true,
        entryYear: true,
        status: true,
        class: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { class: { name: "asc" } },
        { name: "asc" }
      ]
    })

    const result = students.map(s => ({
      id: s.id,
      student: s,
      class: s.class,
    }))

    return res.status(200).json(result)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Gagal mengambil rekap", detail: e.message })
  }
}