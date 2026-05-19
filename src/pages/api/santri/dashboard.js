// pages/api/santri/dashboard.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (session.user.role !== "SANTRI") {
      return res.status(403).json({ message: "Forbidden" });
    }

    let studentId = null;

    // ── Coba lewat login.id (credentials login) ──
    const login = await prisma.login.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (login?.student) {
      studentId = login.student.id;
    } else {
      // ── Fallback: cari lewat email (Google login) ──
      const studentByEmail = await prisma.student.findFirst({
        where: { email: session.user.email ?? undefined },
      });

      if (studentByEmail) {
        studentId = studentByEmail.id;
      }
    }

    if (!studentId) {
      return res.status(404).json({ message: "Data santri tidak ditemukan" });
    }

    const [student, bills, payments] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        include: { class: true },
      }),
      prisma.bill.findMany({
        where: { studentId },
        include: { paymentType: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        where: { studentId },
        include: { paymentType: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return res.status(200).json({ student, bills, payments });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ error: error.message });
  }
}