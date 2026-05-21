import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { id, status } = req.body;

  const allowed = ["ACTIVE", "GRADUATED", "DROPPED"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Status tidak valid" });

  try {
    await prisma.student.update({
      where: { id: Number(id) },
      data: { status },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}