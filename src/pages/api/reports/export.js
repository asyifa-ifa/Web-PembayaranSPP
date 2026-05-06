// src/pages/api/reports/export.js
// Export CSV untuk semua jenis laporan
// Query params: sama seperti summary.js
//   ?type=monthly&year=2026&month=5
//   ?type=semester&year=2026&semester=1
//   ?type=yearly&tahunAjar=2025/2026
//   ?type=kelas&year=2026&month=5&kelasId=xxx

import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req, res) {
  // ✅ Fix: gunakan getServerSession bukan getSession dari next-auth/react
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: "Unauthorized" })

  const { type = "monthly", year, month, semester, tahunAjar, kelasId } = req.query

  try {
    let start, end, whereClause = {}, filenameLabel = ""

    if (type === "monthly") {
      if (!year || !month) return res.status(400).json({ error: "year dan month diperlukan" })
      start = new Date(Number(year), Number(month) - 1, 1)
      end   = new Date(Number(year), Number(month), 1)
      filenameLabel = `${year}-${String(month).padStart(2, "0")}`

    } else if (type === "semester") {
      if (!year || !semester) return res.status(400).json({ error: "year dan semester diperlukan" })
      const y = Number(year), s = Number(semester)
      if (s === 1) { start = new Date(y, 6, 1);  end = new Date(y, 12, 1) }
      else         { start = new Date(y, 0, 1);  end = new Date(y, 6, 1)  }
      filenameLabel = `${year}-semester${semester}`

    } else if (type === "yearly") {
      if (!tahunAjar) return res.status(400).json({ error: "tahunAjar diperlukan" })
      const [startYear] = tahunAjar.split("/").map(Number)
      start = new Date(startYear, 6, 1)
      end   = new Date(startYear + 1, 6, 1)
      filenameLabel = `TA-${tahunAjar.replace("/", "-")}`

    } else if (type === "kelas") {
      if (!year || !month) return res.status(400).json({ error: "year dan month diperlukan" })
      start = new Date(Number(year), Number(month) - 1, 1)
      end   = new Date(Number(year), Number(month), 1)
      if (kelasId) whereClause.student = { kelasId }
      filenameLabel = `${year}-${String(month).padStart(2, "0")}-kelas`
    }

    whereClause.createdAt = { gte: start, lt: end }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        student: {
          include: { kelas: true }   // sesuaikan kalau relasi kelas namanya berbeda
        }
      },
      orderBy: { createdAt: "asc" },
    })

    // ── Buat CSV ───────────────────────────────────────────────────────
    const BOM = "\uFEFF" // agar Excel Indonesia bisa baca UTF-8
    const header = "Tanggal,Nama Santri,Kelas,Kategori,Jumlah (Rp),Metode Pembayaran\n"

    const rows = payments.map(p => {
      const tanggal  = p.createdAt.toISOString().split("T")[0]
      const nama     = (p.student?.name || "-").replace(/,/g, " ")
      const kelas    = (p.student?.kelas?.name || p.student?.kelasName || "-").replace(/,/g, " ")
      const kategori = (p.category || "-").replace(/,/g, " ")
      const jumlah   = p.amount
      const metode   = p.method || "-"
      return `${tanggal},${nama},${kelas},${kategori},${jumlah},${metode}`
    }).join("\n")

    const csv = BOM + header + rows

    res.setHeader("Content-Type", "text/csv; charset=utf-8")
    res.setHeader("Content-Disposition", `attachment; filename=laporan-spp-${filenameLabel}.csv`)
    res.status(200).send(csv)

  } catch (err) {
    console.error("[/api/reports/export]", err)
    res.status(500).json({ error: "Terjadi kesalahan server", detail: err.message })
  }
}