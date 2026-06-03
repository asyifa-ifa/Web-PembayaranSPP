<div align="center">

<img src="public/logo-sibatamu.png" alt="Sibatamu Logo" width="120" />

# 🏫 SIBATAMU-SPP Sumberjo

### Sistem Informasi Pembayaran SPP Madrasah Sumberjo

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Midtrans](https://img.shields.io/badge/Midtrans-Payment-003580?style=for-the-badge)](https://midtrans.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> Platform digital untuk manajemen dan pembayaran SPP madrasah secara modern, cepat, dan transparan.

**[🌐 Live Demo](https://sibatamu-spp-sumberjo.vercel.app)** • **[📖 Dokumentasi](#)** • **[🐛 Laporkan Bug](https://github.com/asyifa-ifa/Web-PembayaranSPP/issues)**

</div>

---

## ✨ Fitur Unggulan

| Fitur | Deskripsi |
|-------|-----------|
| 💳 **Pembayaran Online** | Integrasi Midtrans untuk pembayaran SPP via transfer, e-wallet, QRIS, dll |
| 📧 **Notifikasi Email** | Konfirmasi pembayaran otomatis via Nodemailer |
| 👨‍💼 **Dashboard Admin** | Kelola data santri, tagihan, dan laporan secara terpusat |
| 👩‍🏫 **Dashboard Kepala** | Pantau rekap pembayaran dan statistik keseluruhan |
| 🎓 **Dashboard Santri** | Santri dapat melihat tagihan, riwayat pembayaran, dan bayar SPP langsung secara online |
| 📊 **Laporan Keuangan** | Laporan pembayaran SPP per bulan/tahun |
| 🔐 **Autentikasi Aman** | Sistem login berbasis role (Admin, Kepala, Santri) |
| 📱 **Responsif** | Tampilan optimal di semua perangkat |

---

## 🛠️ Tech Stack

```
Frontend   : Next.js · TailwindCSS · React
Backend    : Next.js API Routes · Node.js
Database   : Prisma ORM · MySQL/PostgreSQL
Payment    : Midtrans Payment Gateway
Email      : Nodemailer
Hosting    : Vercel + Hostinger (Domain)
Scheduler  : Cron Jobs (auto-generate tagihan)
```

---

## 🚀 Instalasi & Menjalankan Lokal

### Prasyarat
- Node.js `v18+`
- npm / yarn
- Database MySQL atau PostgreSQL

### Langkah-langkah

**1. Clone repository**
```bash
git clone https://github.com/asyifa-ifa/Web-PembayaranSPP.git
cd Web-PembayaranSPP
```

**2. Install dependencies**
```bash
npm install
```

**3. Buat file `.env`**
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/sibatamu_spp"

# Midtrans
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_client_key

# Nodemailer
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# App
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

**4. Migrasi database**
```bash
npx prisma migrate dev
npx prisma generate
```

**5. Jalankan development server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser kamu.

---

## 📁 Struktur Project

```
sibatamu-spp-sumberjo/
├── public/              # Aset statis (logo, gambar)
├── src/
│   ├── components/      # Komponen reusable
│   │   ├── ui/          # UI primitives
│   │   ├── AdminLayout  # Layout halaman admin
│   │   └── KepalaLayout # Layout halaman kepala
│   ├── lib/             # Utility & helper
│   │   ├── prisma.js    # Prisma client
│   │   ├── midtrans.js  # Midtrans config
│   │   ├── mailer.js    # Nodemailer config
│   │   └── cron.js      # Cron job scheduler
│   └── pages/
│       ├── api/         # API Routes
│       ├── admin/       # Halaman admin
│       │   ├── accounts/
│       │   ├── bills/
│       │   └── notifications/
│       └── santri/      # Halaman santri
│           ├── dashboard/   # Ringkasan tagihan & status
│           ├── tagihan/     # Daftar tagihan SPP
│           ├── pembayaran/  # Bayar SPP via Midtrans
│           └── riwayat/     # Riwayat transaksi
├── prisma/
│   └── schema.prisma    # Schema database
└── .env                 # Environment variables
```

---

## 👥 Hak Akses Per Role

| Role | Akses |
|------|-------|
| 👨‍💼 **Admin** | Kelola data santri, generate tagihan, kelola akun, lihat semua laporan |
| 👩‍🏫 **Kepala** | Lihat statistik, rekap pembayaran, laporan keuangan keseluruhan |
| 🎓 **Santri** | Lihat tagihan pribadi, bayar SPP online via Midtrans, lihat riwayat transaksi, terima notifikasi email |

---

## 💳 Alur Pembayaran Santri

```
Santri Login → Dashboard → Lihat Tagihan SPP
     → Klik Bayar → Pilih Metode Pembayaran (Midtrans)
          → Transfer / QRIS / E-Wallet
               → Konfirmasi Otomatis → Email Dikirim ✅
```

---

## 🌐 Deployment

Project ini di-deploy menggunakan **Vercel** dan akan menggunakan domain dari **Hostinger**.

```bash
# Push ke branch main untuk auto-deploy ke production
git push origin main

# Push ke branch lain untuk preview deployment
git push origin nama-branch
```

---


## 👩‍💻 Author

**Asyifa Ifa** — [@asyifa-ifa](https://github.com/asyifa-ifa)

> Project ini dikembangkan sebagai bagian dari **Skripsi** untuk membantu digitalisasi administrasi pembayaran SPP di Madrasah Sumberjo.

---

## 📄 Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat [`LICENSE`](LICENSE) untuk informasi lebih lanjut.

---

<div align="center">

Made with ❤️ for Madrasah Sumberjo

⭐ **Jangan lupa kasih star kalau project ini membantu!** ⭐

</div>