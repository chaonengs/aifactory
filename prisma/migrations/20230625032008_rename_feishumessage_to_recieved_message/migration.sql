ALTER TABLE `FeiShuMessage` RENAME `RecievedMessage`;

DROP INDEX `Message_feishuMessageId_idx` ON `Message`;  

-- AlterTable
ALTER TABLE `Message` RENAME COLUMN `feishuMessageId` TO `recievedMessageId`;
ALTER TABLE `Message` ADD INDEX `Message_recievedMessageId_idx` (`recievedMessageId`);

ALTER TABLE `RecievedMessage` ADD  `type` ENUM('FEISHU', 'WEWORK', 'DINGTALK', 'WEB', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN';
DROP INDEX `FeiShuMessage_appId_idx` ON `RecievedMessage`;  
ALTER TABLE `Message` ADD INDEX `RecievedMessage_appId_idx` (`appId`);
