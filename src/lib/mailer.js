import nodemailer from "nodemailer";

// ✅ Satu transporter dipakai semua fungsi
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const formatRupiah = (v) => new Intl.NumberFormat("id-ID").format(v);

/* ===============================
   1️⃣ RESET PASSWORD EMAIL
================================ */
export async function sendResetEmail(to, token) {
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset Password SPP Digital",
    html: `
      <h2 style="color:#14532d">Reset Password</h2>
      <p>Klik tombol di bawah untuk reset password:</p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 18px;background:#14532d;color:white;border-radius:8px;text-decoration:none;">
        Reset Password
      </a>
      <p style="margin-top:15px;font-size:13px;color:#666">Link ini berlaku 1 jam.</p>
    `,
  });
}

/* ===============================
   2️⃣ KIRIM AKUN SANTRI BARU
================================ */
export async function sendAccountEmail(to, username, password) {
  await transporter.sendMail({
    from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Akun SPP Digital Anda",
    html: `
      <div style="font-family:sans-serif">
        <h2 style="color:#14532d">Akun Anda Berhasil Dibuat</h2>
        <p>Berikut informasi akun Anda:</p>
        <table style="margin:10px 0">
          <tr><td><b>Username</b></td><td>: ${username}</td></tr>
          <tr><td><b>Password</b></td><td>: ${password}</td></tr>
        </table>
        <a href="${process.env.NEXTAUTH_URL}/login" style="display:inline-block;padding:10px 18px;background:#14532d;color:white;border-radius:8px;text-decoration:none;">
          Login Sekarang
        </a>
        <p style="margin-top:15px;font-size:13px;color:#666">⚠️ Segera ganti password setelah login.</p>
      </div>
    `,
  });
}

/* ===============================
   3️⃣ KONFIRMASI PEMBAYARAN CASH
================================ */
export async function sendPaymentConfirmEmail(email, name, paymentName, amount) {
  await transporter.sendMail({
    from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✅ Konfirmasi Pembayaran - ${paymentName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px">
        <h2 style="color:#2e6b3e">Konfirmasi Pembayaran</h2>
        <p>Assalamu'alaikum <strong>${name}</strong>,</p>
        <p>Pembayaran Anda telah dikonfirmasi:</p>
        <table style="width:100%;border-collapse:collapse;margin:15px 0">
          <tr style="background:#f5f5f5">
            <td style="padding:10px">Jenis Pembayaran</td>
            <td style="padding:10px"><strong>${paymentName}</strong></td>
          </tr>
          <tr>
            <td style="padding:10px">Nominal</td>
            <td style="padding:10px"><strong>Rp ${formatRupiah(amount)}</strong></td>
          </tr>
          <tr style="background:#f5f5f5">
            <td style="padding:10px">Status</td>
            <td style="padding:10px"><strong style="color:green">LUNAS ✅</strong></td>
          </tr>
        </table>
        <p>Jazakumullahu Khairan.</p>
        <p style="color:#888;font-size:12px">Madrasah Tarbiyatul Mubalighin Sumberjo</p>
      </div>
    `,
  });
}

/* ===============================
   4️⃣ NOTIFIKASI TAGIHAN BARU
================================ */
export async function sendBillNotifEmail(email, name, paymentName, amount, dueDate) {
  const due = dueDate ? new Date(dueDate).toLocaleDateString("id-ID") : "-"
  await transporter.sendMail({
    from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `📋 Tagihan Baru - ${paymentName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px">
        <h2 style="color:#c0392b">Tagihan Baru</h2>
        <p>Assalamu'alaikum <strong>${name}</strong>,</p>
        <p>Anda memiliki tagihan baru:</p>
        <table style="width:100%;border-collapse:collapse;margin:15px 0">
          <tr style="background:#f5f5f5">
            <td style="padding:10px">Jenis Pembayaran</td>
            <td style="padding:10px"><strong>${paymentName}</strong></td>
          </tr>
          <tr>
            <td style="padding:10px">Nominal</td>
            <td style="padding:10px"><strong>Rp ${formatRupiah(amount)}</strong></td>
          </tr>
          <tr style="background:#f5f5f5">
            <td style="padding:10px">Jatuh Tempo</td>
            <td style="padding:10px"><strong style="color:red">${due}</strong></td>
          </tr>
        </table>
        <p>Segera lakukan pembayaran sebelum jatuh tempo.</p>
        <a href="${process.env.NEXTAUTH_URL}/santri/dashboard" style="display:inline-block;padding:10px 18px;background:#c0392b;color:white;border-radius:8px;text-decoration:none;">
          Lihat Tagihan
        </a>
        <p style="color:#888;font-size:12px;margin-top:15px">Madrasah Tarbiyatul Mubalighin Sumberjo</p>
      </div>
    `,
  });
}

/* ===============================
   5️⃣ NOTIFIKASI TUNGGAKAN (BLAST)
================================ */
export async function sendTunggakanEmail(email, name, bills) {
  const billRows = bills.map(b => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${b.paymentType.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">Rp ${formatRupiah(b.amount)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;color:red">
        ${b.dueDate ? new Date(b.dueDate).toLocaleDateString("id-ID") : "-"}
      </td>
    </tr>
  `).join("")

  await transporter.sendMail({
    from: `"SPP Tarbiyatul Mubalighin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `⚠️ Pengingat Tunggakan SPP`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px">
        <h2 style="color:#e67e22">⚠️ Pengingat Tunggakan</h2>
        <p>Assalamu'alaikum <strong>${name}</strong>,</p>
        <p>Anda masih memiliki tunggakan yang belum dibayar:</p>
        <table style="width:100%;border-collapse:collapse;margin:15px 0">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px;text-align:left">Jenis</th>
              <th style="padding:8px;text-align:left">Nominal</th>
              <th style="padding:8px;text-align:left">Jatuh Tempo</th>
            </tr>
          </thead>
          <tbody>${billRows}</tbody>
        </table>
        <p>Mohon segera melakukan pembayaran.</p>
        <a href="${process.env.NEXTAUTH_URL}/santri/dashboard" style="display:inline-block;padding:10px 18px;background:#e67e22;color:white;border-radius:8px;text-decoration:none;">
          Bayar Sekarang
        </a>
        <p style="color:#888;font-size:12px;margin-top:15px">Madrasah Tarbiyatul Mubalighin Sumberjo</p>
      </div>
    `,
  });
}