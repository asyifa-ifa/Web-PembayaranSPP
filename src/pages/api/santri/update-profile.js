import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method tidak diizinkan" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Belum login" });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { nis: session.user.nis || "" },
          { email: session.user.email || "" },
          { id: session.user.studentId ? Number(session.user.studentId) : -1 },
        ],
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Data santri tidak ditemukan" });
    }

    const { phone, email, address } = req.body;

    // Update student
    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...(phone   !== undefined && { phone }),
        ...(email   !== undefined && { email }),
        ...(address !== undefined && { address }),
      },
    });

    // Sync email ke login secara manual
    if (email) {
      await prisma.login.updateMany({
        where: { studentId: student.id },
        data: { email },
      });
    }

    return res.status(200).json({ success: true, student: updated });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({ message: "Gagal memperbarui profil", detail: error.message });
  }
}