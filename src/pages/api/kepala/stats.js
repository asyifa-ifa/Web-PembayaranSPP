// pages/api/kepala/stats.js
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/pages/api/auth/[...nextauth]"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== "KEPALA") {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const [totalSantri, totalUstadz, pemasukanBulanIni, tagihanUnpaid] = await Promise.all([
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.ustadz.count(),
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { amount: true }
      }),
      prisma.bill.aggregate({
        where: { status: "UNPAID" },
        _count: true,
        _sum: { amount: true }
      }),
    ])

    return res.status(200).json({
      totalSantri,
      totalUstadz,
      pemasukanBulanIni: pemasukanBulanIni._sum.amount || 0,
      tagihanUnpaid: tagihanUnpaid._count,
      totalUnpaid: tagihanUnpaid._sum.amount || 0,
    })
  } catch (e) {
    return res.status(500).json({ message: "Gagal", detail: e.message })
  }
}