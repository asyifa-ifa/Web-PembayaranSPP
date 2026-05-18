// pages/api/reports/rekap-pembayaran.js
import prisma from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method tidak diizinkan" })

  const token = await getToken({ req })
  if (!token || !["ADMIN", "KEPALA"].includes(token.role)) {
    return res.status(403).json({ message: "Akses ditolak" })
  }

  try {
    const { classId, paymentTypeId, status, academicYear } = req.query

    const where = {}

    // Filter status — Payment pakai SUCCESS/FAILED, bukan PAID/UNPAID
    if (status === "PAID") where.status = "SUCCESS"
    if (status === "UNPAID") where.status = "FAILED"

    if (paymentTypeId) where.paymentTypeId = parseInt(paymentTypeId)

    if (classId) {
      where.student = { classId: parseInt(classId) }
    }

    // Filter academicYear lewat semester (kalau ada), atau abaikan kalau null
    if (academicYear) {
      where.OR = [
        { semester: { academicYear } },
        { semesterId: null } // ← tangkap data manual tanpa semester
      ]
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nisn: true,
            class: { select: { id: true, name: true } }
          }
        },
        paymentType: {
          select: { id: true, name: true, amount: true }
        }
      },
      orderBy: [
        { student: { name: "asc" } },
        { createdAt: "desc" }
      ]
    })

    // Map status agar frontend tetap terima PAID/UNPAID
    const result = payments.map(p => ({
      ...p,
      status: p.status === "SUCCESS" ? "PAID" : "UNPAID"
    }))

    return res.status(200).json(result)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Gagal mengambil data", detail: e.message })
  }
}