import { PrismaClient } from '@prisma/client'

const globalForPrisma = global

const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Pasang middleware hanya jika belum dipasang
if (!prisma._middlewares?.length) {
  prisma.$use(async (params, next) => {
    const result = await next(params)

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
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma