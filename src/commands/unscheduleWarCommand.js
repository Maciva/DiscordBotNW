const { SlashCommandBuilder } = require("@discordjs/builders");
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unschedule-war')
		.setDescription('Unschedule a war which starts at given time')
		.addStringOption(option =>
			option.setName('time')
				.setDescription('Unschedule a war which starts at HH:MM. Must be of the following format: HH:MM')
				.setRequired(true)
				.setMinLength(5)
				.setMaxLength(5)
		),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.handleUnscheduleWar(interaction);
		});
	},
};