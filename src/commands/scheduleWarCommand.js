const { SlashCommandBuilder } = require("@discordjs/builders");
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('schedule-war')
		.setDescription('Schedule a war at given time')
		.addStringOption(option =>
			option.setName('time')
				.setDescription('Time of war in the following format: HH:MM')
				.setRequired(true)
				.setMinLength(5)
				.setMaxLength(5)
		),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.handleScheduleWar(interaction);
		});
	},
};