// prisma/seed-history.js
// Jalankan SEKALI untuk mengisi history santri lama yang belum punya ClassHistory
// node prisma/seed-history.js

import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany({
    where: { entryYear: { not: null } },
    include: {
      classHistories: true,
      class: true
    }
  })

  let created = 0
  let skipped = 0

  for (const s of students) {
    // Cek apakah sudah ada history untuk tahun entryYear ini
    const existingEntryYear = s.classHistories.find(h => h.academicYear === s.entryYear)

    if (existingEntryYear) {
      // Update classId ke kelas yang benar jika masih salah
      // Cari kelas sebelum kelas sekarang berdasarkan urutan ID
      const allClasses = await prisma.class.findMany({ orderBy: { id: "asc" } })
      const currentIndex = allClasses.findIndex(k => k.id === s.classId)

      // Santri yang baru masuk (entryYear = tahun masuk pertama)
      // Kelas di entryYear = kelas sebelum kelas sekarang
      let correctClassId = s.classId
      if (currentIndex > 0) {
        // Hitung berapa kali sudah naik kelas
        const totalHistories = s.classHistories.length
        const targetIndex = currentIndex - totalHistories
        if (targetIndex >= 0) {
          correctClassId = allClasses[targetIndex].id
        }
      }

      // Update jika classId salah
      if (existingEntryYear.classId !== correctClassId) {
        await prisma.classHistory.update({
          where: { id: existingEntryYear.id },
          data: { classId: correctClassId }
        })
        console.log(`✏️  Update ${s.name} → ${s.entryYear} → kelas ID: ${correctClassId} (${allClasses.find(k=>k.id===correctClassId)?.name})`)
      } else {
        console.log(`⏭  Skip ${s.name} → sudah benar`)
      }
      skipped++
      continue
    }

    // Belum ada history sama sekali — buat baru
    // Kelas di entryYear = kelas saat pertama masuk
    // Ambil dari classHistories yang paling awal kalau ada,
    // atau gunakan classId sekarang kalau belum pernah naik kelas
    const allClasses = await prisma.class.findMany({ orderBy: { id: "asc" } })
    const currentIndex = allClasses.findIndex(k => k.id === s.classId)
    const totalHistories = s.classHistories.length

    let entryClassId = s.classId
    if (totalHistories === 0) {
      // Belum pernah naik kelas → kelas sekarang = kelas masuk
      entryClassId = s.classId
    } else {
      // Sudah naik kelas → kelas masuk = mundur sejumlah history
      const targetIndex = currentIndex - totalHistories
      if (targetIndex >= 0) {
        entryClassId = allClasses[targetIndex].id
      }
    }

    await prisma.classHistory.create({
      data: {
        studentId: s.id,
        classId: entryClassId,
        academicYear: s.entryYear,
      }
    })

    const namaKelas = allClasses.find(k => k.id === entryClassId)?.name || "-"
    console.log(`✅ ${s.name} → ${s.entryYear} → ${namaKelas}`)
    created++
  }

  console.log(`\nSelesai! Dibuat: ${created}, Dilewati: ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())