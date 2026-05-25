import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  try {
    const { studentId, items } = req.body

    if (!studentId || !items || items.length === 0) {
      return res.status(400).json({ message: "Data tidak lengkap" })
    }

    const bills = await Promise.all(
      items.map(item =>
        prisma.bill.create({
          data: {
            studentId: Number(studentId),
            paymentTypeId: Number(item.paymentTypeId),
            amount: Number(item.amount),
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            status: "UNPAID",
            month: item.month || null,
            academicYear: item.academicYear || null,
          },
        })
      )
    )

    return res.status(201).json({ message: "Tagihan berhasil dibuat", bills })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Gagal membuat tagihan" })
  }
}