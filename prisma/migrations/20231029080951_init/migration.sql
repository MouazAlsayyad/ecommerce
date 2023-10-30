/*
  Warnings:

  - Added the required column `image` to the `OptionValue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coverImage` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OptionValue" ADD COLUMN     "image" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "coverImage" TEXT NOT NULL;
