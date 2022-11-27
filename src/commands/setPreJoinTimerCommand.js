const { SlashCommandBuilder } = require("@discordjs/builders");
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set-pre-join-timer')
		.setDescription('Time in seconds before the bot should join the war channel.')
		.addIntegerOption(option =>
			option.setName("time")
				.setDescription("Time in seconds before the bot should join the war channel")
				.setMinValue(0)
				.setRequired(true)
		),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.setPreJoinTimer(interaction);
		});
	},
};