import prisma from "../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    id,
    name,
    nisn,
    gender,
    phone,
    email,
    address,
    birthplace,
    birthdate,
    guardian,
    classId,
    entryYear,
  } = req.body;

  try {
    // 🔥 VALIDASI NISN UNIK (PENTING)
    const existing = await prisma.student.findFirst({
      where: {
        AND: [
          { nisn },
          { NOT: { id: Number(id) } }
        ]
      },
    });

    if (existing) {
      return res.status(400).json({
        error: "NISN sudah digunakan santri lain",
      });
    }

    const student = await prisma.student.update({
      where: { id: Number(id) },
      data: {
        name,
        nisn,
        gender,
        phone,
        email,
        address,
        birthplace,
        birthdate: birthdate ? new Date(birthdate) : null,
        guardian,
        classId: classId ? Number(classId) : null,
        entryYear: entryYear ? Number(entryYear) : null,
      },
    });

    return res.status(200).json(student);
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      error: "Gagal update data santri",
    });
  }
}