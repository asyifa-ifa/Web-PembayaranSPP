// pages/api/laporan/rekap-pembayaran.js
import prisma from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method tidak diizinkan" })

  // ✅ Cek role — ADMIN dan KEPALA boleh akses
  const token = await getToken({ req })
  if (!token || !["ADMIN", "KEPALA"].includes(token.role)) {
    return res.status(403).json({ message: "Akses ditolak" })
  }

  try {
    const { classId, paymentTypeId, status, academicYear } = req.query

    const where = {}

    if (status) where.status = status
    if (paymentTypeId) where.paymentTypeId = parseInt(paymentTypeId)

    if (classId) {
      where.student = { classId: parseInt(classId) }
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nisn: true,
            entryYear: true,
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

    let result = bills
    if (academicYear) {
      result = bills.filter(b => b.student?.entryYear === academicYear)
    }

    return res.status(200).json(result)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Gagal mengambil data", detail: e.message })
  }
}