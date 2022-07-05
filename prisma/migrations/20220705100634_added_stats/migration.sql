/*
  Warnings:

  - Added the required column `warCount` to the `server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "server" ADD COLUMN     "warCount" INTEGER NOT NULL;
