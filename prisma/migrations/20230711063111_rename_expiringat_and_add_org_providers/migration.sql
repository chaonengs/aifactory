-- AlterTable
ALTER TABLE `ChatSession` RENAME COLUMN `expiringAt` to `expiredAt`;

-- CreateTable
CREATE TABLE `Provider` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `type` ENUM('GITHUB', 'FEISHU', 'WEWORK', 'DINGTALK', 'OAUTH') NOT NULL,
    `cliendId` VARCHAR(191) NOT NULL,
    `clientSecret` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NULL,
    `accessTokenExpiredAt` DATETIME(3) NULL,
    `refreshToken` VARCHAR(191) NULL,
    `refreshTokenExpiredAt` DATETIME(3) NULL,
    `config` JSON NULL,

    INDEX `Provider_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
