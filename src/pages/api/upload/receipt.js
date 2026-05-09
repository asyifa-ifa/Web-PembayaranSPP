// pages/api/upload/receipt.js
import { v2 as cloudinary } from "cloudinary"
import formidable from "formidable"
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const form = formidable({ maxFileSize: 5 * 1024 * 1024 }) // max 5MB

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Gagal membaca file" })

    const file = files.file?.[0]
    if (!file) return res.status(400).json({ error: "File tidak ditemukan" })

    // Validasi tipe file
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowed.includes(file.mimetype)) {
      return res.status(400).json({ error: "Format file tidak didukung. Gunakan JPG, PNG, atau PDF." })
    }

    try {
      const result = await cloudinary.uploader.upload(file.filepath, {
        folder: "pengeluaran-madrasah",
        resource_type: "auto",
        transformation: file.mimetype !== "application/pdf"
          ? [{ quality: "auto", fetch_format: "auto" }]
          : undefined,
      })

      // Hapus file temp
      try { fs.unlinkSync(file.filepath) } catch {}

      return res.status(200).json({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
      })
    } catch (e) {
      return res.status(500).json({ error: "Upload ke Cloudinary gagal: " + e.message })
    }
  })
}