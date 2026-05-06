/*
  Warnings:

  - Added the required column `address` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthdate` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthplace` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guardian` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "birthdate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "birthplace" TEXT NOT NULL,
ADD COLUMN     "guardian" TEXT NOT NULL;
