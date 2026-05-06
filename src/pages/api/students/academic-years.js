// pages/api/students/academic-years.js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method tidak diizinkan" })

  try {
    // Ambil semua tahun ajaran unik dari ClassHistory
    const years = await prisma.classHistory.findMany({
      select: { academicYear: true },
      distinct: ["academicYear"],
      orderBy: { academicYear: "desc" }
    })

    return res.status(200).json(years.map(y => y.academicYear))
  } catch (e) {
    return res.status(500).json({ message: "Gagal mengambil data", detail: e.message })
  }
}