/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Organization` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Organization_ownerId_idx` ON `Organization`;

-- AlterTable
ALTER TABLE `Organization` DROP COLUMN `ownerId`;

-- CreateTable
CREATE TABLE `OrganizationUsers` (
    `userId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MEMBER') NOT NULL,

    INDEX `OrganizationUsers_organizationId_idx`(`organizationId`),
    INDEX `OrganizationUsers_userId_idx`(`userId`),
    PRIMARY KEY (`userId`, `organizationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
