//api/admin/accounts/index.js
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/* ================= API ================= */
export default async function handler(req, res) {
  try {
    /* ================= GET ================= */
    if (req.method === "GET") {
      const students = await prisma.student.findMany({
        include: {
          class: true,
          login: true,
        },
        orderBy: { id: "asc" },
      });

      return res.status(200).json(students);
    }

    /* ================= POST ================= */
    if (req.method === "POST") {
      const { studentId, password, email } = req.body;

      if (!studentId || !password || !email) {
        return res.status(400).json({ message: "Data tidak lengkap" });
      }

      /* ===== CEK SUDAH PUNYA AKUN ===== */
      const exists = await prisma.login.findUnique({
        where: { studentId },
      });

      if (exists) {
        return res.status(400).json({ message: "Akun sudah ada" });
      }

      /* ===== AMBIL DATA SANTRI + KELAS ===== */
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { class: true },
      });

      if (!student || !student.class) {
        return res.status(404).json({ message: "Santri tidak ditemukan" });
      }

      /* ===== VALIDASI ENTRY YEAR ===== */
      if (!student.entryYear) {
        return res.status(400).json({
          message: "Tahun masuk (entryYear) belum diisi",
        });
      }

      /* ================= GENERATE USERNAME ================= */

      // Tahun (2 digit dari entryYear)
      const year = student.entryYear.toString().slice(2);

      // Ambil angka kelas (contoh: "Kelas 1 Wustho" → 1)
      const classNumber = student.class.name.match(/\d+/)?.[0];

      if (!classNumber) {
        return res.status(400).json({
          message: "Format nama kelas salah",
        });
      }

      // Prefix (W / U)
      const prefix = student.class.name.toLowerCase().includes("wustho")
        ? "W"
        : "U";

      // Pattern dasar
      const usernamePattern = `${prefix}${classNumber}${year}`;

      /* ===== AMBIL USER TERAKHIR (ANTI BENTROK) ===== */
      const lastUser = await prisma.login.findFirst({
        where: {
          username: {
            startsWith: usernamePattern,
          },
        },
        orderBy: {
          username: "desc",
        },
      });

      let nextNumber = 1;

      if (lastUser) {
        const lastNumber = parseInt(lastUser.username.slice(-3));
        nextNumber = lastNumber + 1;
      }

      const sequence = String(nextNumber).padStart(3, "0");

      const username = `${usernamePattern}${sequence}`;

      /* ================= HASH PASSWORD ================= */
      const hashedPassword = await bcrypt.hash(password, 10);

      /* ================= SIMPAN ================= */
      let account;

      try {
        account = await prisma.login.create({
          data: {
            username,
            password: hashedPassword,
            role: "SANTRI",
            studentId,
            email,
          },
        });
      } catch (err) {
        // Handle duplicate username (safety tambahan)
        if (err.code === "P2002") {
          return res.status(400).json({
            message: "Username bentrok, coba lagi",
          });
        }
        throw err;
      }

      return res.status(201).json({
        message: "Akun berhasil dibuat",
        username: account.username,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}