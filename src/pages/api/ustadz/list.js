// pages/api/ustadz/list.js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method tidak diizinkan" })
  try {
    const ustadz = await prisma.ustadz.findMany({
      include: { class: { select: { id: true, name: true } } },
      orderBy: { name: "asc" }
    })
    return res.status(200).json(ustadz)
  } catch (e) {
    return res.status(500).json({ message: "Gagal mengambil data", detail: e.message })
  }
}