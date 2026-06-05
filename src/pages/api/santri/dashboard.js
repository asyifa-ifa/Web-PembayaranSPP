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

    // ✅ Gunakan studentId saja, lebih aman dan akurat
    const studentId = session.user.studentId ? Number(session.user.studentId) : null;

    if (!studentId) {
      return res.status(401).json({ message: "Session tidak valid" });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    if (!student) {
      return res.status(404).json({ 
        message: "Data santri tidak ditemukan",
        debug: { 
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

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).json({ student, bills, payments });

  } catch (error) {
    console.error("DASHBOARD API ERROR:", error);
    return res.status(500).json({ message: "Internal Server Error", detail: error.message });
  }
}