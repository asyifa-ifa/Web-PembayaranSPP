// pages/api/midtrans/callback.js

export default async function handler(req, res) {
  const data = req.body;

  console.log("Callback:", data);

  if (data.transaction_status === "settlement") {
    // update database
    // contoh:
    // await prisma.tagihan.update({
    //   where: { order_id: data.order_id },
    //   data: { status: "paid" }
    // });
  }

  res.status(200).json({ message: "OK" });
}