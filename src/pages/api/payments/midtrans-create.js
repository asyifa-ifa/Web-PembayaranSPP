import prisma from "@/lib/prisma"
import { createMidtransTransaction } from "@/lib/midtrans"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  try {
    const { billId } = req.body

    // Ambil data tagihan
    const bill = await prisma.bill.findUnique({
      where: { id: Number(billId) },
      include: {
        student: true,
        paymentType: true,
      },
    })

    if (!bill) return res.status(404).json({ message: "Tagihan tidak ditemukan" })
    if (bill.status === "PAID") return res.status(400).json({ message: "Tagihan sudah lunas" })

    const orderId = `SPP-${bill.id}-${Date.now()}`

    // Buat transaksi Snap Midtrans
    const snap = await createMidtransTransaction({
      orderId,
      amount: bill.amount,
      productDetails: `Pembayaran ${bill.paymentType.name} - ${bill.student.name}`,
      email: bill.student.email,
      name: bill.student.name,
      returnUrl: `${process.env.NEXTAUTH_URL}/santri/dashboard`,
    })

    if (!snap.redirect_url) {
      return res.status(500).json({ message: "Gagal membuat transaksi Midtrans", detail: snap })
    }

    // Simpan ke tabel Payment sebagai PENDING
    await prisma.payment.create({
      data: {
        studentId: bill.studentId,
        paymentTypeId: bill.paymentTypeId,
        amount: bill.amount,
        method: "TRANSFER",
        status: "PENDING",
        gatewayRef: orderId,
      },
    })

    return res.status(200).json({
      paymentUrl: snap.redirect_url,   // sama seperti duitku: paymentUrl
      token: snap.token,               // bisa dipakai untuk Snap popup
      orderId,
    })
  } catch (error) {
    console.error("MIDTRANS CREATE ERROR:", error)
    return res.status(500).json({ message: "Gagal membuat pembayaran" })
  }
}