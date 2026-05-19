import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/pages/api/auth/[...nextauth]"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== "KEPALA") {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    // ✅ TOTAL PEMASUKAN
    const totalPemasukan = await prisma.payment.aggregate({
      where: {
        status: "SUCCESS"
      },
      _sum: {
        amount: true
      }
    })

    // ✅ TOTAL PENGELUARAN (PAKAI expense ✅)
    const totalPengeluaran = await prisma.expense.aggregate({
      _sum: {
        amount: true
      }
    })

    return res.status(200).json({
      totalPemasukan: totalPemasukan._sum.amount || 0,
      totalPengeluaran: totalPengeluaran._sum.amount || 0,
    })

  } catch (e) {
    return res.status(500).json({
      message: "Gagal",
      detail: e.message
    })
  }
}