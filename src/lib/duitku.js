// import crypto from "crypto"

// const MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE
// const API_KEY = process.env.DUITKU_API_KEY

// export async function createDuitkuInvoice({ merchantOrderId, amount, productDetails, email, name, callbackUrl, returnUrl }) {

//   // ✅ Amount harus string untuk signature
//   const amountStr = String(amount)

//   const signature = crypto
//     .createHash("md5")
//     .update(MERCHANT_CODE + amountStr + merchantOrderId + API_KEY)
//     .digest("hex")

//   const body = {
//     merchantCode: MERCHANT_CODE,
//     paymentAmount: Number(amount),
//     merchantOrderId: String(merchantOrderId),
//     productDetails,
//     email,
//     customerVaName: name,
//     callbackUrl,
//     returnUrl,
//     signature,
//     expiryPeriod: 60,
//   }

//   console.log("DUITKU REQUEST:", JSON.stringify(body, null, 2))

//   const res = await fetch(`https://sandbox.duitku.com/webapi/api/merchant/createInvoice`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Accept": "application/json",
//     },
//     body: JSON.stringify(body),
//   })

//   const text = await res.text()
//   console.log("DUITKU RESPONSE:", text)
//   console.log("DUITKU STATUS:", res.status)

//   try {
//     return JSON.parse(text)
//   } catch {
//     return { error: text }
//   }
// }

// export function verifyDuitkuCallback({ merchantCode, amount, merchantOrderId, signature }) {
//   const expected = crypto
//     .createHash("md5")
//     .update(merchantCode + String(amount) + merchantOrderId + API_KEY)
//     .digest("hex")

//   return expected === signature
// }