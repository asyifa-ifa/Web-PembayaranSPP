import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: tentukan semester dari tanggal
function getSemester(date) {
  const month = new Date(date).getMonth() + 1; // 1-12
  const year = new Date(date).getFullYear();
  // Ganjil: Juli–Desember, Genap: Januari–Juni
  const label = month >= 7 ? "Ganjil" : "Genap";
  return `${label} ${year}`;
}

// Urutkan semester secara kronologis
function sortSemester(a, b) {
  const parse = (s) => {
    const [label, year] = s.split(" ");
    return parseInt(year) * 10 + (label === "Ganjil" ? 1 : 0);
  };
  return parse(a.semester) - parse(b.semester);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    // ── GRAFIK KEUANGAN ──
    // Ambil semua pembayaran yang sudah lunas
    const payments = await prisma.payment.findMany({
      where: { status: "lunas" },
      select: { amount: true, createdAt: true },
    });

    // Kelompokkan per semester
    const keuanganMap = {};
    for (const p of payments) {
      const sem = getSemester(p.createdAt);
      keuanganMap[sem] = (keuanganMap[sem] || 0) + Number(p.amount);
    }

    const keuanganData = Object.entries(keuanganMap)
      .map(([semester, pemasukan]) => ({ semester, pemasukan }))
      .sort(sortSemester);

    // ── GRAFIK SANTRI ──
    // Ambil semua santri dengan tanggal daftar
    const santriList = await prisma.santri.findMany({
      select: { createdAt: true },
    });

    // Hitung jumlah santri kumulatif per semester
    // (berapa santri yang sudah terdaftar sampai semester itu)
    const semesterSet = new Set([
      ...payments.map((p) => getSemester(p.createdAt)),
      ...santriList.map((s) => getSemester(s.createdAt)),
    ]);

    const allSemesters = Array.from(semesterSet).sort((a, b) =>
      sortSemester({ semester: a }, { semester: b })
    );

    const santriData = allSemesters.map((sem) => {
      // Hitung santri yang sudah terdaftar SAMPAI akhir semester ini
      const [label, year] = sem.split(" ");
      const isGanjil = label === "Ganjil";
      // Batas akhir semester: Ganjil = Des, Genap = Juni
      const endMonth = isGanjil ? 12 : 6;
      const endDate = new Date(parseInt(year), endMonth, 0); // last day

      const count = santriList.filter(
        (s) => new Date(s.createdAt) <= endDate
      ).length;

      return { semester: sem, santri: count };
    });

    return res.status(200).json({ keuanganData, santriData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Gagal mengambil data grafik" });
  }
}