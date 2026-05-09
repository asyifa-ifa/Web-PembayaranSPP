// pages/api/pengeluaran/create.js
import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()
  try {
    const { title, amount, note, date, receiptUrl } = req.body
    if (!title || !amount || !date) return res.status(400).json({ message: "Data tidak lengkap" })
    const item = await prisma.expense.create({
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