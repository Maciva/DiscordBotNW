-- CreateTable
CREATE TABLE "server" (
    "id" TEXT NOT NULL,
    "preJoinTimer" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "warChannel" TEXT NOT NULL,
    "callRate" INTEGER[],

    CONSTRAINT "server_pkey" PRIMARY KEY ("id")
);
