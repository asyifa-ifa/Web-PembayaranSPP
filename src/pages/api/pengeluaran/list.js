// pages/api/pengeluaran/list.js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()
  try {
    const { month, year } = req.query
    const m = parseInt(month) || new Date().getMonth() + 1
    const y = parseInt(year) || new Date().getFullYear()

    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0, 23, 59, 59)

    const data = await prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "desc" }
    })
    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}