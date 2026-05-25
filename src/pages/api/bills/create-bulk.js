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

    // Ambil semua bill yang sudah ada sekaligus (1 query)
    const existingBills = await prisma.bill.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        paymentTypeId: { in: items.map(i => Number(i.paymentTypeId)) },
        status: "UNPAID",
      },
      select: {
        studentId: true,
        paymentTypeId: true,
        month: true,
        academicYear: true,
      },
    });

    // Buat set untuk cek duplikat dengan cepat
    const existingSet = new Set(
      existingBills.map(b =>
        `${b.studentId}-${b.paymentTypeId}-${b.month || ""}-${b.academicYear || ""}`
      )
    );

    // Buat semua data yang perlu diinsert
    const toCreate = [];
    for (const student of students) {
      for (const item of items) {
        const key = `${student.id}-${Number(item.paymentTypeId)}-${item.month || ""}-${item.academicYear || ""}`;
        if (existingSet.has(key)) continue;

        toCreate.push({
          studentId: student.id,
          paymentTypeId: Number(item.paymentTypeId),
          amount: Number(item.amount),
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          status: "UNPAID",
          month: item.month || null,
          academicYear: item.academicYear || null,
        });
      }
    }

    // Insert semua sekaligus (1 query)
    if (toCreate.length > 0) {
      await prisma.bill.createMany({ data: toCreate });
    }

    return res.status(200).json({
      success: true,
      count: students.length,
      totalBillsCreated: toCreate.length,
      message: `Berhasil membuat ${toCreate.length} tagihan untuk ${students.length} santri`,
    });
  } catch (error) {
    console.error("Error create-bulk bills:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server: " + error.message });
  }
}