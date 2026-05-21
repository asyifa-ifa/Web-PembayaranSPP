import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { id, status } = req.body;

    const allowed = ["ACTIVE", "GRADUATED", "DROPPED"];
    if (!id || !allowed.includes(status)) {
      return res.status(400).json({ message: "Data tidak valid" });
    }

    const updated = await prisma.student.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.json({ success: true, data: updated });
  } catch (e) {
    console.error("Update status error:", e.message);
    res.status(500).json({ message: e.message });
  }
}