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

    // Ambil semua data santri SEBELUM transaksi (hindari timeout)
    const studentIds = promotions.map(p => parseInt(p.studentId))
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, classId: true }
    })

    const studentMap = {}
    for (const s of students) {
      studentMap[s.id] = s
    }

    // Validasi classId sebelum transaksi
    for (const p of promotions) {
      const student = studentMap[parseInt(p.studentId)]
      if (!student) {
        return res.status(400).json({ message: `Santri ID ${p.studentId} tidak ditemukan` })
      }
      if (!student.classId) {
        return res.status(400).json({ message: `Santri ID ${p.studentId} belum memiliki kelas` })
      }
    }

    // Transaksi: hanya write operations
    await prisma.$transaction(
      promotions.map(p => {
        const student = studentMap[parseInt(p.studentId)]
        return prisma.classHistory.upsert({
          where: {
            studentId_academicYear: {
              studentId: parseInt(p.studentId),
              academicYear,
            }
          },
          update: { classId: student.classId },
          create: {
            studentId: parseInt(p.studentId),
            classId: student.classId,
            academicYear,
          }
        })
      }).concat(
        promotions.map(p => prisma.student.update({
          where: { id: parseInt(p.studentId) },
          data: {
            classId: parseInt(p.newClassId),
            status: p.status || "ACTIVE",
          }
        }))
      )
    )

    return res.status(200).json({ message: `Berhasil memproses ${promotions.length} santri` })
  } catch (e) {
    console.error("PROMOTE ERROR CODE:", e.code)
    console.error("PROMOTE ERROR META:", JSON.stringify(e.meta))
    console.error("PROMOTE ERROR MSG:", e.message)
    return res.status(500).json({ 
      message: "Gagal memproses naik kelas",
      detail: e.message,
      code: e.code,
      meta: e.meta
    })
  }
}