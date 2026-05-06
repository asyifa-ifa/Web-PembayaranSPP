import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: {
          include: {
            class: true,
            bills: {
              include: {
                paymentType: true,
              },
            },
          },
        },
        paymentType: true,
        semester: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ payments });
  } catch (error) {
    console.error("LIST ERROR:", error);
    res.status(500).json({ error: "Gagal ambil data" });
  }
}