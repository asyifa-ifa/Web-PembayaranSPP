// pages/api/pengeluaran/export.js
// Pure JS export — works on Vercel serverless
// npm install pdfkit exceljs

import prisma from "@/lib/prisma"

const MONTHS_ID = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

function rp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID")
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

// ── PDF via pdfkit ──────────────────────────────────────────────────────────
async function generatePDF(data, month, year) {
  const PDFDocument = (await import("pdfkit")).default
  const monthName = MONTHS_ID[parseInt(month)]
  const total = data.reduce((s, d) => s + d.amount, 0)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" })
    const chunks = []
    doc.on("data", c => chunks.push(c))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const pageW = doc.page.width
    const contentW = pageW - 80 // margin kiri kanan 40

    // ── Header banner ──
    doc.rect(0, 0, pageW, 80).fill("#6366f1")
    doc.fillColor("white")
       .fontSize(20).font("Helvetica-Bold")
       .text("LAPORAN PENGELUARAN", 40, 18)
    doc.fontSize(11).font("Helvetica")
       .text(`Periode: ${monthName} ${year}`, 40, 44)
    doc.fontSize(10)
       .text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" })}`, 40, 60)

    let y = 100

    // ── Summary box ──
    const summaryBoxH = 54
    doc.roundedRect(40, y, contentW, summaryBoxH, 8).fill("#f5f3ff")
    doc.fillColor("#6366f1").fontSize(11).font("Helvetica-Bold")
       .text("Total Pengeluaran", 60, y + 10)
    doc.fillColor("#1e293b").fontSize(18).font("Helvetica-Bold")
       .text(rp(total), 60, y + 26)
    doc.fillColor("#94a3b8").fontSize(9).font("Helvetica")
       .text(`${data.length} transaksi`, pageW - 130, y + 28)

    y += summaryBoxH + 20

    // ── Table header ──
    const colX  = [40, 90, 185, 355, 460]
    const colW  = [45, 90, 165, 100, 95]
    const headers = ["No", "Tanggal", "Keterangan", "Catatan", "Jumlah"]

    doc.rect(40, y, contentW, 24).fill("#6366f1")
    headers.forEach((h, i) => {
      doc.fillColor("white").fontSize(9).font("Helvetica-Bold")
         .text(h, colX[i] + 4, y + 7, { width: colW[i] - 8,
           align: i === 4 ? "right" : i === 0 ? "center" : "left" })
    })
    y += 24

    // ── Table rows ──
    if (data.length === 0) {
      doc.rect(40, y, contentW, 28).fill("#f8fafc")
      doc.fillColor("#94a3b8").fontSize(9).font("Helvetica")
         .text("Tidak ada data pengeluaran pada periode ini", 40, y + 9,
           { width: contentW, align: "center" })
      y += 28
    } else {
      data.forEach((item, i) => {
        const rowH = 26
        const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc"
        doc.rect(40, y, contentW, rowH).fill(bg)

        // garis bawah tipis
        doc.moveTo(40, y + rowH).lineTo(40 + contentW, y + rowH)
           .strokeColor("#e2e8f0").lineWidth(0.5).stroke()

        const vals = [
          String(i + 1),
          fmtDate(item.date),
          item.title,
          item.note || "—",
          rp(item.amount),
        ]
        vals.forEach((v, ci) => {
          const isAmount = ci === 4
          const isNo = ci === 0
          doc.fillColor(isAmount ? "#dc2626" : "#334155")
             .fontSize(8.5).font(isAmount ? "Helvetica-Bold" : "Helvetica")
             .text(v, colX[ci] + 4, y + 8, {
               width: colW[ci] - 8,
               align: isAmount ? "right" : isNo ? "center" : "left",
               ellipsis: true,
             })
        })
        y += rowH

        // New page check
        if (y > doc.page.height - 100 && i < data.length - 1) {
          doc.addPage()
          y = 40
        }
      })
    }

    // ── Total row ──
    doc.rect(40, y, contentW, 28).fill("#6366f1")
    doc.fillColor("white").fontSize(10).font("Helvetica-Bold")
       .text("TOTAL", 44, y + 8)
       .text(rp(total), colX[4] + 4, y + 8,
         { width: colW[4] - 8, align: "right" })
    y += 28

    // ── Footer ──
    y += 20
    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica")
       .text("Dokumen ini digenerate otomatis oleh Sistem SIBATAMU-SPP", 40, y,
         { align: "center", width: contentW })

    doc.end()
  })
}

// ── Excel via exceljs ───────────────────────────────────────────────────────
async function generateExcel(data, month, year) {
  const ExcelJS = (await import("exceljs")).default
  const wb = new ExcelJS.Workbook()
  wb.creator = "SIBATAMU-SPP"
  wb.created = new Date()

  const ws = wb.addWorksheet("Pengeluaran", {
    pageSetup: { paperSize: 9, orientation: "portrait" },
  })

  const monthName = MONTHS_ID[parseInt(month)]
  const total = data.reduce((s, d) => s + d.amount, 0)

  const PURPLE = "FF6366F1"
  const LIGHT  = "FFF8FAFC"
  const RED    = "FFDC2626"
  const DARK   = "FF1E293B"
  const GRAY   = "FF94A3B8"
  const WHITE  = "FFFFFFFF"

  const borderThin = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
  }

  // Col widths
  ws.columns = [
    { key: "no",     width: 6  },
    { key: "date",   width: 20 },
    { key: "title",  width: 34 },
    { key: "note",   width: 28 },
    { key: "amount", width: 18 },
  ]

  // ── Title row ──
  ws.mergeCells("A1:E1")
  const titleCell = ws.getCell("A1")
  titleCell.value = "LAPORAN PENGELUARAN MADRASAH"
  titleCell.font = { name: "Arial", bold: true, size: 14, color: { argb: WHITE } }
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } }
  titleCell.alignment = { horizontal: "center", vertical: "middle" }
  ws.getRow(1).height = 30

  // ── Subtitle row ──
  ws.mergeCells("A2:E2")
  const subCell = ws.getCell("A2")
  subCell.value = `Periode: ${monthName} ${year}  |  Total: ${rp(total)}  |  ${data.length} Transaksi`
  subCell.font = { name: "Arial", size: 10, color: { argb: GRAY } }
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F3FF" } }
  subCell.alignment = { horizontal: "center", vertical: "middle" }
  ws.getRow(2).height = 20

  // ── Spacer ──
  ws.mergeCells("A3:E3")
  ws.getRow(3).height = 6

  // ── Header row ──
  const headers = ["No", "Tanggal", "Keterangan", "Catatan", "Jumlah (Rp)"]
  const headerRow = ws.getRow(4)
  headerRow.height = 24
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { name: "Arial", bold: true, size: 10, color: { argb: WHITE } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } }
    cell.alignment = {
      horizontal: i === 0 ? "center" : i === 4 ? "right" : "left",
      vertical: "middle",
    }
    cell.border = borderThin
  })

  // ── Data rows ──
  if (data.length === 0) {
    ws.mergeCells("A5:E5")
    const emptyCell = ws.getCell("A5")
    emptyCell.value = "Tidak ada data pengeluaran pada periode ini"
    emptyCell.font = { name: "Arial", size: 10, color: { argb: GRAY }, italic: true }
    emptyCell.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(5).height = 24
  } else {
    data.forEach((item, i) => {
      const rowNum = 5 + i
      const row = ws.getRow(rowNum)
      row.height = 20
      const bg = i % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC"

      const vals = [i + 1, fmtDate(item.date), item.title, item.note || "", item.amount]
      vals.forEach((v, ci) => {
        const cell = row.getCell(ci + 1)
        cell.value = v
        cell.font = {
          name: "Arial", size: 9.5,
          color: { argb: ci === 4 ? RED : DARK },
          bold: ci === 4,
        }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } }
        cell.alignment = {
          horizontal: ci === 0 ? "center" : ci === 4 ? "right" : "left",
          vertical: "middle", wrapText: true,
        }
        cell.border = borderThin
        if (ci === 4) cell.numFmt = '"Rp "#,##0'
      })
    })
  }

  // ── Total row ──
  const totalRowNum = 5 + Math.max(data.length, 1)
  ws.mergeCells(`A${totalRowNum}:D${totalRowNum}`)
  const totalLabelCell = ws.getCell(`A${totalRowNum}`)
  totalLabelCell.value = "TOTAL PENGELUARAN"
  totalLabelCell.font = { name: "Arial", bold: true, size: 11, color: { argb: WHITE } }
  totalLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } }
  totalLabelCell.alignment = { horizontal: "right", vertical: "middle" }
  totalLabelCell.border = borderThin

  const totalValCell = ws.getCell(`E${totalRowNum}`)
  totalValCell.value = total
  totalValCell.numFmt = '"Rp "#,##0'
  totalValCell.font = { name: "Arial", bold: true, size: 11, color: { argb: WHITE } }
  totalValCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } }
  totalValCell.alignment = { horizontal: "right", vertical: "middle" }
  totalValCell.border = borderThin
  ws.getRow(totalRowNum).height = 24

  // ── Footer ──
  const footerRow = totalRowNum + 2
  ws.mergeCells(`A${footerRow}:E${footerRow}`)
  const footerCell = ws.getCell(`A${footerRow}`)
  footerCell.value = `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} — SIBATAMU-SPP`
  footerCell.font = { name: "Arial", size: 8, color: { argb: GRAY }, italic: true }
  footerCell.alignment = { horizontal: "right" }

  // Freeze header
  ws.views = [{ state: "frozen", ySplit: 4 }]

  // Auto filter
  ws.autoFilter = { from: "A4", to: "E4" }

  const buf = await wb.xlsx.writeBuffer()
  return buf
}

// ── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const { format = "pdf", month, year } = req.query
  const m = parseInt(month) || new Date().getMonth() + 1
  const y = parseInt(year) || new Date().getFullYear()

  const start = new Date(y, m - 1, 1)
  const end   = new Date(y, m, 0, 23, 59, 59)

  try {
    const data = await prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    })

    const monthName = MONTHS_ID[m]
    const filename  = `Pengeluaran_${monthName}_${y}`

    if (format === "excel") {
      const buf = await generateExcel(data, m, y)
      res.setHeader("Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`)
      return res.send(buf)
    }

    // default → PDF
    const buf = await generatePDF(data, m, y)
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`)
    return res.send(buf)

  } catch (e) {
    console.error("Export error:", e)
    return res.status(500).json({ message: "Gagal membuat laporan: " + e.message })
  }
}