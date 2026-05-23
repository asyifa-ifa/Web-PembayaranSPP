// pages/api/payments/midtrans-check.js
// Dipanggil dari frontend: POST /api/payments/midtrans-check?billId=xxx

import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { billId } = req.query;

  if (!billId) {
    return res.status(400).json({ message: "billId wajib diisi" });
  }

  try {
    // 1. Ambil bill + payment terakhir
    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(billId) },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        paymentType: true,
        student: true,
      },
    });

    if (!bill) {
      return res.status(404).json({ message: "Tagihan tidak ditemukan" });
    }

    const lastPayment = bill.payments[0];

    // Belum pernah klik Bayar
    if (!lastPayment || !lastPayment.gatewayRef) {
      return res.status(200).json({
        transactionStatus: "not_found",
        message: "Belum ada transaksi untuk tagihan ini. Silakan klik Bayar terlebih dahulu.",
      });
    }

    const orderId = lastPayment.gatewayRef;

    // 2. Cek status ke Midtrans API
    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProduction
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";

    const authString = Buffer.from(`${midtransServerKey}:`).toString("base64");

    const midtransRes = await fetch(`${baseUrl}/v2/${orderId}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
    });

    const midtransData = await midtransRes.json();

    // 3. Jika settlement/capture → update DB
    const isSuccess =
      midtransData.transaction_status === "settlement" ||
      (midtransData.transaction_status === "capture" &&
        midtransData.fraud_status === "accept");

    if (isSuccess && lastPayment.status !== "SUCCESS") {
      await prisma.payment.updateMany({
        where: { gatewayRef: orderId },
        data: { status: "SUCCESS" },
      });
      await prisma.bill.update({
        where: { id: parseInt(billId) },
        data: { status: "PAID" },
      });
    }

    // 4. Jika expire/cancel/deny → update FAILED
    const isFailed = ["expire", "cancel", "deny"].includes(
      midtransData.transaction_status
    );

    if (isFailed && lastPayment.status !== "FAILED") {
      await prisma.payment.updateMany({
        where: { gatewayRef: orderId },
        data: { status: "FAILED" },
      });
    }

    // 5. Return ke frontend
    return res.status(200).json({
      orderId: midtransData.order_id,
      transactionStatus: midtransData.transaction_status,
      paymentType: midtransData.payment_type,
      grossAmount: midtransData.gross_amount,
      fraudStatus: midtransData.fraud_status,
      message: getStatusMessage(midtransData.transaction_status),
    });

  } catch (err) {
    console.error("Midtrans check error:", err);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
}

function getStatusMessage(status) {
  const map = {
    settlement: "✅ Pembayaran berhasil dikonfirmasi.",
    capture:    "✅ Pembayaran berhasil dikonfirmasi.",
    pending:    "⏳ Menunggu pembayaran dari pelanggan.",
    deny:       "❌ Pembayaran ditolak oleh bank/issuer.",
    cancel:     "🚫 Transaksi dibatalkan.",
    expire:     "⌛ Transaksi sudah kedaluwarsa.",
    not_found:  "❓ Belum ada transaksi untuk tagihan ini.",
  };
  return map[status] || `Status: ${status}`;
}