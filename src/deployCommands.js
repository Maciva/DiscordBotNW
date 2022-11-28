const { Client, IntentsBitField, Events, Collection } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');
const path = require('node:path');
require('dotenv').config()
const fs = require('node:fs');

const intents = new IntentsBitField();
intents.add(IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildVoiceStates);
const client = new Client({
    intents: intents,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
})

function deployCommands() {
    const commands = [];
    const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());
    }
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    (async () => {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);
            const data = await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );

            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
        client.destroy();
    })();
}

client.on("ready", () => {
    deployCommands();
})

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.login(process.env.TOKEN)

global.client = client;