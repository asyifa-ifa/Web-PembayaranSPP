import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { classId, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Pilih minimal satu jenis tagihan" });
  }

  try {
    // Ambil semua santri sesuai filter kelas (atau semua jika classId null)
    const students = await prisma.student.findMany({
      where: classId ? { classId: Number(classId) } : {},
      select: { id: true },
    });

    if (students.length === 0) {
      return res.status(404).json({ message: "Tidak ada santri ditemukan untuk target ini" });
    }

    // Buat tagihan untuk setiap santri
    let totalCreated = 0;

    for (const student of students) {
      for (const item of items) {
        // Cek apakah tagihan dengan tipe yang sama sudah ada dan belum lunas
        const existing = await prisma.bill.findFirst({
          where: {
            studentId: student.id,
            paymentTypeId: Number(item.paymentTypeId),
            status: { in: ["UNPAID", "PENDING"] },
          },
        });

        // Skip jika sudah ada tagihan aktif untuk tipe yang sama
        if (existing) continue;

        await prisma.bill.create({
          data: {
            studentId: student.id,
            paymentTypeId: Number(item.paymentTypeId),
            amount: Number(item.amount),
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            status: "UNPAID",
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