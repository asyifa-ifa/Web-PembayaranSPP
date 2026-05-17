import prisma from "@/lib/prisma";

// Mapping nama kelas → prefix NIS
const CLASS_PREFIX = {
  "Kelas Persiapan": "p0",
  "Kelas 1 Wustho":  "w1",
  "Kelas 2 Wustho":  "w2",
  "Kelas 3 Wustho":  "w3",
  "Kelas 4 Ulya":    "u4",
  "Kelas 5 Ulya":    "u5",
  "Kelas 6 Ulya":    "u6",
}

/**
 * Generate NIS otomatis
 * Format: [prefix][2 digit tahun][2 digit nomor urut]
 * Contoh: p02501, w12503, u62502
 *
 * @param {string} className  - nama kelas (harus sesuai key CLASS_PREFIX)
 * @param {string} entryYear  - tahun ajaran masuk, contoh "2025" atau "2025/2026"
 * @returns {Promise<string>} NIS yang di-generate
 */
export async function generateNis(className, entryYear) {
  const prefix = CLASS_PREFIX[className];

  if (!prefix) {
    throw new Error(`Kelas "${className}" tidak dikenali. Pastikan nama kelas sesuai.`);
  }

  // Ambil 2 digit terakhir tahun (misal "2025" → "25", "2025/2026" → "25")
  const year = String(entryYear).slice(2, 4);

  const pattern = `${prefix}${year}`;

  // Cari NIS terakhir dengan prefix yang sama untuk dapat nomor urut tertinggi
  const lastStudent = await prisma.student.findFirst({
    where: {
      nis: {
        startsWith: pattern,
      },
    },
    orderBy: {
      nis: "desc",
    },
  });

  let nextNumber = 1;

  if (lastStudent?.nis) {
    // Ambil 2 digit terakhir sebagai nomor urut
    const lastSeq = parseInt(lastStudent.nis.slice(-2));
    if (!isNaN(lastSeq)) nextNumber = lastSeq + 1;
  }

  const seq = String(nextNumber).padStart(2, "0");

  return `${pattern}${seq}`; // contoh: "p02501"
}