import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ambil login berdasarkan id session
    const login = await prisma.login.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!login || !login.student) {
      return res.status(404).json({
        message: "Student tidak ditemukan",
      });
    }

    const studentId = login.student.id;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    const bills = await prisma.bill.findMany({
      where: { studentId },
      include: { paymentType: true },
    });

    const payments = await prisma.payment.findMany({
      where: { studentId },
      include: { paymentType: true },
    });

    res.status(200).json({ student, bills, payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}