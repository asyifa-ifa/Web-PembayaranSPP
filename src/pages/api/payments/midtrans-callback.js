import prisma from "@/lib/prisma"
import { verifyMidtransSignature } from "@/lib/midtrans"
import { sendPaymentConfirmEmail } from "@/lib/mailer"
import { notifySSE } from "./sse" // ← import fungsi notifikasi SSE

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
      orderId:      order_id,
      statusCode:   status_code,
      grossAmount:  gross_amount,
      signatureKey: signature_key,
    })

    if (!valid) {
      console.error("Signature tidak valid!")
      return res.status(400).json({ message: "Invalid signature" })
    }

    // Cek status transaksi
    // settlement = sukses transfer/VA, capture = sukses kartu kredit
    const isSuccess =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept")

    if (!isSuccess) {
      console.log("Transaksi belum sukses:", transaction_status)
      return res.status(200).json({ message: "Transaksi belum sukses" })
    }

    // Cari SEMUA payment dengan gatewayRef = order_id
    // (bisa lebih dari 1 untuk bulk payment)
    const payments = await prisma.payment.findMany({
      where: { gatewayRef: order_id },
      include: {
        student:     true,
        paymentType: true,
      },
    })

    if (payments.length === 0) {
      return res.status(404).json({ message: "Payment tidak ditemukan" })
    }

    // Cek apakah sudah diproses sebelumnya
    const alreadyDone = payments.every(p => p.status === "SUCCESS")
    if (alreadyDone) {
      return res.status(200).json({ message: "Sudah diproses" })
    }

    // Update SEMUA payment → SUCCESS
    await prisma.payment.updateMany({
      where: { gatewayRef: order_id },
      data:  { status: "SUCCESS" },
    })

    // Update bill → PAID untuk setiap payment
    for (const payment of payments) {
      const bill = await prisma.bill.findFirst({
        where: {
          studentId:     payment.studentId,
          paymentTypeId: payment.paymentTypeId,
          status:        "UNPAID",
        },
      })

      if (bill) {
        await prisma.bill.update({
          where: { id: bill.id },
          data:  { status: "PAID" },
        })
      }
    }

    // Kirim email konfirmasi (pakai data payment pertama)
    const firstPayment = payments[0]
    try {
      await sendPaymentConfirmEmail(
        firstPayment.student.email,
        firstPayment.student.name,
        payments.length > 1
          ? `${payments.length} Tagihan (Bulk Payment)`
          : firstPayment.paymentType.name,
        payments.reduce((sum, p) => sum + p.amount, 0)
      )
    } catch (mailErr) {
      console.error("Email gagal:", mailErr.message)
    }

    // ── REALTIME: Kirim notifikasi SSE ke client yang menunggu ──
    // Ini yang membuat UI santri & admin update otomatis tanpa refresh!
    notifySSE(order_id, {
      studentId: firstPayment.studentId,
      message:   "Pembayaran berhasil dikonfirmasi",
    })

    return res.status(200).json({ message: "OK" })

  } catch (error) {
    console.error("MIDTRANS CALLBACK ERROR:", error)
    return res.status(500).json({ message: "Error" })
  }
}