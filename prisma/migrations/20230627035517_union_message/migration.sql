-- CreateTable
CREATE TABLE `UnionMessage` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `expiringDate` DATETIME(3) NOT NULL,
    `sender` VARCHAR(191) NOT NULL,
    `appId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `conversationId` VARCHAR(191) NULL,
    `conversationType` INTEGER NOT NULL,

    INDEX `UnionMessage_appId_idx`(`appId`),
    INDEX `UnionMessage_organizationId_idx`(`organizationId`),
    INDEX `UnionMessage_conversationId_idx`(`conversationId`),
    INDEX `UnionMessage_conversationType_idx`(`conversationType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
