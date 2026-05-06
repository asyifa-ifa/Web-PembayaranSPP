import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  const { order_id, status_code, gross_amount } = req.body;

  if (status_code === "200") {
    await prisma.payment.update({
      where: { gatewayRef: order_id },
      data: {
        status: "SUCCESS",
      },
    });
  }

  res.status(200).json({ ok: true });
}