import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method tidak diizinkan" })
  }

  try {
    const { academicYear, classId } = req.query

    if (!academicYear) {
      return res.status(400).json({ message: "academicYear wajib diisi" })
    }

    const where = { academicYear }

    if (classId) {
      where.classId = parseInt(classId)
    }

    const histories = await prisma.classHistory.findMany({
      where,
      include: {
        student: true,
        class: true
      },
      orderBy: [
        { class: { name: "asc" } },
        { student: { name: "asc" } }
      ]
    })

    const result = histories.map(h => ({
      id: h.id,
      student: {
        id: h.student.id,
        name: h.student.name,
        nis: h.student.nis,
        nisn: h.student.nisn,
        gender: h.student.gender,
        guardian: h.student.guardian,
        entryYear: h.student.entryYear,
        status: h.student.status
      },
      class: {
        id: h.class.id,
        name: h.class.name
      }
    }))

    res.status(200).json(result)

  } catch (e) {
    console.error(e)
    res.status(500).json({
      message: "Gagal mengambil rekap",
      detail: e.message
    })
  }
}