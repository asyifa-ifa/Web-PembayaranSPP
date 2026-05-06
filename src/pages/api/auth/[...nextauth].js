// pages/api/auth/[...nextauth].js

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
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

        /* =====================================================
           1️⃣ LOGIN ADMIN (.env)
        ===================================================== */
        if (
          credentials.username === process.env.ADMIN_USERNAME &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: "admin-1",
            name: "Administrator",
            role: "ADMIN",
          };
        }

        /* =====================================================
           2️⃣ LOGIN KEPALA (.env) 🔥 TAMBAHAN
        ===================================================== */
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

        /* =====================================================
           3️⃣ LOGIN DATABASE (SANTRI)
        ===================================================== */
        const user = await prisma.login.findUnique({
          where: {
            username: credentials.username,
          },
          include: {
            student: true,
          },
        });

        if (!user) {
          throw new Error("Username atau password salah");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Username atau password salah");
        }

        // 🔐 CEK STATUS AKTIF
        if (!user.isActive) {
          throw new Error("Akun dinonaktifkan");
        }

        return {
          id: user.id,
          name: user.student?.name || user.username,
          role: user.role, // SANTRI
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    /* ================= JWT ================= */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },

    /* ================= SESSION ================= */
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        role: token.role,
      };
      return session;
    },
  },

  /* ================= HALAMAN LOGIN ================= */
  pages: {
    signIn: "/login", // 🔥 sudah diganti 1 halaman
  },
};

export default NextAuth(authOptions);