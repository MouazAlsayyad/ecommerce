/*
  Warnings:

  - You are about to drop the column `id` on the `OptionValueVarint` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "OptionValueVarint_id_key";

-- AlterTable
ALTER TABLE "OptionValueVarint" DROP COLUMN "id";
