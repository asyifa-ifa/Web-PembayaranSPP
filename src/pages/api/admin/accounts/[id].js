import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    /* ================= PUT ================= */
    if (req.method === "PUT") {
      const { password, toggle } = req.body;

      const account = await prisma.login.findUnique({
        where: { id },
      });

      if (!account) {
        return res.status(404).json({ message: "Akun tidak ditemukan" });
      }

      /* 🔐 ADMIN PROTECTION */
      if (account.role === "ADMIN" && toggle === false) {
        return res.status(403).json({
          message: "Admin tidak bisa dinonaktifkan",
        });
      }

      /* ================= UPDATE PASSWORD ================= */
      if (password !== undefined) {
        if (!password || password.length < 6) {
          return res.status(400).json({
            message: "Password minimal 6 karakter",
          });
        }

        const hashed = await bcrypt.hash(password, 10);

        await prisma.login.update({
          where: { id },
          data: { password: hashed },
        });

        return res.status(200).json({
          message: "Password diperbarui",
        });
      }

      /* ================= TOGGLE STATUS ================= */
      if (toggle !== undefined) {
        if (typeof toggle !== "boolean") {
          return res.status(400).json({
            message: "Status tidak valid",
          });
        }

        await prisma.login.update({
          where: { id },
          data: { isActive: toggle },
        });

        return res.status(200).json({
          message: "Status diperbarui",
        });
      }

      return res.status(400).json({
        message: "Tidak ada data yang diupdate",
      });
    }

    /* ================= DELETE ================= */
    if (req.method === "DELETE") {
      const account = await prisma.login.findUnique({
        where: { id },
      });

      if (!account) {
        return res.status(404).json({
          message: "Akun tidak ditemukan",
        });
      }

      /* 🔐 ADMIN PROTECTION */
      if (account.role === "ADMIN") {
        return res.status(403).json({
          message: "Admin tidak bisa dihapus",
        });
      }

      await prisma.login.delete({
        where: { id },
      });

      return res.status(200).json({
        message: "Akun berhasil dihapus",
      });
    }

    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
}