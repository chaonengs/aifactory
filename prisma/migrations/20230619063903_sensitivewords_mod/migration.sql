/*
  Warnings:

  - Added the required column `organizationId` to the `SensitiveWord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `SensitiveWord` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `SensitiveWord_organizationId_idx` ON `SensitiveWord`(`organizationId`);
