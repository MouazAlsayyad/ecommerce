/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `OptionValueVarint` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `OptionValueVarint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OptionValueVarint" ADD COLUMN     "id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OptionValueVarint_id_key" ON "OptionValueVarint"("id");
