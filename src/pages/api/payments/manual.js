import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { sendPaymentConfirmEmail } from "@/lib/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { studentId, billIds, method, note, academicYear } = req.body;

  if (!studentId) return res.status(400).json({ error: "studentId wajib diisi" });
  if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
    return res.status(400).json({ error: "Pilih minimal 1 tagihan" });
  }

  try {
    // Ambil semua bill yang dipilih, pastikan milik student ini dan masih UNPAID
    const bills = await prisma.bill.findMany({
      where: {
        id: { in: billIds.map(Number) },
        studentId: Number(studentId),
        status: "UNPAID",
      },
      include: { paymentType: true },
    });

    if (bills.length === 0) {
      return res.status(400).json({ error: "Tagihan tidak ditemukan atau sudah dibayar" });
    }

    if (bills.length !== billIds.length) {
      // Sebagian tagihan sudah dibayar atau tidak ditemukan — tetap proses yang valid
      console.warn(`Diminta ${billIds.length} tagihan, hanya ${bills.length} yang valid`);
    }

    // Buat payment untuk setiap bill + update status dalam 1 transaksi atomik
    await prisma.$transaction(async (tx) => {
      // Buat record payment untuk masing-masing bill
      for (const bill of bills) {
        await tx.payment.create({
          data: {
            studentId:     Number(studentId),
            paymentTypeId: bill.paymentTypeId,
            amount:        bill.amount,
            method:        method || "CASH",
            status:        "SUCCESS",
            note:          note || null,
            academicYear:  academicYear || null,
          },
        });
      }

      // Update semua bill jadi PAID sekaligus
      await tx.bill.updateMany({
        where: { id: { in: bills.map((b) => b.id) } },
        data:  { status: "PAID" },
      });
    });

    // Kirim email konfirmasi (di luar transaksi, error email tidak batalkan payment)
    try {
      const student = await prisma.student.findUnique({
        where: { id: Number(studentId) },
      });

      if (student?.email) {
        const totalAmount  = bills.reduce((sum, b) => sum + b.amount, 0);
        const namaTagihan  = bills
          .map((b) => b.month ? `${b.paymentType.name} (${b.month})` : b.paymentType.name)
          .join(", ");

        await sendPaymentConfirmEmail(
          student.email,
          student.name,
          namaTagihan,
          totalAmount
        );
      }
    } catch (mailErr) {
      console.error("Email gagal:", mailErr.message);
    }

    const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);

    return res.status(200).json({
      message:      `${bills.length} pembayaran berhasil dicatat`,
      count:        bills.length,
      totalAmount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}