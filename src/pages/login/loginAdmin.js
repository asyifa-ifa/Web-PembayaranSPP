// // pages/login/loginAdmin.js
// import { useState } from "react";
// import { useRouter } from "next/router";
// import { signIn } from "next-auth/react";

// export default function LoginAdmin() {
//   const router = useRouter();

//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [showPassword, setShowPassword] = useState(false); // ✅ state baru

//   async function handleLogin(e) {
//     e.preventDefault();

//     const res = await signIn("credentials", {
//       username,
//       password,
//       redirect: false,
//     });

//     if (res?.ok) {
//       router.push("/admin/dashboard");
//     } else {
//       setError("Username atau password salah");
//     }
//   }

//   return (
//     <div style={styles.container}>
//       <form onSubmit={handleLogin} style={styles.card}>
//         <h2 style={styles.title}>Login Admin</h2>

//         {error && <p style={styles.error}>{error}</p>}

//         <input
//           type="text"
//           placeholder="Username"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           style={styles.input}
//         />

//         {/* ✅ PASSWORD + BUTTON */}
//         <div style={styles.passwordWrapper}>
//           <input
//             type={showPassword ? "text" : "password"}
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             style={styles.passwordInput}
//           />
//           <button
//             type="button"
//             onClick={() => setShowPassword(!showPassword)}
//             style={styles.eyeButton}
//           >
//             {showPassword ? "🙈" : "👁"}
//           </button>
//         </div>

//         <button type="submit" style={styles.button}>
//           Login
//         </button>
//       </form>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     minHeight: "100vh",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#f0f2f5",
//   },
//   card: {
//     backgroundColor: "#fff",
//     padding: "2rem",
//     borderRadius: "8px",
//     boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "1rem",
//     width: "100%",
//     maxWidth: "360px",
//   },
//   title: {
//     margin: 0,
//     textAlign: "center",
//     fontSize: "1.5rem",
//   },
//   error: {
//     color: "red",
//     margin: 0,
//     fontSize: "0.9rem",
//   },
//   input: {
//     padding: "0.6rem 0.8rem",
//     fontSize: "1rem",
//     border: "1px solid #ccc",
//     borderRadius: "4px",
//     outline: "none",
//   },

//   // ✅ wrapper password
//   passwordWrapper: {
//     position: "relative",
//     display: "flex",
//     alignItems: "center",
//   },

//   passwordInput: {
//     width: "100%",
//     padding: "0.6rem 2.5rem 0.6rem 0.8rem",
//     fontSize: "1rem",
//     border: "1px solid #ccc",
//     borderRadius: "4px",
//     outline: "none",
//   },

//   eyeButton: {
//     position: "absolute",
//     right: "8px",
//     background: "none",
//     border: "none",
//     cursor: "pointer",
//     fontSize: "1rem",
//   },

//   button: {
//     padding: "0.7rem",
//     backgroundColor: "#4f46e5",
//     color: "#fff",
//     fontSize: "1rem",
//     border: "none",
//     borderRadius: "4px",
//     cursor: "pointer",
//   },
// };