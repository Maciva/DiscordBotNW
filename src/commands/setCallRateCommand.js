const { SlashCommandBuilder } = require("@discordjs/builders");
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set-call-rate')
		.setDescription('Set the call rate of the bot calling respawn waves')
		.addStringOption(option =>
			option.setName('times')
				.setDescription('List of times in seconds in the following format: ss ss ss ...')
				.setRequired(true)
		),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.setCallRate(interaction);
		});
	},
};