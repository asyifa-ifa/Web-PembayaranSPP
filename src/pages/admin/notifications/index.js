// pages/admin/notifications.js
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";

export default function NotificationsPage() {
  const [emailType, setEmailType] = useState("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!subject || !message) {
      alert("Subject dan pesan wajib diisi!");
      return;
    }

    setLoading(true);

    try {
      // nanti hubungkan ke API backend
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailType, subject, message }),
      });

      const data = await res.json();
      alert(data.message || "Email berhasil dikirim!");
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim email");
    }

    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="container">
        <h1>📧 Notifikasi Email Santri</h1>

        <div className="card">
          <label>Tipe Pengiriman</label>
          <select
            value={emailType}
            onChange={(e) => setEmailType(e.target.value)}
          >
            <option value="all">Semua Santri</option>
            <option value="tunggakan">Hanya yang punya tunggakan</option>
          </select>

          <label>Subject Email</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Contoh: Pemberitahuan Pembayaran SPP"
          />

          <label>Isi Pesan</label>
          <textarea
            rows="6"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis pesan email di sini..."
          />

          <button onClick={handleSend} disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Email"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: auto;
        }

        h1 {
          margin-bottom: 20px;
        }

        .card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        label {
          font-weight: bold;
        }

        input, select, textarea {
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
        }

        button {
          background: #1b5e20;
          color: white;
          padding: 12px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        button:hover {
          background: #2e7d32;
        }
      `}</style>
    </AdminLayout>
  );
}
