import { PrismaClient } from '@prisma/client'

const globalForPrisma = global

globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient()

export default globalForPrisma.prisma