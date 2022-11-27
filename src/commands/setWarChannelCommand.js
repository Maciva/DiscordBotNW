const { SlashCommandBuilder } = require("@discordjs/builders");
const { ChannelType } = require("discord.js");
const guildService = require('../guildService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set-war-channel')
		.setDescription('Set the channel the bot should join and make calls in')
		.addChannelOption(option =>
			option.setName("channel")
				.setDescription("Voice Channel the bot will join")
				.addChannelTypes(ChannelType.GuildVoice)
				.setRequired(true)
		),
	async execute(interaction) {
		guildService.getOrCreate(interaction.guild.id, interaction).then(guild => {
			guild.setWarChannel(interaction);
		});
	},
};