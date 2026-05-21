import prisma from "@/lib/prisma"
import { createSnapToken } from "@/lib/midtrans"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  try {
    const { billId, billIds } = req.body

    // ── BULK PAYMENT (billIds array) ──────────────────────────────────────
    if (billIds && Array.isArray(billIds) && billIds.length > 0) {
      const bills = await prisma.bill.findMany({
        where: {
          id: { in: billIds.map(Number) },
          status: "UNPAID",
        },
        include: {
          student: true,
          paymentType: true,
        },
      })

      if (bills.length === 0) {
        return res.status(404).json({ message: "Tagihan tidak ditemukan" })
      }

      const student     = bills[0].student
      const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0)
      const orderId     = `SPP-BULK-${Date.now()}`

      const itemDetails = bills.map(b => ({
        id:       String(b.id),
        price:    Number(b.amount),
        quantity: 1,
        name:     `${b.paymentType.name} - ${b.student.name}`.slice(0, 50),
      }))

      // Pakai createSnapToken → hanya return token, bukan redirect_url
      const snap = await createSnapToken({
        orderId,
        amount:         totalAmount,
        productDetails: `Pembayaran ${bills.length} Tagihan - ${student.name}`,
        email:          student.email,
        name:           student.name,
        itemDetails,
      })

      if (!snap.token) {
        return res.status(500).json({ message: "Gagal membuat transaksi Midtrans", detail: snap })
      }

      // Simpan semua payment sebagai PENDING
      await prisma.payment.createMany({
        data: bills.map(b => ({
          studentId:     b.studentId,
          paymentTypeId: b.paymentTypeId,
          amount:        b.amount,
          method:        "TRANSFER",
          status:        "PENDING",
          gatewayRef:    orderId,
        })),
      })

      return res.status(200).json({
        snapToken: snap.token, // ← dikirim ke frontend untuk window.snap.pay()
        orderId,
      })
    }

    // ── SINGLE PAYMENT (billId) ───────────────────────────────────────────
    if (!billId) {
      return res.status(400).json({ message: "billId atau billIds wajib diisi" })
    }

    const bill = await prisma.bill.findUnique({
      where: { id: Number(billId) },
      include: {
        student:     true,
        paymentType: true,
      },
    })

    if (!bill)                  return res.status(404).json({ message: "Tagihan tidak ditemukan" })
    if (bill.status === "PAID") return res.status(400).json({ message: "Tagihan sudah lunas" })

    const orderId = `SPP-${bill.id}-${Date.now()}`

    // Pakai createSnapToken → hanya return token
    const snap = await createSnapToken({
      orderId,
      amount:         bill.amount,
      productDetails: `Pembayaran ${bill.paymentType.name} - ${bill.student.name}`,
      email:          bill.student.email,
      name:           bill.student.name,
    })

    if (!snap.token) {
      return res.status(500).json({ message: "Gagal membuat transaksi Midtrans", detail: snap })
    }

    await prisma.payment.create({
      data: {
        studentId:     bill.studentId,
        paymentTypeId: bill.paymentTypeId,
        amount:        bill.amount,
        method:        "TRANSFER",
        status:        "PENDING",
        gatewayRef:    orderId,
      },
    })

    return res.status(200).json({
      snapToken: snap.token, // ← dikirim ke frontend untuk window.snap.pay()
      orderId,
    })

  } catch (error) {
    console.error("MIDTRANS CREATE ERROR:", error)
    return res.status(500).json({ message: "Gagal membuat pembayaran" })
  }
}