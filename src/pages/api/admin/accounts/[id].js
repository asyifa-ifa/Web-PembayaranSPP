import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { id } = req.query;

  // UPDATE password atau isActive
  if (req.method === "PUT") {
    try {
      const { password, isActive } = req.body;
      const updateData = {};

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      if (typeof isActive === "boolean") {
        updateData.isActive = isActive;
      }

      await prisma.login.update({
        where: { id },
        data: updateData,
      });

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  // DELETE akun
  else if (req.method === "DELETE") {
    try {
      await prisma.login.delete({ where: { id } });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  else {
    res.status(405).end();
  }
}