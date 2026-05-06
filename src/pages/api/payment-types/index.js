import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const data = await prisma.paymentType.findMany({
      orderBy: { id: "desc" },
    });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { name, amount } = req.body;

    const data = await prisma.paymentType.create({
      data: {
        name,
        amount,
      },
    });

    return res.status(201).json(data);
  }

  res.status(405).end();
}