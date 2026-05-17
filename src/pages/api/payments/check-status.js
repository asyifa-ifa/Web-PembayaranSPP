import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  try {
    const { orderId } = req.body

    if (!orderId) return res.status(400).json({ message: "orderId required" })

    const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY
    const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true"
    const BASE_URL = IS_PRODUCTION
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2"

    const authHeader = "Basic " + Buffer.from(SERVER_KEY + ":").toString("base64")

    // Cek status ke Midtrans
    const response = await fetch(`${BASE_URL}/${orderId}/status`, {
      headers: { Authorization: authHeader },
    })

    const data = await response.json()
    console.log("CHECK STATUS MIDTRANS:", data)

    const { transaction_status, fraud_status } = data

    const isSuccess =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept")

    if (!isSuccess) {
      return res.status(200).json({ status: transaction_status, updated: false })
    }

    // Cari payment
    const payment = await prisma.payment.findFirst({
      where: { gatewayRef: orderId },
      include: { student: true, paymentType: true },
    })

    if (!payment) return res.status(404).json({ message: "Payment tidak ditemukan" })

    if (payment.status === "SUCCESS") {
      return res.status(200).json({ status: "settlement", updated: false, alreadySuccess: true })
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

    return res.status(200).json({ status: "settlement", updated: true })
  } catch (error) {
    console.error("CHECK STATUS ERROR:", error)
    return res.status(500).json({ message: "Error" })
  }
}