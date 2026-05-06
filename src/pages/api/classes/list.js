import prisma from "@/lib/prisma"

export default async function handler(req, res) {
  const classes = await prisma.class.findMany()
  res.json(classes)
}
