import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const tahun = parseInt(req.query.tahun) || new Date().getFullYear();

    // =========================
    // PEMASUKAN (Pembayaran)
    // =========================
    const pemasukan = await prisma.pembayaran.findMany({
      where: {
        status: "LUNAS",
        tanggal: {
          gte: new Date(`${tahun}-01-01`),
          lte: new Date(`${tahun}-12-31`),
        },
      },
      select: {
        jumlah: true,
        tanggal: true,
      },
    });

    // =========================
    // PENGELUARAN
    // =========================
    const pengeluaran = await prisma.pengeluaran.findMany({
      where: {
        tanggal: {
          gte: new Date(`${tahun}-01-01`),
          lte: new Date(`${tahun}-12-31`),
        },
      },
      select: {
        jumlah: true,
        tanggal: true,
      },
    });

    // =========================
    // FORMAT BULANAN
    // =========================
    const bulanLabels = [
      "Jan","Feb","Mar","Apr","Mei","Jun",
      "Jul","Agu","Sep","Okt","Nov","Des"
    ];

    const pemasukanPerBulan = Array(12).fill(0);
    const pengeluaranPerBulan = Array(12).fill(0);

    pemasukan.forEach(item => {
      const bulan = new Date(item.tanggal).getMonth();
      pemasukanPerBulan[bulan] += item.jumlah;
    });

    pengeluaran.forEach(item => {
      const bulan = new Date(item.tanggal).getMonth();
      pengeluaranPerBulan[bulan] += item.jumlah;
    });

    res.status(200).json({
      labels: bulanLabels,
      pemasukan: pemasukanPerBulan,
      pengeluaran: pengeluaranPerBulan,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan" });
  }
}