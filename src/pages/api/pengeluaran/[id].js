// pages/api/pengeluaran/[id].js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  const { id } = req.query
  const numId = parseInt(id)
  if (isNaN(numId)) return res.status(400).json({ message: "ID tidak valid" })

  if (req.method === "GET") {
    try {
      const item = await prisma.expense.findUnique({ where: { id: numId } })
      if (!item) return res.status(404).json({ message: "Data tidak ditemukan" })
      return res.status(200).json(item)
    } catch (e) {
      return res.status(500).json({ message: e.message })
    }
  }

  if (req.method === "PUT") {
    try {
      const { title, amount, note, date, receiptUrl } = req.body
      if (!title || !amount || !date) return res.status(400).json({ message: "Data tidak lengkap" })
      const item = await prisma.expense.update({
        where: { id: numId },
        data: {
          title,
          amount: parseInt(amount),
          note: note || null,
          date: new Date(date),
          receiptUrl: receiptUrl || null,
        },
      })
      return res.status(200).json(item)
    } catch (e) {
      return res.status(500).json({ message: e.message })
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.expense.delete({ where: { id: numId } })
      return res.status(200).json({ message: "Berhasil dihapus" })
    } catch (e) {
      return res.status(500).json({ message: e.message })
    }
  }

  return res.status(405).end()
}