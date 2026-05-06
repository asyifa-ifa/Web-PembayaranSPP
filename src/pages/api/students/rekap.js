// pages/api/students/rekap.js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method tidak diizinkan" })

  try {
    const { academicYear } = req.query

    if (!academicYear) {
      return res.status(400).json({ message: "academicYear wajib diisi" })
    }

    // Ambil semua ClassHistory di tahun ajaran ini
    const histories = await prisma.classHistory.findMany({
      where: { academicYear },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nisn: true,
            gender: true,
            guardian: true,
            entryYear: true,
            status: true,
          }
        },
        class: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { class: { name: "asc" } },
        { student: { name: "asc" } }
      ]
    })

    return res.status(200).json(histories)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Gagal mengambil rekap", detail: e.message })
  }
}