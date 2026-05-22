import prisma from "@/lib/prisma"
import { verifyMidtransSignature } from "@/lib/midtrans"
import { sendPaymentConfirmEmail } from "@/lib/mailer"
import { notifySSE } from "./sse"

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

    // ── Verifikasi signature ──────────────────────────────────────────────
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

    // ── Cek status transaksi ──────────────────────────────────────────────
    const isSuccess =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept")

    if (!isSuccess) {
      console.log("Transaksi belum sukses:", transaction_status)

      // Jika expired/cancel, update payment → FAILED
      if (transaction_status === "expire" || transaction_status === "cancel") {
        await prisma.payment.updateMany({
          where: { gatewayRef: order_id },
          data:  { status: "FAILED" },
        })
      }

      return res.status(200).json({ message: "Transaksi belum sukses" })
    }

    // ── Cari semua payment dengan gatewayRef = order_id ──────────────────
    const payments = await prisma.payment.findMany({
      where: { gatewayRef: order_id },
      include: {
        student:     true,
        paymentType: true,
      },
    })

    if (payments.length === 0) {
      console.error("Payment tidak ditemukan untuk order_id:", order_id)
      return res.status(404).json({ message: "Payment tidak ditemukan" })
    }

    // ── Cek apakah sudah diproses sebelumnya (idempotent) ─────────────────
    const alreadyDone = payments.every(p => p.status === "SUCCESS")
    if (alreadyDone) {
      console.log("Sudah diproses sebelumnya:", order_id)
      return res.status(200).json({ message: "Sudah diproses" })
    }

    // ── Update semua payment → SUCCESS ────────────────────────────────────
    await prisma.payment.updateMany({
      where: { gatewayRef: order_id },
      data:  { status: "SUCCESS" },
    })

    // ── Update bill → PAID ────────────────────────────────────────────────
    for (const payment of payments) {
      if (payment.billId) {
        // ✅ Langsung update bill yang spesifik via billId
        await prisma.bill.update({
          where: { id: payment.billId },
          data:  { status: "PAID" },
        })
        console.log(`✅ Bill #${payment.billId} → PAID (via billId)`)
      } else {
        // Fallback untuk data lama yang belum punya billId
        const bill = await prisma.bill.findFirst({
          where: {
            studentId:     payment.studentId,
            paymentTypeId: payment.paymentTypeId,
            status:        "UNPAID",
          },
          orderBy: { createdAt: "asc" }, // ambil yang paling lama dulu
        })

        if (bill) {
          await prisma.bill.update({
            where: { id: bill.id },
            data:  { status: "PAID" },
          })
          console.log(`✅ Bill #${bill.id} → PAID (via fallback)`)
        } else {
          console.warn(`⚠️ Tidak ada bill UNPAID untuk payment #${payment.id}`)
        }
      }
    }

    // ── Kirim email konfirmasi ─────────────────────────────────────────────
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
      // Tidak throw — email gagal tidak boleh gagalkan callback
    }

    // ── Notifikasi SSE ke client ───────────────────────────────────────────
    notifySSE(order_id, {
      studentId: firstPayment.studentId,
      message:   "Pembayaran berhasil dikonfirmasi",
    })

    return res.status(200).json({ message: "OK" })

  } catch (error) {
    console.error("MIDTRANS CALLBACK ERROR:", error)
    return res.status(500).json({ message: "Error: " + error.message })
  }
}