const { SlashCommandBuilder } = require("@discordjs/builders"); 
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave-war')
		.setDescription('If active, manually leave current war'),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.handleLeave(interaction);
		});
	},
};