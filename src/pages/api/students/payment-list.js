import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const students = await prisma.student.findMany({
      include: {
        class: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: "Gagal ambil data" });
  }
}