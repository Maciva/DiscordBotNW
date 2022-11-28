const { Client, IntentsBitField, Events, Collection } = require("discord.js");
const path = require('node:path');
require('dotenv').config()
const fs = require('node:fs');
const guildService = require('./guildService');

const intents = new IntentsBitField();
intents.add(IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildVoiceStates);
const client = new Client({
    intents: intents,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
})

function cleanUpDatabase() {
    return;
    // return new Promise((resolve, reject) => {
    //     client.guilds.fetch().then(data => {
    //         data.get(this.id).fetch().then(guild => {

    //         })
    //     })
    // })
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
    cleanUpDatabase();
    client.user.setPresence({
        activities: [{
            name: '"/help" for commands'
        }]
    })
})

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) {
        if (!interaction.isSelectMenu()) return;
        guildService.interact(interaction.guild.id, interaction);
    };

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on("guildDelete", guild => {
    guildService.deleteServer(guild.id);
});

client.login(process.env.TOKEN)

global.client = client;