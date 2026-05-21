// pages/api/santri/dashboard.js
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  try {
    // cek session login
    const session = await getServerSession(req, res, authOptions)

    if (!session || !session.user) {
      return res.status(401).json({
        message: "Belum login"
      })
    }

    // cari santri berdasarkan NIS
    const student = await prisma.student.findUnique({
      where: {
        nis: session.user.name
      },
      include: {
        class: true
      }
    })

    if (!student) {
      return res.status(404).json({
        message: "Data santri tidak ditemukan"
      })
    }

    // ambil tagihan
    const bills = await prisma.bill.findMany({
      where: {
        studentId: student.id
      },
      include: {
        paymentType: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // ambil pembayaran
    const payments = await prisma.payment.findMany({
      where: {
        studentId: student.id
      },
      include: {
        paymentType: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return res.status(200).json({
      student,
      bills,
      payments
    })

  } catch (error) {
    console.error("DASHBOARD API ERROR:", error)

    return res.status(500).json({
      message: "Internal Server Error",
      detail: error.message
    })
  }
}