import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method tidak diizinkan" });
  }

  const { emailType, subject, message } = req.body;

  try {
    // ================= AMBIL DATA SANTRI + BILL =================
    const students = await prisma.student.findMany({
      include: {
        bills: {
          where: {
            status: "UNPAID",
          },
          include: {
            paymentType: true,
          },
        },
      },
    });

    // ================= FILTER =================
    let targetStudents = students;

    if (emailType === "tunggakan") {
      targetStudents = students.filter((s) => s.bills.length > 0);
    }

    // ================= CONFIG EMAIL =================
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ================= KIRIM EMAIL =================
    for (let student of targetStudents) {
      const totalTunggakan = student.bills.reduce(
        (sum, bill) => sum + bill.amount,
        0
      );

      const billList = student.bills
        .map(
          (bill) =>
            `<li>${bill.paymentType.name} - Rp ${bill.amount}</li>`
        )
        .join("");

      await transporter.sendMail({
        from: `Admin Pesantren <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject,
        html: `
          <div style="font-family: Arial">
            <h3>${subject}</h3>

            <p>Halo ${student.name},</p>

            <p>${message}</p>

            ${
              student.bills.length > 0
                ? `
                <p><b>Detail Tunggakan:</b></p>
                <ul>${billList}</ul>
                <p><b>Total: Rp ${totalTunggakan}</b></p>
              `
                : `<p>Tidak ada tunggakan 🎉</p>`
            }

            <br/>
            <small>Pesan otomatis dari sistem pesantren</small>
          </div>
        `,
      });
    }

    return res.status(200).json({
      message: `Berhasil kirim ke ${targetStudents.length} santri`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Gagal mengirim email" });
  }
}