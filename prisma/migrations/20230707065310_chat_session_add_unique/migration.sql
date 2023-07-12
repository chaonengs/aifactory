/*
  Warnings:

  - A unique constraint covering the columns `[groupId,sender,appId]` on the table `ChatSession` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `ChatSession_groupId_idx` ON `ChatSession`;

-- DropIndex
DROP INDEX `ChatSession_sender_idx` ON `ChatSession`;

-- CreateIndex
CREATE UNIQUE INDEX `ChatSession_groupId_sender_appId_key` ON `ChatSession`(`groupId`, `sender`, `appId`);
