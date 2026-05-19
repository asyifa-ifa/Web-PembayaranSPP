import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/pages/api/auth/[...nextauth]"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || session.user.role !== "KEPALA") {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    const students = await prisma.student.findMany({
      include: {
        class: true,
        classHistories: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    return res.status(200).json(students)
  } catch (e) {
    return res.status(500).json({
      message: "Gagal ambil data",
      detail: e.message
    })
  }
}