// pages/api/pengeluaran/[id].js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  const { id } = req.query
  const numId = parseInt(id)

  if (req.method === "PUT") {
    try {
      const { title, amount, note, date, receiptUrl } = req.body
      const item = await prisma.expense.update({
        where: { id: numId },
        data: {
          title,
          amount: parseInt(amount),
          note: note || null,
          date: new Date(date),
          ...(receiptUrl !== undefined && { receiptUrl: receiptUrl || null }),
        }
      })
      return res.status(200).json(item)
    } catch (e) {
      return res.status(500).json({ message: e.message })
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.expense.delete({ where: { id: numId } })
      return res.status(200).json({ success: true })
    } catch (e) {
      return res.status(500).json({ message: e.message })
    }
  }

  return res.status(405).end()
}