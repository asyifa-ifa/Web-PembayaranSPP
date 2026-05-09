// pages/api/dashboard/pengeluaran-grafik.js
import prisma from "@/lib/prisma"

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const year = parseInt(req.query.year) || new Date().getFullYear()

  try {
    // Ambil semua pengeluaran dalam tahun tersebut
    const data = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31, 23, 59, 59),
        }
      },
      select: { amount: true, date: true }
    })

    // Group per bulan
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      bulan: MONTHS[i],
      pengeluaran: 0,
    }))

    data.forEach(item => {
      const month = new Date(item.date).getMonth() // 0-11
      monthly[month].pengeluaran += item.amount
    })

    // Hanya return bulan yang sudah lewat + bulan ini (agar grafik tidak kosong di kanan)
    const currentMonth = new Date().getFullYear() === year
      ? new Date().getMonth()
      : 11

    return res.status(200).json(monthly.slice(0, currentMonth + 1))
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}