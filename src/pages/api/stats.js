// pages/api/stats.js
export default async function handler(req, res) {

  // Dummy sementara (nanti bisa diganti Prisma)
  const totalSantri = 245;
  const pembayaranTepat = 99;
  const transparansi = 100;

  res.status(200).json({
    totalSantri,
    pembayaranTepat,
    transparansi
  });
}
