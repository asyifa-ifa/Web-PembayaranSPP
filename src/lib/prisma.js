import { PrismaClient } from '@prisma/client'

const globalForPrisma = global

if (!globalForPrisma.prisma) {
  const prisma = new PrismaClient()

  /* ============================================
     MIDDLEWARE — Auto Sync
  ============================================ */
  prisma.$use(async (params, next) => {
    const result = await next(params) // jalankan query asli dulu

    // STUDENT UPDATE → sync ke tabel lain
    if (params.model === "Student" && params.action === "update") {
      const data      = params.args?.data
      const studentId = params.args?.where?.id

      if (studentId && data?.email) {
        await prisma.login.updateMany({
          where: { studentId },
          data:  { email: data.email },
        })
      }
    }

    return result
  })

  globalForPrisma.prisma = prisma
}

export default globalForPrisma.prisma