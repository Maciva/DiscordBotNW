const { SlashCommandBuilder } = require("@discordjs/builders"); 
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Get war statistics'),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.handleStats(interaction);
		});
	},
};