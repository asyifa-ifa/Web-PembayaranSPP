import crypto from "crypto"

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY
const BASE_URL = process.env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1"

const authHeader = "Basic " + Buffer.from(SERVER_KEY + ":").toString("base64")

/**
 * Buat transaksi Snap Midtrans
 * Returns: { token, redirect_url } jika sukses
 */
export async function createMidtransTransaction({
  orderId,
  amount,
  productDetails,
  email,
  name,
  returnUrl,
}) {
  const body = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Number(amount),
    },
    item_details: [
      {
        id: orderId,
        price: Number(amount),
        quantity: 1,
        name: productDetails,
      },
    ],
    customer_details: {
      first_name: name,
      email: email,
    },
    callbacks: {
      finish: returnUrl,
    },
  }

  console.log("MIDTRANS REQUEST:", JSON.stringify(body, null, 2))

  const res = await fetch(`${BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": authHeader,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  console.log("MIDTRANS RESPONSE:", text)
  console.log("MIDTRANS STATUS:", res.status)

  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

/**
 * Verifikasi signature notifikasi Midtrans
 * SHA512(order_id + status_code + gross_amount + server_key)
 */
export function verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey }) {
  const expected = crypto
    .createHash("sha512")
    .update(orderId + statusCode + String(grossAmount) + SERVER_KEY)
    .digest("hex")

  return expected === signatureKey
}