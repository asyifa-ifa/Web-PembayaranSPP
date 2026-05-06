import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  const id = Number(req.query.id);

  if (req.method === "PUT") {
    const { name, amount } = req.body;

    const updated = await prisma.paymentType.update({
      where: { id },
      data: {
        name,
        amount,
      },
    });

    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.paymentType.delete({
      where: { id },
    });
    return res.status(200).json({ message: "Deleted" });
  }

  res.status(405).end();
}