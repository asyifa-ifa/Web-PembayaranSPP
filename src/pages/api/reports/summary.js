import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: "Unauthorized" })

  const { type = "monthly", year, month } = req.query

  try {
    let start = new Date(Number(year), Number(month) - 1, 1)
    let end   = new Date(Number(year), Number(month), 1)

    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: start, lt: end }
      },
      include: {
        paymentType: true
      }
    })

    // 🔥 grouping manual (fix category error)
    const map = {}

    payments.forEach(p => {
      const key = p.paymentType?.name || "Lainnya"

      if (!map[key]) {
        map[key] = {
          category: key,
          total: 0,
          count: 0
        }
      }

      map[key].total += p.amount
      map[key].count += 1
    })

    const totals = Object.values(map)

    const totalAll = totals.reduce((sum, t) => sum + t.total, 0)

    const santri = new Set(payments.map(p => p.studentId))

    res.status(200).json({
      totals,
      totalAll,
      jumlahSantri: santri.size,
      periodeLabel: `${month}/${year}`
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}