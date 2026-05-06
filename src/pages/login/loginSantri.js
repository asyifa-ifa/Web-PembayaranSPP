// import { signIn } from "next-auth/react";
// import { useRouter } from "next/router";
// import { useState } from "react";

// export default function LoginSantri() {
//   const router = useRouter();
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//  const handleLogin = async (e) => {
//   e.preventDefault();
//   setLoading(true);
//   setError("");

//   const res = await signIn("credentials", {
//     redirect: false,
//     username,
//     password,
//     role: "SANTRI",
//   });

//   if (res?.error) {
//     // 🔐 Jika akun dinonaktifkan
//     if (res.error === "Akun dinonaktifkan") {
//       setError("Akun Anda telah dinonaktifkan. Hubungi admin.");
//     } else {
//       setError("Username atau password salah");
//     }

//     setLoading(false);
//     return;
//   }

//   router.push("/santri/dashboard");
// };

//   return (
//     <div className="login-page">
//       <form className="login-box" onSubmit={handleLogin}>
//         <h1>Login Santri</h1>
//         <p className="subtitle">
//           Masukkan username dan password santri
//         </p>

//         {error && <div className="error">{error}</div>}

//         <input
//           type="text"
//           placeholder="Username"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           required
//         />

//         {/* PASSWORD + TOGGLE */}
//         <div className="password-wrapper">
//           <input
//             type={showPassword ? "text" : "password"}
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//           />

//           <button
//             type="button"
//             className="toggle"
//             onClick={() => setShowPassword(!showPassword)}
//           >
//             {showPassword ? "🙈" : "👁️"}
//           </button>
//         </div>

//         <button type="submit" disabled={loading}>
//           {loading ? "Memproses..." : "Login"}
//         </button>
//       </form>

//       {/* ================= STYLE ================= */}
//       <style jsx>{`
//         .login-page {
//           min-height: 100vh;
//           display: flex;
//           justify-content: center;
//           align-items: center;
//           background: #f6f7f9;
//           padding: 20px;
//         }

//         .login-box {
//           background: white;
//           padding: 30px;
//           width: 100%;
//           max-width: 360px;
//           border-radius: 12px;
//           box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
//           display: flex;
//           flex-direction: column;
//           gap: 12px;
//         }

//         h1 {
//           text-align: center;
//           font-size: 22px;
//           color: #1b5e20;
//         }

//         .subtitle {
//           text-align: center;
//           font-size: 13px;
//           color: #666;
//           margin-bottom: 8px;
//         }

//         input {
//           width: 100%;
//           padding: 10px 12px;
//           border-radius: 8px;
//           border: 1px solid #ccc;
//           font-size: 14px;
//         }

//         .password-wrapper {
//           position: relative;
//         }

//         .toggle {
//           position: absolute;
//           right: 10px;
//           top: 50%;
//           transform: translateY(-50%);
//           background: none;
//           border: none;
//           cursor: pointer;
//           font-size: 16px;
//         }

//         button[type="submit"] {
//           margin-top: 10px;
//           padding: 10px;
//           border-radius: 8px;
//           border: none;
//           cursor: pointer;
//           font-size: 15px;
//           background: #1b5e20;
//           color: white;
//         }

//         button[type="submit"]:disabled {
//           opacity: 0.7;
//         }

//         .error {
//           background: #fee2e2;
//           color: #b91c1c;
//           padding: 8px;
//           border-radius: 6px;
//           font-size: 13px;
//           text-align: center;
//         }

//         @media (max-width: 480px) {
//           .login-box {
//             padding: 24px;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }