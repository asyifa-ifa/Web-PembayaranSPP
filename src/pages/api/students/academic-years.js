// pages/api/students/academic-years.js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method tidak diizinkan" })

  try {
    // ✅ Ambil tahun unik dari entryYear di tabel Student
    const years = await prisma.student.findMany({
      select: { entryYear: true },
      distinct: ["entryYear"],
      orderBy: { entryYear: "desc" },
      where: { entryYear: { not: null } }
    })

    return res.status(200).json(years.map(y => y.entryYear))
  } catch (e) {
    return res.status(500).json({ message: "Gagal mengambil data", detail: e.message })
  }
}