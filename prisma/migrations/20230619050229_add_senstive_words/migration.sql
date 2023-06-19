-- AlterTable
ALTER TABLE `Message` ADD COLUMN `sensitiveWords` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SensitiveWord` (
    `id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
