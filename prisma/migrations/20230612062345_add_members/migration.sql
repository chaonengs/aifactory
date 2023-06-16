-- AlterTable
ALTER TABLE `OrganizationUsers` MODIFY `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL;
