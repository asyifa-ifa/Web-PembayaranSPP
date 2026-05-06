import prisma from "@/lib/prisma"
import { getSession } from "next-auth/react"

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) return res.status(401).json({ error: "Unauthorized" })

  const year = Number(req.query.year)
  const month = Number(req.query.month)
  if (!year || !month) return res.status(400).json({ error: "year and month required" })

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  const payments = await prisma.payment.findMany({
    where: {
      category: "SPP",
      createdAt: { gte: start, lt: end },
    },
    include: { student: { include: { class: true } } },
  })

  // hitung total per kelas
  const totals = {}
  payments.forEach(p => {
    const cname = p.student.class.name
    totals[cname] = (totals[cname] || 0) + p.amount
  })

  const result = Object.entries(totals).map(([kelas, total]) => ({ kelas, total }))
  res.json(result)
}
