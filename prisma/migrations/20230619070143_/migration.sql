/*
  Warnings:

  - The primary key for the `SensitiveWord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `SensitiveWord` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - A unique constraint covering the columns `[value,organizationId]` on the table `SensitiveWord` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `value` to the `SensitiveWord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `SensitiveWord` DROP PRIMARY KEY,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `value` VARCHAR(191) NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `SensitiveWordInMessage` (
    `messgeId` VARCHAR(191) NOT NULL,
    `sensitiveWordId` INTEGER NOT NULL,
    `plainText` VARCHAR(191) NOT NULL,

    INDEX `SensitiveWordInMessage_messgeId_idx`(`messgeId`),
    INDEX `SensitiveWordInMessage_sensitiveWordId_idx`(`sensitiveWordId`),
    PRIMARY KEY (`messgeId`, `sensitiveWordId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `SensitiveWord_value_idx` ON `SensitiveWord`(`value`);

-- CreateIndex
CREATE UNIQUE INDEX `SensitiveWord_value_organizationId_key` ON `SensitiveWord`(`value`, `organizationId`);
