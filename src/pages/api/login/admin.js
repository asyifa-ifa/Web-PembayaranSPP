// //api/login/admin.js
// export default function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method tidak diizinkan" });
//   }

//   const { username, password } = req.body;

//   // USERNAME & PASSWORD PERMANEN
//   const ADMIN_USERNAME = "admin123";
//   const ADMIN_PASSWORD = "Sumberjo01";

//   if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
//     return res.status(200).json({
//       success: true,
//       message: "Login berhasil",
//     });
//   } else {
//     return res.status(401).json({
//       success: false,
//       message: "Username atau password salah",
//     });
//   }
// }
