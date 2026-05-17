import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).end()

  const { id } = req.query

  try {
    const bill = await prisma.bill.findUnique({ where: { id: Number(id) } })
    if (!bill) return res.status(404).json({ message: "Tagihan tidak ditemukan" })
    if (bill.status === "PAID") return res.status(400).json({ message: "Tagihan sudah lunas, tidak bisa dihapus" })

    await prisma.bill.delete({ where: { id: Number(id) } })
    return res.status(200).json({ message: "Tagihan berhasil dihapus" })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Gagal menghapus tagihan" })
  }
}