import prisma from "@/lib/prisma"
import { verifyDuitkuCallback } from "@/lib/duitku"
import { sendPaymentConfirmEmail } from "@/lib/mailer"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  try {
    const {
      merchantCode,
      amount,
      merchantOrderId,
      resultCode,
      signature,
    } = req.body

    console.log("DUITKU CALLBACK:", req.body)

    // Verifikasi signature
    const valid = verifyDuitkuCallback({ merchantCode, amount, merchantOrderId, signature })
    if (!valid) {
      console.error("Signature tidak valid!")
      return res.status(400).json({ message: "Invalid signature" })
    }

    // Cek apakah sukses (resultCode 00 = sukses)
    if (resultCode !== "00") {
      return res.status(200).json({ message: "Pembayaran tidak sukses" })
    }

    // Cari payment berdasarkan merchantOrderId
    const payment = await prisma.payment.findFirst({
      where: { gatewayRef: merchantOrderId },
      include: {
        student: true,
        paymentType: true,
      },
    })

    if (!payment) {
      return res.status(404).json({ message: "Payment tidak ditemukan" })
    }

    if (payment.status === "SUCCESS") {
      return res.status(200).json({ message: "Sudah diproses" })
    }

    // Update payment jadi SUCCESS
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS" },
    })

    // Update bill jadi PAID
    // Cari bill yang cocok
    const bill = await prisma.bill.findFirst({
      where: {
        studentId: payment.studentId,
        paymentTypeId: payment.paymentTypeId,
        status: "UNPAID",
      },
    })

    if (bill) {
      await prisma.bill.update({
        where: { id: bill.id },
        data: { status: "PAID" },
      })
    }

    // Kirim email konfirmasi
    try {
      await sendPaymentConfirmEmail(
        payment.student.email,
        payment.student.name,
        payment.paymentType.name,
        payment.amount
      )
    } catch (mailErr) {
      console.error("Email gagal:", mailErr.message)
    }

    return res.status(200).json({ message: "OK" })
  } catch (error) {
    console.error("CALLBACK ERROR:", error)
    return res.status(500).json({ message: "Error" })
  }
}