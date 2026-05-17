import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendAccountEmail } from "@/lib/mailer";
import { generateNis } from "@/lib/generateNis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method tidak diizinkan" });
  }

  try {
    const {
      name,
      nisn,       // opsional
      gender,
      phone,
      email,
      address,
      birthplace,
      birthdate,
      guardian,
      classId,
      entryYear,
    } = req.body;

    // ✅ Validasi classId
    const parsedClassId = parseInt(classId);
    if (!parsedClassId || isNaN(parsedClassId)) {
      return res.status(400).json({ message: "Kelas tidak valid, pilih kelas yang tersedia" });
    }

    // ✅ Cek classId ada, sekaligus ambil nama kelas untuk generate NIS
    const classData = await prisma.class.findUnique({
      where: { id: parsedClassId },
    });
    if (!classData) {
      return res.status(400).json({ message: `Kelas dengan ID ${parsedClassId} tidak ditemukan` });
    }

    // ✅ entryYear wajib (untuk generate NIS)
    if (!entryYear || !String(entryYear).trim()) {
      return res.status(400).json({ message: "Tahun ajaran masuk wajib diisi" });
    }

    // 1️⃣ Generate NIS otomatis dari nama kelas + tahun
    const nis = await generateNis(classData.name, entryYear);

    // 2️⃣ Simpan student
    const student = await prisma.student.create({
      data: {
        name,
        nis,                                          // wajib, generate otomatis
        nisn: nisn ? String(nisn).trim() : null,      // opsional
        gender,
        phone,
        email,
        address,
        birthplace,
        birthdate: new Date(birthdate),
        guardian,
        classId: parsedClassId,
        entryYear: String(entryYear).trim(),
      },
    });

    // 3️⃣ Generate password random
    const plainPassword = Math.random().toString(36).slice(-8);

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 5️⃣ Buat akun login — username = NIS
    await prisma.login.create({
      data: {
        username: nis,
        password: hashedPassword,
        role: "SANTRI",
        studentId: student.id,
        email: email,
      },
    });

    // 6️⃣ Kirim email info akun
    await sendAccountEmail(email, nis, plainPassword);

    return res.status(200).json({
      message: "Santri & akun berhasil dibuat",
      nis,
    });

  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Data sudah terdaftar, coba lagi" });
    }
    return res.status(500).json({ message: "Gagal membuat data", detail: error.message });
  }
}