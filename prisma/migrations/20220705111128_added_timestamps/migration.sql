/*
  Warnings:

  - Added the required column `timeZone` to the `server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "server" ADD COLUMN     "timeZone" INTEGER NOT NULL;
