// lib/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const formatRupiah = (v) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(v);

// ── Template dasar (wrapper semua email) ──────────────────────────────────
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
            <td style="background:#f7faf7;border-radius:0 0 14px 14px;padding:18px 32px;text-align:center;border-top:1px solid #e8f0e8">
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

// ── Tombol CTA ────────────────────────────────────────────────────────────
const ctaButton = (href, label, color = "#1a6b35") => `
  <div style="text-align:center;margin:24px 0 8px">
    <a href="${href}"
       style="display:inline-block;padding:13px 28px;background:${color};color:#fff;
              border-radius:10px;text-decoration:none;font-size:14px;font-weight:700;
              letter-spacing:0.3px;box-shadow:0 4px 12px rgba(0,0,0,0.15)">
      ${label}
    </a>
  </div>
`;

// ── Baris info (label: value) ─────────────────────────────────────────────
const infoRow = (label, value, bg = "#fff") => `
  <tr style="background:${bg}">
    <td style="padding:11px 14px;font-size:13px;color:#5a7a66;width:45%">${label}</td>
    <td style="padding:11px 14px;font-size:13px;color:#1a3d28;font-weight:600">${value}</td>
  </tr>
`;

/* ================================================================
   1️⃣  RESET PASSWORD
================================================================ */
export async function sendResetEmail(to, token) {
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const body = `
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px">
      Kami menerima permintaan untuk mereset password akun Anda.
      Klik tombol di bawah untuk membuat password baru.
    </p>

    ${ctaButton(resetLink, "🔑 Reset Password Sekarang", "#1a6b35")}

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;
                padding:13px 16px;margin-top:20px">
      <p style="margin:0;font-size:12.5px;color:#78350f">
        ⚠️ Link ini hanya berlaku selama <strong>1 jam</strong>.
        Jika Anda tidak meminta reset password, abaikan email ini.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔑 Reset Password SPP Digital",
    html: baseTemplate({
      headerColor: "#1a3d28",
      headerIcon: "🔑",
      headerTitle: "Reset Password",
      body,
    }),
  });
}

/* ================================================================
   2️⃣  KIRIM AKUN SANTRI BARU
================================================================ */
export async function sendAccountEmail(to, name, username, password) {
  const body = `
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 18px">
      Assalamu'alaikum <strong>${name}</strong>,<br/>
      Akun Anda di sistem SIBATAMU-SPP telah berhasil dibuat.
      Berikut informasi login Anda:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="border-radius:10px;overflow:hidden;border:1px solid #e4ede6;margin-bottom:20px">
      ${infoRow("Username", `<span style="font-family:monospace;font-size:15px;letter-spacing:1px">${username}</span>`, "#f7faf8")}
      ${infoRow("Password", `<span style="font-family:monospace;font-size:15px;letter-spacing:1px">${password}</span>`, "#fff")}
    </table>

    ${ctaButton(`${process.env.NEXTAUTH_URL}/login`, "🚀 Login Sekarang", "#1a6b35")}

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;
                padding:13px 16px;margin-top:20px">
      <p style="margin:0;font-size:12.5px;color:#9a3412">
        ⚠️ Demi keamanan, <strong>segera ganti password</strong> Anda setelah login pertama.
        Jangan bagikan informasi ini kepada siapapun.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Akun SPP Digital Anda Telah Dibuat",
    html: baseTemplate({
      headerColor: "linear-gradient(135deg,#1a3d28,#3a8f50)",
      headerIcon: "🎉",
      headerTitle: "Akun Berhasil Dibuat",
      body,
    }),
  });
}

/* ================================================================
   3️⃣  KONFIRMASI PEMBAYARAN CASH
================================================================ */
export async function sendPaymentConfirmEmail(email, name, paymentName, amount) {
  const body = `
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 18px">
      Assalamu'alaikum <strong>${name}</strong>,<br/>
      Pembayaran Anda telah berhasil dikonfirmasi. Berikut rinciannya:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="border-radius:10px;overflow:hidden;border:1px solid #e4ede6;margin-bottom:20px">
      ${infoRow("Jenis Pembayaran", paymentName, "#f7faf8")}
      ${infoRow("Nominal", formatRupiah(amount), "#fff")}
      ${infoRow("Status", '<span style="color:#1a6b35;font-weight:700">✅ LUNAS</span>', "#f7faf8")}
      ${infoRow("Tanggal", new Date().toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" }), "#fff")}
    </table>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;
                padding:13px 16px;margin-bottom:20px;text-align:center">
      <p style="margin:0;font-size:13px;color:#1a6b35;font-weight:600">
        Jazakumullahu Khairan atas pembayaran Anda 🙏
      </p>
    </div>

    ${ctaButton(`${process.env.NEXTAUTH_URL}/santri/dashboard`, "📊 Lihat Dashboard", "#1a6b35")}
  `;

  await transporter.sendMail({
    from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✅ Konfirmasi Pembayaran - ${paymentName}`,
    html: baseTemplate({
      headerColor: "#1a6b35",
      headerIcon: "✅",
      headerTitle: "Pembayaran Dikonfirmasi",
      body,
    }),
  });
}

/* ================================================================
   4️⃣  NOTIFIKASI TAGIHAN BARU
================================================================ */
export async function sendBillNotifEmail(email, name, paymentName, amount, dueDate) {
  const due = dueDate
    ? new Date(dueDate).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })
    : "-";

  const body = `
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 18px">
      Assalamu'alaikum <strong>${name}</strong>,<br/>
      Anda memiliki tagihan baru yang perlu segera dilunasi:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="border-radius:10px;overflow:hidden;border:1px solid #e4ede6;margin-bottom:20px">
      ${infoRow("Jenis Pembayaran", paymentName, "#f7faf8")}
      ${infoRow("Nominal", `<span style="color:#c62828;font-size:16px">${formatRupiah(amount)}</span>`, "#fff")}
      ${infoRow("Jatuh Tempo", `<span style="color:#c62828">${due}</span>`, "#f7faf8")}
      ${infoRow("Status", '<span style="color:#92400e">⏳ Belum Dibayar</span>', "#fff")}
    </table>

    ${ctaButton(`${process.env.NEXTAUTH_URL}/santri/dashboard`, "💳 Bayar Sekarang", "#c62828")}

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;
                padding:13px 16px;margin-top:20px">
      <p style="margin:0;font-size:12.5px;color:#9a3412">
        ⚠️ Mohon segera lakukan pembayaran sebelum jatuh tempo untuk menghindari tunggakan.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `📋 Tagihan Baru - ${paymentName}`,
    html: baseTemplate({
      headerColor: "#c62828",
      headerIcon: "📋",
      headerTitle: "Tagihan Baru",
      body,
    }),
  });
}

/* ================================================================
   5️⃣  NOTIFIKASI TUNGGAKAN (BLAST)
================================================================ */
export async function sendTunggakanEmail(email, name, bills) {
  const total = bills.reduce((s, b) => s + b.amount, 0);

  const billRows = bills.map((b, i) => `
    <tr style="background:${i % 2 === 0 ? "#f7faf8" : "#fff"}">
      <td style="padding:11px 14px;font-size:13px;color:#1a3d28">${b.paymentType.name}</td>
      <td style="padding:11px 14px;font-size:13px;color:#c62828;font-weight:600;text-align:right">
        ${formatRupiah(b.amount)}
      </td>
      <td style="padding:11px 14px;font-size:12px;color:#c62828;text-align:right">
        ${b.dueDate ? new Date(b.dueDate).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" }) : "-"}
      </td>
    </tr>
  `).join("");

  const body = `
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 18px">
      Assalamu'alaikum <strong>${name}</strong>,<br/>
      Berikut adalah daftar tunggakan pembayaran yang belum diselesaikan:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="border-radius:10px;overflow:hidden;border:1px solid #e4ede6;margin-bottom:16px">
      <thead>
        <tr style="background:#1a3d28">
          <th style="padding:11px 14px;font-size:12px;color:#fff;text-align:left;font-weight:600">
            Jenis Pembayaran
          </th>
          <th style="padding:11px 14px;font-size:12px;color:#fff;text-align:right;font-weight:600">
            Nominal
          </th>
          <th style="padding:11px 14px;font-size:12px;color:#fff;text-align:right;font-weight:600">
            Jatuh Tempo
          </th>
        </tr>
      </thead>
      <tbody>
        ${billRows}
        <tr style="background:#fff0f0;border-top:2px solid #fecaca">
          <td style="padding:12px 14px;font-size:13px;color:#c62828;font-weight:700">
            Total Tunggakan
          </td>
          <td colspan="2" style="padding:12px 14px;font-size:15px;color:#c62828;
              font-weight:800;text-align:right">
            ${formatRupiah(total)}
          </td>
        </tr>
      </tbody>
    </table>

    ${ctaButton(`${process.env.NEXTAUTH_URL}/santri/dashboard`, "💳 Bayar Sekarang", "#e67e22")}

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;
                padding:13px 16px;margin-top:20px">
      <p style="margin:0;font-size:12.5px;color:#78350f">
        ⚠️ Mohon segera melakukan pembayaran. Hubungi admin madrasah jika ada kendala.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `⚠️ Pengingat Tunggakan SPP - ${name}`,
    html: baseTemplate({
      headerColor: "#e67e22",
      headerIcon: "⚠️",
      headerTitle: "Pengingat Tunggakan",
      body,
    }),
  });
}