const { Client, Intents } = require("discord.js");
require('dotenv').config()
const guildService = require('./guildService');

const intents = new Intents();
intents.add(Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS);
const client = new Client({
    intents: intents,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
})

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.user.setPresence({
        activities: [{
            name: '"!help" for commands'
        }]
    })
})

client.on("messageCreate", msg => {
    if (msg.author.id === client.user.id) {
        return;
    }
    guildService.dispatch(msg.guild.id, msg);
})

client.on("interactionCreate", interaction => {
    if (!interaction.isSelectMenu()) return;
    guildService.interact(interaction.guild.id, interaction);
})

client.login(process.env.TOKEN)



global.client = client;