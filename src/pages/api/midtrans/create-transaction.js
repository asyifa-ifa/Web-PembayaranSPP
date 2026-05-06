// pages/api/midtrans/create-transaction.js

import midtransClient from "midtrans-client";

export default async function handler(req, res) {
  const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
  });

  const { order_id, amount, name, email } = req.body;

  const parameter = {
    transaction_details: {
      order_id,
      gross_amount: amount,
    },
    customer_details: {
      first_name: name,
      email: email,
    },
  };

  try {
    const transaction = await snap.createTransaction(parameter);

    res.status(200).json({
      token: transaction.token,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
}