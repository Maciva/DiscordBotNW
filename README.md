# New World War Bot

New World War Bot is a DiscordBot assisting in wars by calling respawn waves.

## Setup

Use the following [link](https://discord.com/oauth2/authorize?client_id=962099365672001586&permissions=3155968&scope=applications.commands%20bot) to setup the bot.

## Usage
Invite the Bot to your server and use `/help` for a list of commands

## Setup own Server
Install the latest node version [here](https://nodejs.org/en/download/)

Install ffmpeg [here](https://ffmpeg.org/download.html)

Install Docker [here](https://docs.docker.com/get-docker/)

Setup an `.env` file in the project folder with the following entries:

| Key           | Value         |
| ------------- |:--------------| 
| DATABASE_URL  | postgresql://nwbot:PASSWORD@localhost:5432/nwbot?schema=public |
| TOKEN         | Discord Token |
| POSTGRES_PASSWORD | Standard Password for the default postgres user      | 

Run:
```
docker compose up -d
```
connect to the running postgresql and run:
```
CREATE USER nwbot WITH PASSWORD '[YOUR PASSWORD DEFINED IN DATABASE_URL]' CREATEDB;
```

To install all npm packages, run:
```
npm install
```
To setup the database schema, run:
```
npx prisma migrate dev
```
To start the server, run
```
node ./src/main.js
```
