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
    if (err) return res.status(400).json({ error: "Gagal parse file" })

    const file = files.file?.[0]
    if (!file) return res.status(400).json({ error: "File tidak ditemukan" })

    try {
      const result = await cloudinary.uploader.upload(file.filepath, {
        folder: "pengeluaran-madrasah",
        allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp"],
        resource_type: "auto",
      })

      fs.unlinkSync(file.filepath) // hapus file temp

      return res.status(200).json({ url: result.secure_url })
    } catch (e) {
      return res.status(500).json({ error: "Upload gagal: " + e.message })
    }
  })
}