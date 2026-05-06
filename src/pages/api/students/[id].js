import prisma from "../../../lib/prisma"

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method !== "GET") return res.status(405).end()

  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
      include: { class: true }
    })
    if (!student) return res.status(404).json({ error: "Not found" })
    res.json(student)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
