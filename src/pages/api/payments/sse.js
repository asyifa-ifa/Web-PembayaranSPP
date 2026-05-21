/**
 * GET /api/payments/sse
 *
 * Server-Sent Events endpoint.
 * Santri / admin subscribe ke sini.
 * Midtrans callback akan trigger notifikasi lewat global Map ini.
 *
 * Cara kerja:
 *  1. Client buka koneksi SSE → masuk ke sseClients Map
 *  2. midtrans-callback.js panggil notifySSE(orderId) setelah DB diupdate
 *  3. Client terima event, langsung re-fetch data → UI update tanpa refresh
 */

// Simpan semua koneksi SSE aktif
// Key: orderId, Value: array of res (bisa lebih dari 1 tab)
if (!global.sseClients) {
  global.sseClients = new Map()
}

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const { orderId } = req.query
  if (!orderId) return res.status(400).json({ message: "orderId wajib" })

  // Set header SSE
  res.setHeader("Content-Type",  "text/event-stream")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("Connection",    "keep-alive")
  res.setHeader("X-Accel-Buffering", "no") // penting untuk Nginx/Vercel
  res.flushHeaders()

  // Kirim heartbeat pertama agar koneksi tidak langsung timeout
  res.write("data: connected\n\n")

  // Tambahkan client ini ke Map
  const clients = global.sseClients.get(orderId) || []
  clients.push(res)
  global.sseClients.set(orderId, clients)

  console.log(`[SSE] Client connected for orderId: ${orderId}, total: ${clients.length}`)

  // Heartbeat setiap 25 detik agar koneksi tidak drop
  const heartbeat = setInterval(() => {
    try { res.write(": ping\n\n") } catch (_) {}
  }, 25000)

  // Bersihkan saat client disconnect
  req.on("close", () => {
    clearInterval(heartbeat)
    const list = global.sseClients.get(orderId) || []
    const updated = list.filter(r => r !== res)
    if (updated.length === 0) {
      global.sseClients.delete(orderId)
    } else {
      global.sseClients.set(orderId, updated)
    }
    console.log(`[SSE] Client disconnected for orderId: ${orderId}`)
  })
}

/**
 * Dipanggil dari midtrans-callback.js setelah DB diupdate
 * Mengirim event ke semua client yang subscribe orderId ini
 */
export function notifySSE(orderId, payload = {}) {
  const clients = global.sseClients?.get(orderId) || []
  const data    = JSON.stringify({ status: "SUCCESS", orderId, ...payload })

  console.log(`[SSE] Notifying ${clients.length} client(s) for orderId: ${orderId}`)

  clients.forEach(res => {
    try {
      res.write(`data: ${data}\n\n`)
    } catch (e) {
      console.error("[SSE] Write error:", e.message)
    }
  })

  // Hapus dari Map setelah notifikasi dikirim (transaksi selesai)
  global.sseClients?.delete(orderId)
}