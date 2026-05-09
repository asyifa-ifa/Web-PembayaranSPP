// pages/api/pengeluaran/export.js
// Generates PDF or Excel report for pengeluaran.
// Query params:
//   format = "pdf" | "excel"
//   month  = 1-12
//   year   = e.g. 2025

import prisma from "@/lib/prisma"

// ── helpers ────────────────────────────────────────────────────────────────
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

// ── PDF generation (ReportLab via child_process) ────────────────────────────
async function generatePDF(data, month, year) {
  const { execSync } = require("child_process")
  const fs = require("fs")
  const path = require("path")
  const os = require("os")

  const tmpDir = os.tmpdir()
  const pyFile = path.join(tmpDir, `exp_${Date.now()}.py`)
  const outFile = path.join(tmpDir, `pengeluaran_${month}_${year}_${Date.now()}.pdf`)

  const total = data.reduce((s, d) => s + d.amount, 0)
  const monthName = MONTHS_ID[parseInt(month)]

  // Build row data as Python literal
  const rows = data.map((item, i) =>
    `(${i + 1}, "${fmtDate(item.date)}", "${item.title.replace(/"/g, "\\\"")}", "${(item.note || "-").replace(/"/g, "\\\"")}", "${rp(item.amount)}")`
  ).join(",\n    ")

  const py = `
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

PAGE_W, PAGE_H = A4
doc = SimpleDocTemplate(
    "${outFile}",
    pagesize=A4,
    rightMargin=1.8*cm, leftMargin=1.8*cm,
    topMargin=1.8*cm, bottomMargin=1.8*cm,
)

styles = getSampleStyleSheet()
PURPLE = colors.HexColor("#6366f1")
DARK   = colors.HexColor("#1e293b")
GRAY   = colors.HexColor("#64748b")
LIGHT  = colors.HexColor("#f8fafc")
RED    = colors.HexColor("#dc2626")

title_style   = ParagraphStyle("title",   fontSize=18, textColor=DARK,   alignment=TA_LEFT, fontName="Helvetica-Bold", spaceAfter=2)
sub_style     = ParagraphStyle("sub",     fontSize=10, textColor=GRAY,   alignment=TA_LEFT, fontName="Helvetica",      spaceAfter=0)
total_style   = ParagraphStyle("total",   fontSize=11, textColor=DARK,   alignment=TA_RIGHT, fontName="Helvetica-Bold")
caption_style = ParagraphStyle("caption", fontSize=8,  textColor=GRAY,   alignment=TA_LEFT, fontName="Helvetica")

rows_data = [
    ("No", "Tanggal", "Keterangan", "Catatan", "Jumlah"),
    ${rows || ''}
]

# Empty state row
if len(rows_data) == 1:
    rows_data.append(("", "Tidak ada data", "", "", ""))

col_widths = [1*cm, 3.5*cm, 5.5*cm, 4*cm, 3.2*cm]

tbl = Table(rows_data, colWidths=col_widths, repeatRows=1)
tbl.setStyle(TableStyle([
    # Header
    ("BACKGROUND",   (0,0), (-1,0), PURPLE),
    ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
    ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",     (0,0), (-1,0), 9),
    ("ALIGN",        (0,0), (-1,0), "CENTER"),
    ("TOPPADDING",   (0,0), (-1,0), 8),
    ("BOTTOMPADDING",(0,0), (-1,0), 8),
    # Data rows
    ("FONTNAME",  (0,1), (-1,-1), "Helvetica"),
    ("FONTSIZE",  (0,1), (-1,-1), 8.5),
    ("ALIGN",     (0,1), (0,-1),  "CENTER"),   # No
    ("ALIGN",     (-1,1),(-1,-1), "RIGHT"),    # Jumlah
    ("TEXTCOLOR", (-1,1),(-1,-1), RED),
    ("TOPPADDING",    (0,1), (-1,-1), 6),
    ("BOTTOMPADDING", (0,1), (-1,-1), 6),
    # Alternating rows
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
    # Grid
    ("LINEBELOW", (0,0), (-1,0), 0.5, PURPLE),
    ("LINEBELOW", (0,1), (-1,-1), 0.3, colors.HexColor("#e2e8f0")),
    ("LEFTPADDING",  (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    # Rounded feel on outer box
    ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
]))

story = [
    Paragraph("Laporan Pengeluaran", title_style),
    Paragraph(f"Periode: ${monthName} ${year}  ·  Total: ${rp(total)}", sub_style),
    Spacer(1, 0.4*cm),
    HRFlowable(width="100%", thickness=1.5, color=PURPLE, spaceAfter=0.3*cm),
    tbl,
    Spacer(1, 0.4*cm),
    Paragraph("Total Pengeluaran: ${rp(total)}", total_style),
    Spacer(1, 0.3*cm),
    Paragraph(f"Dicetak pada: {__import__('datetime').datetime.now().strftime('%d %B %Y, %H:%M')}", caption_style),
]

doc.build(story)
print("OK")
`

  fs.writeFileSync(pyFile, py)
  try {
    execSync(`python3 "${pyFile}"`, { timeout: 15000 })
  } finally {
    fs.unlinkSync(pyFile)
  }

  const buf = fs.readFileSync(outFile)
  fs.unlinkSync(outFile)
  return buf
}

// ── Excel generation (openpyxl via child_process) ──────────────────────────
async function generateExcel(data, month, year) {
  const { execSync } = require("child_process")
  const fs = require("fs")
  const path = require("path")
  const os = require("os")

  const tmpDir = os.tmpdir()
  const pyFile = path.join(tmpDir, `exp_xl_${Date.now()}.py`)
  const outFile = path.join(tmpDir, `pengeluaran_${month}_${year}_${Date.now()}.xlsx`)

  const total = data.reduce((s, d) => s + d.amount, 0)
  const monthName = MONTHS_ID[parseInt(month)]

  const rows = data.map((item, i) =>
    `[${i + 1}, "${fmtDate(item.date)}", "${item.title.replace(/"/g, "\\\"")}", "${(item.note || "").replace(/"/g, "\\\"")}", ${item.amount}]`
  ).join(",\n    ")

  const py = `
import openpyxl
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, numbers
)
from openpyxl.utils import get_column_letter

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Pengeluaran"

PURPLE = "6366F1"
LIGHT  = "F8FAFC"
RED    = "DC2626"
DARK   = "1E293B"
GRAY   = "64748B"
BORDER_COLOR = "E2E8F0"

thin = Side(style="thin", color=BORDER_COLOR)
border = Border(left=thin, right=thin, top=thin, bottom=thin)

def cell_style(ws, row, col, value, bold=False, color="000000", bg=None,
               align="left", num_fmt=None, font_size=10):
    c = ws.cell(row=row, column=col, value=value)
    c.font = Font(name="Arial", bold=bold, color=color, size=font_size)
    if bg:
        c.fill = PatternFill("solid", fgColor=bg)
    c.alignment = Alignment(horizontal=align, vertical="center", wrap_text=True)
    c.border = border
    if num_fmt:
        c.number_format = num_fmt
    return c

# ── Title block ──────────────────────────────────────────────────────────────
ws.merge_cells("A1:E1")
t = ws["A1"]
t.value = "LAPORAN PENGELUARAN MADRASAH"
t.font = Font(name="Arial", bold=True, size=14, color="FFFFFF")
t.fill = PatternFill("solid", fgColor=PURPLE)
t.alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[1].height = 28

ws.merge_cells("A2:E2")
s = ws["A2"]
s.value = f"Periode: ${monthName} ${year}"
s.font = Font(name="Arial", size=10, color=GRAY)
s.alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[2].height = 18

ws.merge_cells("A3:E3")
ws["A3"].value = ""
ws.row_dimensions[3].height = 8

# ── Header row ───────────────────────────────────────────────────────────────
headers = ["No", "Tanggal", "Keterangan", "Catatan", "Jumlah (Rp)"]
for col, h in enumerate(headers, 1):
    cell_style(ws, 4, col, h, bold=True, color="FFFFFF", bg=PURPLE,
               align="center", font_size=10)
ws.row_dimensions[4].height = 22

# ── Data rows ────────────────────────────────────────────────────────────────
rows_data = [
    ${rows || ''}
]

for r_idx, row in enumerate(rows_data):
    excel_row = 5 + r_idx
    bg = None if r_idx % 2 == 0 else LIGHT
    for col_idx, val in enumerate(row, 1):
        align = "center" if col_idx == 1 else ("right" if col_idx == 5 else "left")
        color = RED if col_idx == 5 else DARK
        num_fmt = '#,##0' if col_idx == 5 else None
        cell_style(ws, excel_row, col_idx, val, color=color, bg=bg,
                   align=align, num_fmt=num_fmt)
    ws.row_dimensions[excel_row].height = 18

last_data_row = 4 + len(rows_data)

# ── Total row ────────────────────────────────────────────────────────────────
total_row = last_data_row + 1
ws.merge_cells(f"A{total_row}:D{total_row}")
cell_style(ws, total_row, 1, "TOTAL", bold=True, color="FFFFFF", bg=PURPLE, align="right")
cell_style(ws, total_row, 5, ${total}, bold=True, color="FFFFFF", bg=PURPLE,
           align="right", num_fmt='#,##0')
ws.row_dimensions[total_row].height = 22

# ── Footer ───────────────────────────────────────────────────────────────────
footer_row = total_row + 2
ws.merge_cells(f"A{footer_row}:E{footer_row}")
import datetime
f = ws[f"A{footer_row}"]
f.value = f"Dicetak: {datetime.datetime.now().strftime('%d %B %Y, %H:%M')}"
f.font = Font(name="Arial", size=8, color=GRAY, italic=True)
f.alignment = Alignment(horizontal="right")

# ── Column widths ────────────────────────────────────────────────────────────
widths = [5, 18, 32, 28, 16]
for i, w in enumerate(widths, 1):
    ws.column_dimensions[get_column_letter(i)].width = w

# ── Freeze pane ──────────────────────────────────────────────────────────────
ws.freeze_panes = "A5"

wb.save("${outFile}")
print("OK")
`

  fs.writeFileSync(pyFile, py)
  try {
    execSync(`python3 "${pyFile}"`, { timeout: 15000 })
  } finally {
    fs.unlinkSync(pyFile)
  }

  const buf = fs.readFileSync(outFile)
  fs.unlinkSync(outFile)
  return buf
}

// ── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const { format = "pdf", month, year } = req.query
  const m = parseInt(month) || new Date().getMonth() + 1
  const y = parseInt(year) || new Date().getFullYear()

  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0, 23, 59, 59)

  try {
    const data = await prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    })

    const monthName = MONTHS_ID[m]
    const filename = `Pengeluaran_${monthName}_${y}`

    if (format === "excel") {
      const buf = await generateExcel(data, m, y)
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`)
      return res.send(buf)
    }

    // default: PDF
    const buf = await generatePDF(data, m, y)
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`)
    return res.send(buf)
  } catch (e) {
    console.error("Export error:", e)
    return res.status(500).json({ message: "Gagal membuat laporan: " + e.message })
  }
}