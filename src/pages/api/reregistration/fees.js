import prisma from "@/lib/prisma"
import { getSession } from "next-auth/react"

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) return res.status(401).json({ error: "Unauthorized" })

  if (req.method === "GET") {
    const fees = await prisma.reRegistrationFee.findMany({ orderBy: { semester: "asc" } })
    return res.json(fees)
  }

  if (req.method === "POST") {
    const { name, amount, semester } = req.body
    const newFee = await prisma.reRegistrationFee.create({
      data: { name, amount: Number(amount), semester: Number(semester) },
    })
    return res.json(newFee)
  }

  res.status(405).end()
}
