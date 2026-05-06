import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ✅ Admin - pakai model Login dengan role ADMIN
  const hashedPassword = await bcrypt.hash("admin123", 10)

  await prisma.login.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      role: "ADMIN",
      email: "madrasahtaribiyatulsumberjo@gmail.com",
    }
  })

  console.log("✔ Admin berhasil dibuat: username=admin password=admin123")

  // ✅ Data Kelas
  const kelas = [
    { name: "Kelas Persiapan" },
    { name: "Kelas 1 Wustho" },
    { name: "Kelas 2 Wustho" },
    { name: "Kelas 3 Wustho" },
    { name: "Kelas 4 Ulya" },
    { name: "Kelas 5 Ulya" },
    { name: "Kelas 6 Ulya" },
  ]

  for (const k of kelas) {
    await prisma.class.upsert({
      where: { name: k.name },
      update: {},
      create: { name: k.name }
    })
  }

  console.log("✔ 7 Kelas berhasil dibuat")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })