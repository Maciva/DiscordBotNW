const { SlashCommandBuilder } = require("@discordjs/builders");
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start-war')
		.setDescription('Start a war in given time')
		.addStringOption(option =>
			option.setName('time')
				.setDescription('Start a war in MM minutes and SS Seconds. Has to be in the following Format: MM:SS')
				.setRequired(true)
				.setMinLength(5)
				.setMaxLength(5)
		),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.handleStartWar(interaction);
		});
	},
};