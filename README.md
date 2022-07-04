# New World War Bot

New World War Bot is a DiscordBot assisting in wars by calling respawn waves.

## Setup

Use the following [link](https://discord.com/oauth2/authorize?client_id=962099365672001586&permissions=3155968&scope=bot) to setup the bot.

## Usage
### Basics
The bot is usable straight away with given default settings: <br/>
- The bot only listens for commands in a channel named "war-bot" and joins a voice channel "war-channel". Schedule a war with `!scheduleWar [Timestamp]`. The Timestamp has to be in the following format: `hh:mm`. <br /> Example: `!scheduleWar 20:00`
- Unschedule wars by `!unscheduleWar [Timestamp]`
- `!leaveWar` to let the bot leave the war earlier, if you managed to pull up a fast win
### Advanced
To start a war in mm:ss (minutes:seconds):
```
!startWar mm:ss
```

To list all scheduled wars:
```
!list
```
To get a list of commands:
```
!help
```
The bot can be furhter customized by adjusting the settings in the following format: <br />
```
!settings set [SETTING] [OPTIONAL VALUE]
```
Values including spaces have to be put in qoutes.

Settings can be viewed by:
```
!settings get [SETTING]
```

#### Settings
##### channelName
- Channel Name the bot listens on for commands. Make sure that the bot has access to read and write in that channel.
- Example: `!settings set channelName "test-channel"`
- Default value: "war-bot"
##### warChannel
- War Channel the bot joins on war. Make sure that the bot has access to join that channel.
- Example: `!settings set warChannel "test-channel"`
- Default value: "war-bot"
##### preJoinTimer
- Time in seconds before the bot joins the voice channel.
- Example: `!settings set preJoinTimer 300`
- Default value: 300
##### firstCallTimer
- Time in seconds before the bot starts calling respawnwaves. The first respawn waves are very frequent. This is mainly to reduce spam.
- Example: `!settings set firstCallTimer 600`
- Default value: 600
##### callRate
- List of times in seconds before a wave the bot should remind about the respawn wave (use qoutes)
- Example: `!settings set callRate "5 10 15"`
- Default value: "5 10 15"

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
connect to the running postgresql database and create a user and database named nwbot with given password defined in the `.env` file in `DATABASE_URL`

To install all npm packages, run:
```
npm install
```
To setup the database schema, run:
```
npx prisma migrate
```
To start the server, run
```
node ./src/main.js
```
