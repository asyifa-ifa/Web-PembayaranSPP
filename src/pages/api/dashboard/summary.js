// pages/api/dashboard/summary.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (session.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Total pemasukan SEMUA (tanpa filter bulan)
    const totalPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "SUCCESS",
      },
    });

    // Total pengeluaran bulan ini
    const totalPengeluaran = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: monthStart, lt: nextMonth },
      },
    });

    // Total santri aktif
    const totalSantri = await prisma.student.count({
      where: { login: { isActive: true } },
    });

    // Semua jenis pembayaran
    const paymentTypes = await prisma.paymentType.findMany();

    // Total per jenis pembayaran (semua, tanpa filter bulan)
    const totalsByType = await Promise.all(
      paymentTypes.map(async (type) => {
        const total = await prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            paymentTypeId: type.id,
            status: "SUCCESS",
          },
        });
        return {
          id:    type.id,
          name:  type.name,
          total: total._sum.amount ?? 0,
        };
      })
    );

    return res.status(200).json({
      bulan:            `${now.getMonth() + 1}-${now.getFullYear()}`,
      totalPayments:    totalPayments._sum.amount    ?? 0,
      totalSantri,
      totalsByType,
      totalPengeluaran: totalPengeluaran._sum.amount ?? 0,
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return res.status(500).json({
      error:  "Internal Server Error",
      detail: error.message,
    });
  }
}