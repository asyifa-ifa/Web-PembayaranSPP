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

    // Filter status dari tabel Bill
    if (status === "PAID")   where.status = "PAID"
    if (status === "UNPAID") where.status = "UNPAID"

    if (paymentTypeId) where.paymentTypeId = parseInt(paymentTypeId)

    if (academicYear) where.academicYear = academicYear

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
            nis: true,
            class: { select: { id: true, name: true } }
          }
        },
        paymentType: {
          select: { id: true, name: true, amount: true }
        },
        payments: {
          where: { status: "SUCCESS" },
          select: { createdAt: true, method: true, amount: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        }
      },
      orderBy: [
        { student: { name: "asc" } },
        { createdAt: "desc" }
      ]
    })

    const result = bills.map(b => ({
      id:          b.id,
      amount:      b.amount,
      status:      b.status, 
      academicYear: b.academicYear,
      month:       b.month,
      dueDate:     b.dueDate,
      createdAt:   b.payments[0]?.createdAt || b.createdAt, 
      student:     b.student,
      paymentType: b.paymentType,
    }))

    return res.status(200).json(result)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Gagal mengambil data", detail: e.message })
  }
}