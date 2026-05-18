import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const { classId, academicYear } = req.query

    const students = await prisma.student.findMany({
      where: {
        ...(classId ? { classId: Number(classId) } : {}),
        ...(academicYear ? {
          classHistories: {
            some: { academicYear }
          }
        } : {}),
      },
      include: {
        class: true,
        classHistories: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({ students });
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Gagal ambil data" });
  }
}