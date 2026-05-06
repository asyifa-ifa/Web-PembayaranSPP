import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { token, password } = req.body;

  const user = await prisma.login.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gte: new Date(),
      },
    },
  });

  if (!user) {
    return res.status(400).json({
      message: "Token tidak valid atau kadaluarsa",
    });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.login.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return res.json({
    message: "Password berhasil direset",
  });
}