import cron from "node-cron";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function startCronJob() {
  // ==============================
  // JALAN SETIAP TANGGAL 1 JAM 07:00
  // ==============================
  cron.schedule("0 7 1 * *", async () => {
    console.log("📅 Running monthly reminder...");

    try {
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

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      for (let student of students) {
        if (student.bills.length === 0) continue;

        // ================= HITUNG TOTAL =================
        const total = student.bills.reduce(
          (sum, b) => sum + b.amount,
          0
        );

        // ================= HITUNG JUMLAH BULAN =================
        // diasumsikan 1 bill = 1 bulan (untuk SPP)
        const jumlahBulan = student.bills.length;

        // ================= LIST TAGIHAN =================
        const list = student.bills
          .map(
            (b) =>
              `<li>${b.paymentType.name} - Rp ${b.amount}</li>`
          )
          .join("");

        // ================= CEK LEVEL NOTIF =================
        let subject = "";
        let extraMessage = "";

        if (jumlahBulan >= 6) {
          subject = "⚠️ Peringatan Tunggakan 6 Bulan";
          extraMessage = `
            <p style="color:red;"><b>
              Anda memiliki tunggakan lebih dari 6 bulan.
              Anda tidak diperkenankan mengikuti ujian sebelum melunasi.
            </b></p>
          `;
        } else {
          subject = "Pengingat Pembayaran Bulanan";
          extraMessage = `
            <p>Mohon segera melakukan pembayaran.</p>
          `;
        }

        // ================= KIRIM EMAIL =================
        await transporter.sendMail({
          from: `Admin Pesantren <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject,
          html: `
            <div style="font-family: Arial">
              <h3>${subject}</h3>

              <p>Halo ${student.name},</p>

              ${extraMessage}

              <p><b>Detail Tunggakan:</b></p>
              <ul>${list}</ul>

              <p><b>Total: Rp ${total}</b></p>

              <br/>
              <small>Pesan otomatis sistem pesantren</small>
            </div>
          `,
        });
      }

      console.log("✅ Monthly reminder selesai");
    } catch (err) {
      console.error("❌ Error cron:", err);
    }
  });
}