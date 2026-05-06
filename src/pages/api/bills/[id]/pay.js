import prisma from "@/lib/prisma"
import { sendPaymentConfirmEmail } from "@/lib/mailer"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const billId = Number(req.query.id)
  const { method, note } = req.body

  try {
    // 1. Ambil bill + data santri
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        student: true,
        paymentType: true,
      },
    })

    if (!bill) return res.status(404).json({ message: "Tagihan tidak ditemukan" })
    if (bill.status === "PAID") return res.status(400).json({ message: "Tagihan sudah lunas" })

    // 2. Update status bill jadi PAID
    await prisma.bill.update({
      where: { id: billId },
      data: { status: "PAID" },
    })

    // 3. Simpan ke tabel Payment sebagai riwayat
    await prisma.payment.create({
      data: {
        studentId: bill.studentId,
        paymentTypeId: bill.paymentTypeId,
        amount: bill.amount,
        method: method || "CASH",
        status: "SUCCESS",
        note: note || null,
      },
    })

    // 4. Kirim email konfirmasi ke santri
    try {
      await sendPaymentConfirmEmail(
        bill.student.email,
        bill.student.name,
        bill.paymentType.name,
        bill.amount
      )
    } catch (mailErr) {
      console.error("Email gagal:", mailErr.message)
    }

    return res.status(200).json({ message: "Pembayaran berhasil dikonfirmasi" })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Gagal konfirmasi pembayaran" })
  }
}