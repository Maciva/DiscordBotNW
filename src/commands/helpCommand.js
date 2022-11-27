const { SlashCommandBuilder } = require("@discordjs/builders"); 
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('list of commands'),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.handleHelp(interaction);
		});
	},
};