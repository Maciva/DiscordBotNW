/*
  Warnings:

  - Changed the type of `preJoinTimer` on the `server` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `firstCallTimer` on the `server` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "server" DROP COLUMN "preJoinTimer",
ADD COLUMN     "preJoinTimer" INTEGER NOT NULL,
DROP COLUMN "firstCallTimer",
ADD COLUMN     "firstCallTimer" INTEGER NOT NULL;
