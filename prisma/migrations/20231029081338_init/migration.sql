/*
  Warnings:

  - You are about to drop the column `image` on the `OptionValue` table. All the data in the column will be lost.
  - Added the required column `image` to the `Varint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OptionValue" DROP COLUMN "image";

-- AlterTable
ALTER TABLE "Varint" ADD COLUMN     "image" TEXT NOT NULL;
