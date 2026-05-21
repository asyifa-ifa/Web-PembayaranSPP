import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username dan password wajib diisi");
        }

        // LOGIN ADMIN
        if (
          credentials.username === process.env.ADMIN_USERNAME &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "admin-1", name: "Administrator", role: "ADMIN" };
        }

        // LOGIN KEPALA
        if (
          credentials.username === process.env.KEPALA_USERNAME &&
          credentials.password === process.env.KEPALA_PASSWORD
        ) {
          return {
            id: "kepala-1",
            name: process.env.KEPALA_NAME || "Kepala Madrasah",
            role: "KEPALA",
          };
        }

        // LOGIN SANTRI (database)
        const user = await prisma.login.findUnique({
          where: { username: credentials.username },
          include: { student: true },
        });

        if (!user) throw new Error("Username atau password salah");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Username atau password salah");

        if (!user.isActive) throw new Error("Akun dinonaktifkan");

        return {
          id: user.id,
          name: user.student?.name || user.username,
          email: user.student?.email || null,
          role: user.role,
          // ✅ Simpan NIS dan studentId agar bisa dicari di API
          nis: user.student?.nis || null,
          studentId: user.student?.id || null,
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;

        const student = await prisma.student.findFirst({
          where: { email: email },
          include: { login: true },
        });

        if (!student) {
          return "/login?error=EmailNotRegistered";
        }

        user.role = "SANTRI";
        user.studentId = student.id;
        user.studentName = student.name;
        user.nis = student.nis;  // ✅ Simpan NIS untuk Google login
        return true;
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.studentName || user.name;
        token.role = user.role;
        token.nis = user.nis || null;          // ✅ Simpan NIS ke token
        token.studentId = user.studentId || null; // ✅ Simpan studentId ke token
        token.email = user.email || null;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        role: token.role,
        nis: token.nis,              // ✅ Expose NIS ke session
        studentId: token.studentId,  // ✅ Expose studentId ke session
        email: token.email,
      };
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (
        url === baseUrl ||
        url === `${baseUrl}/` ||
        url.includes("/login")
      ) {
        return `${baseUrl}/auth-redirect`;
      }
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/auth-redirect`;
    },
  },

  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);