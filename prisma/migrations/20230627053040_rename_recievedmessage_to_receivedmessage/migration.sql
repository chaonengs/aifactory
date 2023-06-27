ALTER TABLE `RecievedMessage` RENAME `ReceivedMessage`;

DROP INDEX `Message_recievedMessageId_idx` ON `Message`;  
DROP INDEX `RecievedMessage_appId_idx` ON `Message`;  

CREATE INDEX `Message_receivedMessageId_idx` ON `Message`(`appId`);


-- AlterTable
ALTER TABLE `Message` ADD COLUMN `isAIAnswer` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `ReceivedMessage_appId_idx` ON `ReceivedMessage`(`appId`);
