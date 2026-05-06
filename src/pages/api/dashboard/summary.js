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
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Total pemasukan bulan ini
    const totalPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: {
          gte: monthStart,
          lt: nextMonth,
        },
        status: "SUCCESS",
      },
    });

    // Total santri
    const totalSantri = await prisma.student.count();

    // 🔥 Ambil semua jenis pembayaran
    const paymentTypes = await prisma.paymentType.findMany();

    // 🔥 Hitung total per jenis pembayaran
    const totalsByType = await Promise.all(
      paymentTypes.map(async (type) => {
        const total = await prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            paymentTypeId: type.id,
            status: "SUCCESS",
            createdAt: {
              gte: monthStart,
              lt: nextMonth,
            },
          },
        });

        return {
          id: type.id,
          name: type.name,
          total: total._sum.amount ?? 0,
        };
      })
    );

    return res.status(200).json({
      bulan: `${now.getMonth() + 1}-${now.getFullYear()}`,
      totalPayments: totalPayments._sum.amount ?? 0,
      totalSantri,
      totalsByType,
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      detail: error.message,
    });
  }
}