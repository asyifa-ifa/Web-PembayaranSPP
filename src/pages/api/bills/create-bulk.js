import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { classId, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Pilih minimal satu jenis tagihan" });
  }

  try {
    const students = await prisma.student.findMany({
      where: classId ? { classId: Number(classId) } : {},
      select: { id: true },
    });

    if (students.length === 0) {
      return res.status(404).json({ message: "Tidak ada santri ditemukan" });
    }

    let totalCreated = 0;

    for (const student of students) {
      for (const item of items) {
        // Untuk SPP: cek duplikat berdasarkan bulan + tahun ajaran
        // Untuk non-SPP: cek duplikat berdasarkan paymentTypeId saja
        const whereClause = item.month
          ? {
              studentId: student.id,
              paymentTypeId: Number(item.paymentTypeId),
              month: item.month,
              academicYear: item.academicYear || null,
              status: { in: ["UNPAID", "PENDING"] },
            }
          : {
              studentId: student.id,
              paymentTypeId: Number(item.paymentTypeId),
              status: { in: ["UNPAID", "PENDING"] },
            };

        const existing = await prisma.bill.findFirst({ where: whereClause });
        if (existing) continue;

        await prisma.bill.create({
          data: {
            studentId: student.id,
            paymentTypeId: Number(item.paymentTypeId),
            amount: Number(item.amount),
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            status: "UNPAID",
            month: item.month || null,
            academicYear: item.academicYear || null,
          },
        });

        totalCreated++;
      }
    }

    return res.status(200).json({
      success: true,
      count: students.length,
      totalBillsCreated: totalCreated,
      message: `Berhasil membuat ${totalCreated} tagihan untuk ${students.length} santri`,
    });
  } catch (error) {
    console.error("Error create-bulk bills:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server: " + error.message });
  }
}