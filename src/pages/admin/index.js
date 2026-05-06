import AdminLayout from "@/components/AdminLayout"

export default function AdminHome() {
  return (
    <AdminLayout>
      <h2 className="text-lg font-semibold mb-2">Selamat datang di Sistem Manajemen SPP Santri</h2>
      <p>Gunakan menu di atas untuk mengelola data santri, mencatat pembayaran, dan melihat laporan keuangan.</p>
    </AdminLayout>
  )
}
