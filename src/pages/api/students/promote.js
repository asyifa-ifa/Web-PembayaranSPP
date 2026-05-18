// pages/api/students/promote.js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method tidak diizinkan" })

  try {
    const { academicYear, promotions } = req.body

    if (!academicYear || !promotions || !Array.isArray(promotions)) {
      return res.status(400).json({ message: "Data tidak lengkap" })
    }

    // Validasi newClassId sebelum transaksi
    for (const p of promotions) {
      if (!p.newClassId || isNaN(parseInt(p.newClassId))) {
        return res.status(400).json({ message: `Kelas baru untuk santri ID ${p.studentId} belum dipilih` })
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const p of promotions) {
        const { studentId, newClassId, status } = p

        // Ambil kelas LAMA santri sebelum diubah
        const student = await tx.student.findUnique({
          where: { id: parseInt(studentId) },
          select: { classId: true }
        })

        // Guard: santri tidak ditemukan atau classId null
        if (!student) {
          throw new Error(`Santri ID ${studentId} tidak ditemukan`)
        }
        if (!student.classId) {
          throw new Error(`Santri ID ${studentId} belum memiliki kelas, harap assign kelas terlebih dahulu`)
        }

        // 1. Simpan kelas LAMA ke ClassHistory (upsert agar tidak duplikat)
        await tx.classHistory.upsert({
          where: {
            studentId_academicYear: {
              studentId: parseInt(studentId),
              academicYear,
            }
          },
          update: {
            classId: student.classId,
          },
          create: {
            studentId: parseInt(studentId),
            classId: student.classId,
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
    console.error("PROMOTE ERROR CODE:", e.code)
    console.error("PROMOTE ERROR META:", JSON.stringify(e.meta))
    console.error("PROMOTE ERROR MSG:", e.message)
    return res.status(500).json({ 
      message: e.message.startsWith("Santri") ? e.message : "Gagal memproses naik kelas",
      detail: e.message,
      code: e.code,
      meta: e.meta
    })
  }
}