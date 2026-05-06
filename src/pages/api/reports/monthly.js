// src/pages/api/reports/monthly.js
// Tetap dipertahankan agar tidak breaking change,
// tapi sekarang memanggil logika yang sama dengan summary.js

import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req, res) {
  // ✅ Fix: gunakan getServerSession bukan getSession dari next-auth/react
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: "Unauthorized" })

  const { year, month } = req.query
  if (!year || !month) return res.status(400).json({ error: "year dan month diperlukan" })

  const start = new Date(Number(year), Number(month) - 1, 1)
  const end   = new Date(Number(year), Number(month), 1)

  try {
    const totals = await prisma.payment.groupBy({
      by: ["category"],
      where: { createdAt: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
    })

    const totalAll = totals.reduce((sum, t) => sum + (t._sum.amount || 0), 0)

    res.status(200).json({
      month: `${year}-${month}`,
      totals,
      totalAll,
    })
  } catch (err) {
    console.error("[/api/reports/monthly]", err)
    res.status(500).json({ error: "Terjadi kesalahan server", detail: err.message })
  }
}