import prisma from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const token = await getToken({ req })
  if (!token || !["ADMIN", "KEPALA"].includes(token.role)) {
    return res.status(403).json({ message: "Akses ditolak" })
  }

  try {
    const { academicYear, classId } = req.query

    if (!academicYear) return res.status(400).json({ message: "Tahun ajaran wajib diisi" })

    // Ambil semua bill SPP (isMonthly) per tahun ajaran
    const bills = await prisma.bill.findMany({
      where: {
        academicYear,
        paymentType: { isMonthly: true },
        student: {
          status: "ACTIVE",
          ...(classId ? { classId: parseInt(classId) } : {}),
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            class: { select: { id: true, name: true } },
          },
        },
        paymentType: { select: { id: true, name: true } },
      },
      orderBy: [
        { student: { class: { name: "asc" } } },
        { student: { name: "asc" } },
      ],
    })

    // Kumpulkan semua bulan yang ada
    const semuaBulan = [...new Set(bills.map(b => b.month).filter(Boolean))]

    // Urutkan bulan sesuai urutan kalender madrasah
    const urutanBulan = [
      "Januari","Februari","Maret","April","Mei","Juni",
      "Juli","Agustus","September","Oktober","November","Desember"
    ]
    semuaBulan.sort((a, b) => urutanBulan.indexOf(a) - urutanBulan.indexOf(b))

    // Group per santri
    const santriMap = {}
    for (const bill of bills) {
      const sid = bill.studentId
      if (!santriMap[sid]) {
        santriMap[sid] = {
          id: sid,
          name: bill.student.name,
          nis: bill.student.nis,
          kelas: bill.student.class?.name || "-",
          bulan: {},
        }
      }
      if (bill.month) {
        santriMap[sid].bulan[bill.month] = bill.status // "PAID" atau "UNPAID"
      }
    }

    return res.status(200).json({
      bulan: semuaBulan,
      santri: Object.values(santriMap),
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Gagal", detail: e.message })
  }
}