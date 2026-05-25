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
    nis,
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
    const student = await prisma.student.update({
      where: { id: Number(id) },
      data: {
        name,
        nis:        nis        || null,
        nisn:       nisn       || null,
        gender,
        phone:      phone      || null,
        email:      email      || null,
        address:    address    || null,
        birthplace: birthplace || null,
        birthdate:  birthdate  ? new Date(birthdate) : null,
        guardian:   guardian   || null,
        classId:    classId    ? Number(classId) : null,
        // ✅ simpan sebagai String, bukan Number — agar "2024/2025" tidak jadi NaN
        entryYear:  entryYear  ? String(entryYear).trim() : null,
      },
    });

    return res.status(200).json(student);
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: "Gagal update data santri" });
  }
}