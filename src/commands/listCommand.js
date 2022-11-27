const { SlashCommandBuilder } = require("@discordjs/builders"); 
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('list all currently scheduled wars'),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.handleList(interaction);
		});
	},
};