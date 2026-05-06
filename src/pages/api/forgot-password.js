import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendResetEmail } from "@/lib/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method tidak diizinkan" });
  }

  const { username } = req.body;

  try {
    const user = await prisma.login.findUnique({
      where: { username },
    });

    if (!user || !user.email) {
      return res.status(404).json({ message: "User tidak ditemukan / email tidak tersedia" });
    }

    // 🔑 generate token
    const token = crypto.randomBytes(32).toString("hex");

    // ⏰ expiry 1 jam
    const expiry = new Date(Date.now() + 3600000);

    // 💾 simpan ke DB
    await prisma.login.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // 📧 kirim email
    await sendResetEmail(user.email, token);

    return res.status(200).json({
      message: "Link reset password telah dikirim ke email",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
}