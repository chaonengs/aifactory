/*
  Warnings:

  - You are about to drop the `UnionMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `UnionMessage`;

-- CreateTable
CREATE TABLE `ChatSession` (
    `createdAt` DATETIME(3) NOT NULL,
    `expiringAt` DATETIME(3) NOT NULL,
    `sender` VARCHAR(191) NOT NULL,
    `appId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `type` ENUM('MUITIWHEEL', 'SINGLEWHEEL') NOT NULL DEFAULT 'SINGLEWHEEL',

    INDEX `ChatSession_appId_idx`(`appId`),
    INDEX `ChatSession_organizationId_idx`(`organizationId`),
    INDEX `ChatSession_groupId_idx`(`groupId`),
    INDEX `ChatSession_sender_idx`(`sender`),
    PRIMARY KEY (`groupId`, `sender`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
