-- DropIndex
DROP INDEX IF EXISTS "Admin_email_key";

-- 1) Tambahkan kolom username tanpa NOT NULL dulu
ALTER TABLE "Admin" 
ADD COLUMN "username" TEXT;

-- 2) Isi username untuk admin lama
UPDATE "Admin"
SET "username" = 'admin'
WHERE "username" IS NULL;

-- 3) Jadikan kolom username wajib (NOT NULL)
ALTER TABLE "Admin"
ALTER COLUMN "username" SET NOT NULL;

-- 4) Hapus kolom email (kalau benar-benar tidak dipakai)
ALTER TABLE "Admin"
DROP COLUMN "email";

-- 5) Tambahkan UNIQUE INDEX pada username
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateTable ReRegistrationFee
CREATE TABLE "ReRegistrationFee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReRegistrationFee_pkey" PRIMARY KEY ("id")
);
