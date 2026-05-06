import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
      include: {
        class: true,
        bills: {
          include: {
            paymentType: true,
          },
        },
        payments: {
          include: {
            paymentType: true,
          },
        },
      },
    });

    res.json(student);
  } catch (err) {
    res.status(500).json({ error: "Gagal ambil detail" });
  }
}