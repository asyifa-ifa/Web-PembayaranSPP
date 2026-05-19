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

    const [pemasukan, pengeluaran] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: { amount: true }
      }),

      prisma.pengeluaran.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: { jumlah: true }
      })
    ])

    return res.status(200).json({
      totalPemasukan: pemasukan._sum.amount || 0,
      totalPengeluaran: pengeluaran._sum.jumlah || 0
    })

  } catch (error) {
    return res.status(500).json({
      message: "Gagal ambil data",
      error: error.message
    })
  }
}