import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: tentukan tahun ajaran dari tanggal
// Juli–Des → X/X+1, Jan–Juni → (X-1)/X
function getTahunAjaran(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    // Ambil semua pembayaran SUCCESS
    const payments = await prisma.payment.findMany({
      where: { status: "SUCCESS" },
      select: { amount: true, createdAt: true, academicYear: true },
    });

    // Ambil semua pengeluaran
    const expenses = await prisma.expense.findMany({
      select: { amount: true, date: true },
    });

    // Kumpulkan semua tahun ajaran unik dari kedua sumber
    const semuaTahunAjaran = new Set([
      ...payments.map((p) =>
        p.academicYear || getTahunAjaran(p.createdAt)
      ),
      ...expenses.map((e) => getTahunAjaran(e.date)),
    ]);

    // Map pemasukan per tahun ajaran
    const pemasukanMap = {};
    for (const p of payments) {
      const ta = p.academicYear || getTahunAjaran(p.createdAt);
      pemasukanMap[ta] = (pemasukanMap[ta] || 0) + Number(p.amount);
    }

    // Map pengeluaran per tahun ajaran
    const pengeluaranMap = {};
    for (const e of expenses) {
      const ta = getTahunAjaran(e.date);
      pengeluaranMap[ta] = (pengeluaranMap[ta] || 0) + Number(e.amount);
    }

    // Gabung & urutkan kronologis
    const keuanganData = Array.from(semuaTahunAjaran)
      .map((ta) => ({
        semester: ta, // key tetap "semester" biar frontend tidak perlu diubah
        pemasukan: pemasukanMap[ta] || 0,
        pengeluaran: pengeluaranMap[ta] || 0,
      }))
      .sort((a, b) =>
        parseInt(a.semester.split("/")[0]) - parseInt(b.semester.split("/")[0])
      );

    return res.status(200).json({ keuanganData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal mengambil data grafik" });
  }
}