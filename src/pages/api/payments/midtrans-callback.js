import prisma from "@/lib/prisma"
import { verifyMidtransSignature } from "@/lib/midtrans"
import { sendPaymentConfirmEmail } from "@/lib/mailer"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  try {
    const {
      order_id,
      status_code,
      gross_amount,
      transaction_status,
      fraud_status,
      signature_key,
    } = req.body

    console.log("MIDTRANS CALLBACK:", req.body)

    // Verifikasi signature
    const valid = verifyMidtransSignature({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
    })

    if (!valid) {
      console.error("Signature tidak valid!")
      return res.status(400).json({ message: "Invalid signature" })
    }

    // Cek status transaksi
    // settlement = sukses transfer/VA, capture = sukses kartu kredit
    const isSuccess =
      (transaction_status === "settlement") ||
      (transaction_status === "capture" && fraud_status === "accept")

    if (!isSuccess) {
      console.log("Transaksi belum sukses:", transaction_status)
      return res.status(200).json({ message: "Transaksi belum sukses" })
    }

    // Cari payment berdasarkan order_id
    const payment = await prisma.payment.findFirst({
      where: { gatewayRef: order_id },
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

    // Update payment → SUCCESS
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESS" },
    })

    // Update bill → PAID
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
    console.error("MIDTRANS CALLBACK ERROR:", error)
    return res.status(500).json({ message: "Error" })
  }
}