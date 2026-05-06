import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { sendPaymentConfirmEmail } from "@/lib/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { studentId, paymentTypeId, amount, method, note, semesterId } = req.body;

  try {
    // 1️⃣ Simpan ke tabel Payment
    const payment = await prisma.payment.create({
      data: {
        studentId: Number(studentId),
        paymentTypeId: Number(paymentTypeId),
        amount: Number(amount),
        method,
        status: "SUCCESS",
        note,
        semesterId: semesterId ? Number(semesterId) : null,
      },
    });

    // 2️⃣ Update Bill jadi PAID
    const bill = await prisma.bill.findFirst({
      where: {
        studentId: Number(studentId),
        paymentTypeId: Number(paymentTypeId),
        status: "UNPAID",
      },
    });

    if (bill) {
      await prisma.bill.update({
        where: { id: bill.id },
        data: { status: "PAID" },
      });
    }

    // 3️⃣ Kirim email konfirmasi
    try {
      const student = await prisma.student.findUnique({
        where: { id: Number(studentId) },
      });
      const paymentType = await prisma.paymentType.findUnique({
        where: { id: Number(paymentTypeId) },
      });

      if (student && paymentType) {
        await sendPaymentConfirmEmail(
          student.email,
          student.name,
          paymentType.name,
          Number(amount)
        );
      }
    } catch (mailErr) {
      console.error("Email gagal:", mailErr.message);
    }

    return res.status(200).json({ message: "Pembayaran berhasil", payment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}