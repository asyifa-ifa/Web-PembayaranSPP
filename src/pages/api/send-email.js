// pages/api/send-email.js
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const formatRupiah = (v) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(v);

// ── Template wrapper ──────────────────────────────────────────────────────
const baseTemplate = ({ headerColor, headerIcon, headerTitle, body }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:32px 0">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

          <!-- HEADER -->
          <tr>
            <td style="background:${headerColor};border-radius:14px 14px 0 0;padding:28px 32px;text-align:center">
              <div style="font-size:36px;margin-bottom:10px">${headerIcon}</div>
              <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:0.3px">${headerTitle}</div>
              <div style="color:rgba(255,255,255,0.75);font-size:12px;margin-top:4px">
                Madrasah Tarbiyatul Mubalighin Sumberjo
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:28px 32px">
              ${body}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f7faf7;border-radius:0 0 14px 14px;padding:18px 32px;
                       text-align:center;border-top:1px solid #e8f0e8">
              <p style="margin:0;font-size:12px;color:#9ab5a3">
                © ${new Date().getFullYear()} SIBATAMU-SPP · Madrasah Tarbiyatul Mubalighin
              </p>
              <p style="margin:5px 0 0;font-size:11px;color:#b0c4b8">
                Email ini dikirim otomatis, mohon tidak membalas pesan ini.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method tidak diizinkan" });
  }

  const { emailType, subject, message } = req.body;

  try {
    // Ambil semua santri beserta tagihan UNPAID
    const students = await prisma.student.findMany({
      include: {
        bills: {
          where: { status: "UNPAID" },
          include: { paymentType: true },
        },
      },
    });

    // Filter: kalau tipe tunggakan, hanya yang punya tagihan
    const targetStudents =
      emailType === "tunggakan"
        ? students.filter((s) => s.bills.length > 0)
        : students;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const student of targetStudents) {
      // Nama santri (fallback aman)
      const nama = student.name?.trim() || "Santri";

      const total = student.bills.reduce((s, b) => s + b.amount, 0);

      // ── Buat baris tagihan ──
      const billRows = student.bills.map((b, i) => `
        <tr style="background:${i % 2 === 0 ? "#f7faf8" : "#fff"}">
          <td style="padding:11px 14px;font-size:13px;color:#1a3d28">
            ${b.paymentType.name}
          </td>
          <td style="padding:11px 14px;font-size:13px;color:#c62828;
              font-weight:600;text-align:right">
            ${formatRupiah(b.amount)}
          </td>
        </tr>
      `).join("");

      // ── Bagian tagihan (hanya tampil kalau ada) ──
      const tagihanSection =
        student.bills.length > 0
          ? `
            <p style="font-size:14px;font-weight:700;color:#1a3d28;margin:20px 0 10px">
              Detail Tunggakan:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border-radius:10px;overflow:hidden;border:1px solid #e4ede6;margin-bottom:16px">
              <thead>
                <tr style="background:#1a3d28">
                  <th style="padding:10px 14px;font-size:12px;color:#fff;text-align:left;font-weight:600">
                    Jenis Pembayaran
                  </th>
                  <th style="padding:10px 14px;font-size:12px;color:#fff;text-align:right;font-weight:600">
                    Nominal
                  </th>
                </tr>
              </thead>
              <tbody>
                ${billRows}
                <tr style="background:#fff0f0;border-top:2px solid #fecaca">
                  <td style="padding:12px 14px;font-size:13px;color:#c62828;font-weight:700">
                    Total
                  </td>
                  <td style="padding:12px 14px;font-size:15px;color:#c62828;
                      font-weight:800;text-align:right">
                    ${formatRupiah(total)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style="text-align:center;margin:20px 0 8px">
              <a href="${process.env.NEXTAUTH_URL}/santri/dashboard"
                 style="display:inline-block;padding:13px 28px;background:#e67e22;
                        color:#fff;border-radius:10px;text-decoration:none;
                        font-size:14px;font-weight:700;
                        box-shadow:0 4px 12px rgba(0,0,0,0.15)">
                💳 Bayar Sekarang
              </a>
            </div>
          `
          : `
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;
                        padding:14px;text-align:center;margin:20px 0">
              <p style="margin:0;font-size:13px;color:#1a6b35;font-weight:600">
                🎉 Tidak ada tunggakan. Terima kasih!
              </p>
            </div>
          `;

      const body = `
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 6px">
          Assalamu'alaikum <strong>${nama}</strong>,
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px">
          ${message || "Berikut informasi pembayaran Anda."}
        </p>

        ${tagihanSection}

        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;
                    padding:13px 16px;margin-top:20px">
          <p style="margin:0;font-size:12.5px;color:#78350f">
            ⚠️ Mohon segera melakukan pembayaran. Hubungi admin madrasah jika ada kendala.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: subject || "⚠️ Pengingat Tunggakan SPP",
        html: baseTemplate({
          headerColor: "#e67e22",
          headerIcon: "⚠️",
          headerTitle: subject || "Pengingat Tunggakan",
          body,
        }),
      });
    }

    return res.status(200).json({
      message: `Berhasil kirim ke ${targetStudents.length} santri`,
    });
  } catch (error) {
    console.error("send-email error:", error);
    return res.status(500).json({ message: "Gagal mengirim email", error: error.message });
  }
}