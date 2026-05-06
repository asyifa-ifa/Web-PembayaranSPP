import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method tidak diizinkan" });
  }

  try {
    const { studentId, method, items } = req.body;

    if (!studentId || !items || items.length === 0) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const payment = await prisma.payment.create({
      data: {
        studentId: Number(studentId),
        method,
        items: {
          create: items.map((item) => ({
            paymentTypeId: Number(item.paymentTypeId),
            amount: Number(item.amount),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json(payment);
  } catch (error) {
    console.error("CREATE ERROR:", error);
    return res.status(500).json({
      message: "Gagal menyimpan pembayaran",
      error: error.message,
    });
  }
}