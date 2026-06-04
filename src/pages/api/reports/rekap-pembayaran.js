import prisma from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method tidak diizinkan" })

  const token = await getToken({ req })
  if (!token || !["ADMIN", "KEPALA"].includes(token.role)) {
    return res.status(403).json({ message: "Akses ditolak" })
  }

  try {
    const { classId, academicYear } = req.query

    const whereStudent = {}
    if (classId) whereStudent.classId = parseInt(classId)

    const whereBill = {}
    if (academicYear) whereBill.academicYear = academicYear

    // Ambil semua santri beserta tagihan mereka
    const students = await prisma.student.findMany({
      where: {
        status: "ACTIVE",
        ...whereStudent,
      },
      include: {
        class: { select: { id: true, name: true } },
        bills: {
          where: whereBill,
          include: {
            paymentType: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    })

    
    const kolomSet = new Map() // key → label
    for (const s of students) {
      for (const b of s.bills) {
        const isMonthly = b.month !== null
        const key = isMonthly
          ? `${b.paymentType.name}__${b.month}` 
          : `${b.paymentType.name}__`            
        const label = isMonthly
          ? `${b.paymentType.name} - ${b.month}`
          : b.paymentType.name
        if (!kolomSet.has(key)) kolomSet.set(key, label)
      }
    }

    // Urutkan: SPP bulanan dulu (urut bulan), lalu non-SPP
    const URUTAN_BULAN = [
      "Juli","Agustus","September","Oktober","November","Desember",
      "Januari","Februari","Maret","April","Mei","Juni"
    ]
    const kolom = Array.from(kolomSet.entries())
      .sort(([keyA, labelA], [keyB, labelB]) => {
        const [namaA, bulanA] = keyA.split("__")
        const [namaB, bulanB] = keyB.split("__")
        if (bulanA && bulanB) {
          return URUTAN_BULAN.indexOf(bulanA) - URUTAN_BULAN.indexOf(bulanB)
        }
        if (bulanA) return -1
        if (bulanB) return 1
        return labelA.localeCompare(labelB)
      })
      .map(([key, label]) => ({ key, label }))

    // Bangun data per santri
    const result = students.map(s => {
      const billMap = {}
      let totalTagihan = 0
      let lunas = 0
      let belum = 0

      for (const b of s.bills) {
        const isMonthly = b.month !== null
        const key = isMonthly
          ? `${b.paymentType.name}__${b.month}`
          : `${b.paymentType.name}__`

        billMap[key] = b.status 
        totalTagihan += b.amount
        if (b.status === "PAID") lunas++
        else belum++
      }

      return {
        id:          s.id,
        name:        s.name,
        kelas:       s.class?.name || "-",
        tagihan:     billMap,  
        totalTagihan,
        lunas,
        belum,
      }
    })

    return res.status(200).json({ kolom, santri: result })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Gagal mengambil data", detail: e.message })
  }
}