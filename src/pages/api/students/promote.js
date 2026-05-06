// pages/api/students/promote.js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method tidak diizinkan" })

  try {
    const { academicYear, promotions } = req.body

    if (!academicYear || !promotions || !Array.isArray(promotions)) {
      return res.status(400).json({ message: "Data tidak lengkap" })
    }

    await prisma.$transaction(async (tx) => {
      for (const p of promotions) {
        const { studentId, newClassId, status } = p

        // Ambil kelas LAMA santri sebelum diubah
        const student = await tx.student.findUnique({
          where: { id: parseInt(studentId) },
          select: { classId: true }
        })

        // 1. Simpan kelas LAMA ke ClassHistory (ini yang jadi rekap tahun ini)
        await tx.classHistory.create({
          data: {
            studentId: parseInt(studentId),
            classId: student.classId, // ← kelas LAMA, bukan kelas baru
            academicYear,
          }
        })

        // 2. Update Student ke kelas BARU
        await tx.student.update({
          where: { id: parseInt(studentId) },
          data: {
            classId: parseInt(newClassId),
            status: status || "ACTIVE",
          }
        })
      }
    })

    return res.status(200).json({ message: `Berhasil memproses ${promotions.length} santri` })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Gagal memproses naik kelas", detail: e.message })
  }
}