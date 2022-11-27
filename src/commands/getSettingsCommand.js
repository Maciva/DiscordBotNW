const { SlashCommandBuilder } = require("@discordjs/builders"); 
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('get-settings')
		.setDescription('list all current settings'),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.handleGetSettings(interaction);
		});
	},
};