// pages/api/santri/dashboard.js
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]" // Sesuaikan path jika berbeda

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  try {
    // 1. Cek sesi login user
    const session = await getServerSession(req, res, authOptions)
    if (!session || !session.user) {
      return res.status(401).json({ message: "Belum terautentikasi" })
    }

    // 2. Ambil data santri berdasarkan email/username dari session login
    const student = await prisma.student.findUnique({
      where: { email: session.user.email }, 
      include: { class: true }
    })

    if (!student) {
      return res.status(404).json({ message: "Data santri tidak ditemukan" })
    }

    // 3. Tarik data tagihan (bills) milik santri tersebut
    const bills = await prisma.bill.findMany({
      where: { studentId: student.id },
      include: { paymentType: true },
      orderBy: { createdAt: "desc" }
    })

    // 4. Tarik riwayat pembayaran (payments) milik santri tersebut
    const payments = await prisma.payment.findMany({
      where: { studentId: student.id },
      include: { paymentType: true },
      orderBy: { createdAt: "desc" }
    })

    // 5. Kembalikan data dalam format JSON murni ke frontend
    return res.status(200).json({
      student,
      bills,
      payments
    })

  } catch (error) {
    console.error("DASHBOARD API ERROR:", error)
    return res.status(500).json({ message: "Internal Server Error", detail: error.message })
  }
}