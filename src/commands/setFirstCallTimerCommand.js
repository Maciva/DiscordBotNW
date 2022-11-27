const { SlashCommandBuilder } = require("@discordjs/builders");
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set-first-call-timer')
		.setDescription('Time in seconds after the bot starts to call respawn waves.')
		.addIntegerOption(option =>
			option.setName("time")
				.setDescription("Time in seconds after the bot starts to call respawn waves.")
				.setMinValue(0)
				.setRequired(true)
		),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.setFirstCallTimer(interaction);
		});
	},
};