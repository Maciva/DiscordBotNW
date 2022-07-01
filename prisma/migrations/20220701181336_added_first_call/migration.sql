/*
  Warnings:

  - Added the required column `firstCallTimer` to the `server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "server" ADD COLUMN     "firstCallTimer" TEXT NOT NULL;
