
DROP INDEX `Message_receivedMessageId_idx` ON `Message`;  

-- AlterTable
ALTER TABLE `Message` RENAME COLUMN `recievedMessageId` TO `receivedMessageId`;


-- CreateIndex
CREATE INDEX `Message_receivedMessageId_idx` ON `Message`(`receivedMessageId`);
