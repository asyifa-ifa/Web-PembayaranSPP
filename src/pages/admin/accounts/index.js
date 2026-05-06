import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";

export default function AccountsPage() {
  const router = useRouter();

  const [students, setStudents] = useState([]);

  const [filterClass, setFilterClass] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedLoginId, setSelectedLoginId] = useState(null);
  const [password, setPassword] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  /* ================= FETCH ================= */
  const fetchStudents = async () => {
    const res = await fetch("/api/admin/accounts");
    const data = await res.json();
    setStudents(data);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* ================= OPTIONS DINAMIS ================= */

  // KELAS
  const classOptions = [
    "ALL",
    ...Array.from(
      new Set(
        students
          .map((s) => s.class?.name)
          .filter(Boolean)
      )
    ).sort(),
  ];

  // ANGKATAN (entryYear)
  const yearOptions = [
    "ALL",
    ...Array.from(
      new Set(
        students
          .map((s) => s.entryYear)
          .filter(Boolean)
      )
    ).sort((a, b) => b - a), // terbaru di atas
  ];

  /* ================= FILTER ================= */
  const filteredStudents = students.filter((s) => {
    const matchClass =
      filterClass === "ALL" || s.class?.name === filterClass;

    const matchYear =
      filterYear === "ALL" || s.entryYear === Number(filterYear);

    return matchClass && matchYear;
  });

  /* ================= CREATE ================= */
  const openCreateModal = (student) => {
    setSelectedStudent(student);
    setPassword("");
    setIsEdit(false);
    setShowModal(true);
  };

  const submitCreate = async () => {
    await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: selectedStudent.id,
        password,
      }),
    });

    setShowModal(false);
    fetchStudents();
  };

  /* ================= UPDATE PASSWORD ================= */
  const openEditModal = (student) => {
    setSelectedStudent(student);
    setSelectedLoginId(student.login.id);
    setPassword("");
    setIsEdit(true);
    setShowModal(true);
  };

  const submitUpdate = async () => {
    await fetch(`/api/admin/accounts/${selectedLoginId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setShowModal(false);
    fetchStudents();
  };

  /* ================= DELETE ================= */
  const deleteAccount = async (loginId) => {
    if (!confirm("Yakin ingin menghapus akun ini?")) return;

    await fetch(`/api/admin/accounts/${loginId}`, {
      method: "DELETE",
    });

    fetchStudents();
  };

  /* ================= TOGGLE ACTIVE ================= */
  const toggleStatus = async (loginId, currentStatus) => {
    await fetch(`/api/admin/accounts/${loginId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggle: !currentStatus }),
    });

    fetchStudents();
  };

  return (
    <AdminLayout>
    <div className="page">
      <button
        className="btn-back"
        onClick={() => router.push("/admin/dashboard")}
      >
        ← Dashboard Admin
      </button>

      <h1>Kelola Akun Santri</h1>

      {/* ================= FILTER ================= */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        
        {/* FILTER KELAS */}
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="filter"
        >
          {classOptions.map((cls) => (
            <option key={cls} value={cls}>
              {cls === "ALL" ? "Semua Kelas" : cls}
            </option>
          ))}
        </select>

        {/* FILTER ANGKATAN */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="filter"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year === "ALL" ? "Semua Angkatan" : `Angkatan ${year}`}
            </option>
          ))}
        </select>
      </div>

      {/* ================= TABLE ================= */}
      <table className="table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama</th>
            <th>Kelas</th>
            <th>Angkatan</th>
            <th>Username</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((s, i) => (
            <tr key={s.id}>
              <td>{i + 1}</td>
              <td>{s.name}</td>
              <td>{s.class?.name}</td>
              <td>{s.entryYear || "-"}</td>
              <td>{s.login?.username || "-"}</td>
              <td>
                {s.login ? (
                  <button
                    className={
                      s.login.isActive
                        ? "badge-active"
                        : "badge-inactive"
                    }
                    onClick={() =>
                      toggleStatus(s.login.id, s.login.isActive)
                    }
                  >
                    {s.login.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                ) : (
                  "-"
                )}
              </td>
              <td>
                {s.login ? (
                  <>
                    <button
                      className="btn btn-warning"
                      onClick={() => openEditModal(s)}
                    >
                      Reset
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteAccount(s.login.id)}
                    >
                      Hapus
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => openCreateModal(s)}
                  >
                    Buat Akun
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="modal">
          <div className="modal-box">
            <h3>{isEdit ? "Reset Password" : "Buat Akun"}</h3>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={isEdit ? submitUpdate : submitCreate}
              >
                Simpan
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page { padding: 20px; }
        .table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; border-bottom: 1px solid #ddd; }
        .btn { padding: 6px 10px; margin-right: 5px; border: none; cursor: pointer; border-radius: 6px;}
        .btn-primary { background: #1b5e20; color: white; }
        .btn-danger { background: #b91c1c; color: white; }
        .btn-warning { background: #f59e0b; color: white; }
        .btn-secondary { background: gray; color: white; }
        .badge-active { background: #15803d; color: white; padding: 5px 10px; border-radius: 6px; border:none;}
        .badge-inactive { background: #b91c1c; color: white; padding: 5px 10px; border-radius: 6px; border:none;}
        .modal { position: fixed; inset:0; background: rgba(0,0,0,.4); display:flex; justify-content:center; align-items:center;}
        .modal-box { background:white; padding:20px; border-radius:10px; width:300px;}
        .filter { padding: 6px; border-radius: 6px; }
      `}</style>
    </div>
  </AdminLayout>
  );
}