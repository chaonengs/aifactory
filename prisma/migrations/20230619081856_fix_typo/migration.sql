/*
  Warnings:

  - The primary key for the `SensitiveWordInMessage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `messgeId` on the `SensitiveWordInMessage` table. All the data in the column will be lost.
  - Added the required column `messageId` to the `SensitiveWordInMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `SensitiveWordInMessage_messgeId_idx` ON `SensitiveWordInMessage`;

-- AlterTable
ALTER TABLE `SensitiveWordInMessage` DROP PRIMARY KEY,
    DROP COLUMN `messgeId`,
    ADD COLUMN `messageId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`messageId`, `sensitiveWordId`);

-- CreateIndex
CREATE INDEX `SensitiveWordInMessage_messageId_idx` ON `SensitiveWordInMessage`(`messageId`);
