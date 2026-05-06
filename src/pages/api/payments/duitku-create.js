import prisma from "@/lib/prisma"
import { createDuitkuInvoice } from "@/lib/duitku"

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

    const merchantOrderId = `SPP-${bill.id}-${Date.now()}`

    // Buat invoice ke Duitku
    const invoice = await createDuitkuInvoice({
      merchantOrderId,
      amount: bill.amount,
      productDetails: `Pembayaran ${bill.paymentType.name} - ${bill.student.name}`,
      email: bill.student.email,
      name: bill.student.name,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/payments/duitku-callback`,
      returnUrl: `${process.env.NEXTAUTH_URL}/santri/dashboard`,
    })

    if (!invoice.paymentUrl) {
      return res.status(500).json({ message: "Gagal membuat invoice Duitku", detail: invoice })
    }

    // Simpan ke tabel Payment sebagai PENDING
    await prisma.payment.create({
      data: {
        studentId: bill.studentId,
        paymentTypeId: bill.paymentTypeId,
        amount: bill.amount,
        method: "TRANSFER",
        status: "PENDING",
        gatewayRef: merchantOrderId,
      },
    })

    return res.status(200).json({
      paymentUrl: invoice.paymentUrl,
      merchantOrderId,
    })
  } catch (error) {
    console.error("DUITKU ERROR:", error)
    return res.status(500).json({ message: "Gagal membuat pembayaran" })
  }
}