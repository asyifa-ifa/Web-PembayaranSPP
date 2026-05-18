import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method tidak diizinkan" });
  }

  const { classId } = req.query;

  try {
    const students = await prisma.student.findMany({
      where: classId
        ? { classId: Number(classId) }
        : undefined,

      include: {
        class: true,
        classHistories: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json(students);
  } catch (error) {
    console.error("ERROR STUDENTS LIST:", error);
    res.status(500).json({ error: "Gagal mengambil data santri" });
  }
}