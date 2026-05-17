import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).end()

  const { id } = req.query

  try {
    const payment = await prisma.payment.findUnique({ where: { id: Number(id) } })
    if (!payment) return res.status(404).json({ message: "Payment tidak ditemukan" })
    if (payment.status === "SUCCESS") return res.status(400).json({ message: "Payment sukses tidak bisa dihapus" })

    await prisma.payment.delete({ where: { id: Number(id) } })
    return res.status(200).json({ message: "Payment berhasil dihapus" })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Gagal menghapus payment" })
  }
}