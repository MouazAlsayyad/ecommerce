/*
  Warnings:

  - The primary key for the `OptionValueVarint` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `OptionValueVarint` table. All the data in the column will be lost.
  - Added the required column `optionId` to the `OptionValueVarint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OptionValueVarint" DROP CONSTRAINT "OptionValueVarint_pkey",
DROP COLUMN "id",
ADD COLUMN     "optionId" INTEGER NOT NULL,
ADD CONSTRAINT "OptionValueVarint_pkey" PRIMARY KEY ("VarintId", "optionId");

-- AddForeignKey
ALTER TABLE "OptionValueVarint" ADD CONSTRAINT "OptionValueVarint_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
