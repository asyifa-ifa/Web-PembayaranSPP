-- CreateTable
CREATE TABLE "Ustadz" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "jabatan" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "subjects" TEXT[],
    "classId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ustadz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ustadz_classId_key" ON "Ustadz"("classId");

-- AddForeignKey
ALTER TABLE "Ustadz" ADD CONSTRAINT "Ustadz_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
