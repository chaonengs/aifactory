-- AlterTable
ALTER TABLE `App` MODIFY `aiResourceId` VARCHAR(191) NULL,
    MODIFY `tokenLimitation` INTEGER NULL,
    MODIFY `tokenUsed` INTEGER NOT NULL DEFAULT 0;
