import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendAccountEmail } from "@/lib/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method tidak diizinkan" });
  }

  try {
    const {
      name,
      nisn,
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

    // ✅ Validasi classId sebelum insert
    const parsedClassId = parseInt(classId);
    if (!parsedClassId || isNaN(parsedClassId)) {
      return res.status(400).json({ message: "Kelas tidak valid, pilih kelas yang tersedia" });
    }

    // ✅ Cek apakah classId benar-benar ada di database
    const classExists = await prisma.class.findUnique({
      where: { id: parsedClassId }
    });
    if (!classExists) {
      return res.status(400).json({ message: `Kelas dengan ID ${parsedClassId} tidak ditemukan di database` });
    }

    // 1️⃣ Simpan student
    const student = await prisma.student.create({
      data: {
        name,
        nisn,
        gender,
        phone,
        email,
        address,
        birthplace,
        birthdate: new Date(birthdate),
        guardian,
        classId: parsedClassId,
        entryYear: entryYear ? String(entryYear).trim() : null,
      },
    });

    // 2️⃣ Generate password random
    const plainPassword = Math.random().toString(36).slice(-8);

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 4️⃣ Buat akun login
    await prisma.login.create({
      data: {
        username: nisn,
        password: hashedPassword,
        role: "SANTRI",
        studentId: student.id,
        email: email,
      },
    });

    // 5️⃣ Kirim email
    await sendAccountEmail(email, nisn, plainPassword);

    return res.status(200).json({
      message: "Santri & akun berhasil dibuat",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Gagal membuat data", detail: error.message });
  }
}