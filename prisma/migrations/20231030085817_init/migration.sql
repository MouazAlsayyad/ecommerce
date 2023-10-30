/*
  Warnings:

  - You are about to drop the column `totalQty` on the `Product` table. All the data in the column will be lost.
  - Added the required column `id` to the `OptionValueVarint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OptionValueVarint" ADD COLUMN     "id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "totalQty",
ALTER COLUMN "available" SET DEFAULT true,
ALTER COLUMN "coverImage" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Varint" ALTER COLUMN "available" SET DEFAULT true,
ALTER COLUMN "image" DROP NOT NULL;
