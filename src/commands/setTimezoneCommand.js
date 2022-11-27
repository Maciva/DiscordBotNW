const { SlashCommandBuilder } = require("@discordjs/builders");
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set-timezone')
		.setDescription('Change timezone to match your local timezone with the calculations')
		.addStringOption(option =>
			option.setName("time")
				.setDescription("Your local time in the following format: HH:MM")
				.setRequired(true)
		),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.setTimezone(interaction);
		});
	},
};