import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method tidak diizinkan" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Belum login" });
    }

    // ✅ Hanya masukkan kondisi yang benar-benar ada nilainya
    const orConditions = [];

    if (session.user.studentId) {
      orConditions.push({ id: Number(session.user.studentId) });
    }
    if (session.user.nis) {
      orConditions.push({ nis: session.user.nis });
    }
    if (session.user.email) {
      orConditions.push({ email: session.user.email });
    }

    if (orConditions.length === 0) {
      return res.status(401).json({ message: "Session tidak valid" });
    }

    const student = await prisma.student.findFirst({
      where: { OR: orConditions },
      include: { class: true },
    });

    if (!student) {
      return res.status(404).json({ 
        message: "Data santri tidak ditemukan",
        debug: { 
          nis: session.user.nis,
          email: session.user.email,
          studentId: session.user.studentId,
          name: session.user.name,
        }
      });
    }

    const bills = await prisma.bill.findMany({
      where: { studentId: student.id },
      include: { paymentType: true },
      orderBy: { createdAt: "desc" },
    });

    const payments = await prisma.payment.findMany({
      where: { studentId: student.id },
      include: { paymentType: true },
      orderBy: { createdAt: "desc" },
    });

   // Ganti baris return res.status(200) yang ada dengan ini:
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.status(200).json({ student, bills, payments });

  } catch (error) {
    console.error("DASHBOARD API ERROR:", error);
    return res.status(500).json({ message: "Internal Server Error", detail: error.message });
  }
}