const { ActionRowBuilder, SelectMenuBuilder, EmbedBuilder } = require("discord.js");

function row(selected) {
    return new ActionRowBuilder()
        .addComponents(
            new SelectMenuBuilder()
                .setCustomId('selected')
                .setPlaceholder('Nothing selected')
                .addOptions([
                    {
                        label: 'Scheduling',
                        description: 'Manage your wars',
                        value: 'scheduling',
                        default: selected === 'scheduling'
                    },
                    {
                        label: 'Settings',
                        description: 'Customize the bot to your needs',
                        value: 'settings',
                        default: selected === 'settings'
                    },
                    {
                        label: 'Other',
                        description: 'Other commands',
                        value: 'other',
                        default: selected === 'other'
                    },
                ]),
        );
}

function settingsRow(selected, disabled) {
    return new ActionRowBuilder()
        .addComponents(
            new SelectMenuBuilder()
                .setCustomId('sub_selected')
                .setPlaceholder(disabled ? "Settings options" : "Nothing selected")
                .setDisabled(disabled)
                .addOptions([
                    {
                        label: 'war-channel',
                        value: 'settings_war-channel',
                        default: selected === 'war-channel'
                    },
                    {
                        label: 'pre-join-timer',
                        value: 'settings_pre-join-timer',
                        default: selected === 'pre-join-timer'
                    },
                    {
                        label: 'first-call-timer',
                        value: 'settings_first-call-timer',
                        default: selected === 'first-call-timer'
                    },
                    {
                        label: 'call-rate',
                        value: 'settings_call-rate',
                        default: selected === 'call-rate'
                    },
                    {
                        label: 'timezone',
                        value: 'settings_timezone',
                        default: selected === 'timezone'
                    },
                ]),
        );
}

function handleHelp(msg) {


    const embed = new EmbedBuilder()
        .setDescription(
            "Please choose a category in the dropdown menu"
        )
        .setColor(0xAAAAFF)
        .setTitle("Help")
    msg.reply({
        embeds: [embed],
        components: [row(""), settingsRow("", true)]
    });
}

function helpScheduling(interaction) {
    const embed = new EmbedBuilder()
        .setDescription(
            "Commands for managing wars"
        )
        .setColor(0xAAAAFF)
        .setTitle("Scheduling")
        .addFields([
            {
                name: `\`/schedule-war <HH:MM>\``,
                value: 'Schedule a war at given time (HH:MM).',
            },
            {
                name: `\`/start-war <MM:SS>\``,
                value: 'Schedule a war which starts in given time (MM:SS)',
            },
            {
                name: `\`/leave-war\``,
                value: 'Manually make the bot leave the war channel',
            },
            {
                name: `\`/list\``,
                value: 'List all scheduled wars',
            },
            {
                name: `\`/unschedule-war <HH:MM>\``,
                value: 'Unschedule a war at time (HH:MM) specified by \`/list\`.',
            },
        ])
    interaction.update({
        embeds: [embed],
        components: [row("scheduling"), settingsRow(undefined, true)]
    })
}

function helpSettings(interaction, option) {
    const embed = new EmbedBuilder()
        .setDescription(
            `${option ? option.description : `Commands for customizing the bot. To view examples, select an option from the dropdown below.`}`
        ).setTitle("Settings")
        .setColor(0xAAAAFF)
        .addFields([
            {
                name: `\`/set-${option ? option.name : '<OPTION>'} ${option ? option.value : '<VALUE>'}\``,
                value: `Set ${option ? option.name : `an option`} to ${option ? option.value : `a specified value`}.`,
            },
        ])
    interaction.update({
        embeds: [embed],
        components: [row("settings"), settingsRow(option?.name, false)]
    })
}

function helpOther(interaction) {
    const embed = new EmbedBuilder()
        .setDescription(
            "Other commands"
        ).setTitle("Other")
        .setColor(0xAAAAFF)
        .addFields([
            {
                name: `\`/stats\``,
                value: 'Get the total number of wars',
            }
        ])
    interaction.update({
        embeds: [embed],
        components: [row("other"), settingsRow(undefined, true)]
    })
}

exports.handleHelp = handleHelp;
exports.helpScheduling = helpScheduling;
exports.helpSettings = helpSettings;
exports.helpOther = helpOther;