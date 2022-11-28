const { createAudioPlayer, NoSubscriberBehavior, getVoiceConnection, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const help = require("./help");
const { getRandomLeaveFile, millisToCETString, validateTimeArgsMinuteSeconds, extractCallRate, timeStringToMillis } = require("./utils");
const { War } = require("./War");
const guildService = require("./guildService");
const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");

class Guild {

    constructor(id, preJoinTimer, warChannel, callRate, firstCallTimer, warCount, timeZone) {
        this.id = id
        this.preJoinTimer = preJoinTimer;
        this.warChannel = warChannel;
        this.callRate = callRate;
        this.firstCallTimer = firstCallTimer;
        this.warCount = warCount;
        this.timeZone = timeZone;
        console.log(`Guild connected with id ${this.id}!`)
        this.startTimerWarMap = new Map();
        this.activeWar = null;
    }

    incrementWars() {
        this.warCount = this.warCount + 1;
        guildService.save(this);
    }

    decrementWars() {
        this.warCount = this.warCount - 1;
        guildService.save(this);
    }

    getFirstChannelFromName(name) {
        return new Promise((resolve, reject) => {
            global.client.guilds.fetch().then(data => {
                data.get(this.id).fetch().then(guild => {
                    guild.channels.fetch().then(channels => {
                        resolve(channels.filter(channels => channels).find(channel => channel.name == name))
                    })
                })
            })
        })
    }

    handleScheduleWar(interaction) {
        this.getFirstChannelFromName(this.warChannel).then((warChannel) => {
            if (warChannel) {
                if (warChannel.type === ChannelType.GuildVoice) {
                    if (!warChannel.permissionsFor(interaction.guild.members.me).has([
                        PermissionsBitField.Flags.Speak,
                        PermissionsBitField.Flags.Connect
                    ])) {
                        interaction.reply(`Missing permissions to speak and/or join in ${this.warChannel}`)
                        return;
                    }
                    this.scheduleWar(interaction, interaction.options.data[0].value);
                } else {
                    interaction.reply("Channel " + this.warChannel + " is not a voice channel")
                }

            } else {
                interaction.reply("No existing Channel " + this.warChannel)
            }
        });

    }

    handleStartWar(interaction) {
        this.getFirstChannelFromName(this.warChannel).then((warChannel) => {
            if (warChannel) {
                if (warChannel.type === ChannelType.GuildVoice) {
                    if (!warChannel.permissionsFor(interaction.guild.members.me).has([
                        PermissionsBitField.Flags.Speak,
                        PermissionsBitField.Flags.Connect
                    ])) {
                        interaction.reply(`Missing permissions to speak and/or join in ${this.warChannel}`)
                        return;
                    }
                    this.startWar(interaction, interaction.options.data[0].value);
                } else {
                    interaction.reply("Channel " + this.warChannel + " is not a voice channel")
                }

            } else {
                interaction.reply("No existing Channel " + this.warChannel)
            }
        });

    }

    startWar(msg, time) {
        const timeArgs = time.split(":");
        if (!validateTimeArgsMinuteSeconds(timeArgs)) {
            msg.reply(time + " is not a valid time. Type /help for a list of commands")
            return;
        }
        const current = new Date()
        const warStartMillis = new Date(current.getFullYear(), current.getMonth(), current.getDate(), current.getHours(), current.getMinutes() + parseInt(timeArgs[0]), current.getSeconds() + parseInt(timeArgs[1])).getTime();
        if (this.checkForCollidingTimers(warStartMillis)) {
            msg.reply(time + " collides with a different war. !leaveWar the current war or use /list and /unschedule-war unwanted wars.")
            return;
        }
        const war = new War(this, msg, warStartMillis, this.startCallback, this.leaveCallback);
        this.startTimerWarMap.set(warStartMillis - this.timeZone, war);
        this.incrementWars();
        msg.reply("The war starts in " + time + "(mm:ss)")
    }

    scheduleWar(msg, time) {
        const warStartMillis = timeStringToMillis(time) - this.timeZone;
        if (!warStartMillis) {
            msg.reply(`${time} is not a valid time.`)
            return;
        }
        if (this.checkForCollidingTimers(warStartMillis)) {
            msg.reply(time + " collides with a different war. /leaveWar the curent war or use /list and /unschedule-war unwanted wars.")
            return;
        }
        const war = new War(this, msg, warStartMillis, this.startCallback, this.leaveCallback);
        this.startTimerWarMap.set(warStartMillis, war);
        this.incrementWars();
        msg.reply("The war has been scheduled for " + time)
    }

    checkForCollidingTimers(warStartMillis) {
        const collidingTimers = [...this.startTimerWarMap.keys()].filter(time => Math.abs(time - warStartMillis) < 1000 * 60 * 30 + this.preJoinTimer * 1000).length != 0
        const currentWarColliding = this.activeWar ? Math.abs(this.activeWar.warStart - warStartMillis) < 1000 * 60 * 30 + this.preJoinTimer * 1000 : false;
        return collidingTimers || currentWarColliding;
    }

    startCallback = (war) => {
        this.startTimerWarMap.delete(war.warStart);
        this.activeWar = war;
    }

    handleLeave(interaction) {
        if (this.activeWar) {
            interaction.reply("Leaving war channel");
            this.activeWar.leaveWar();
        } else {
            interaction.reply("No active war");
        }
    }

    leaveCallback = () => {
        this.activeWar = undefined;
    }

    handleHelp(msg) {
        help.handleHelp(msg);
    }

    handleUnscheduleWar(interaction) {
        const time = interaction.options.data[0].value;
        const timeStringToTimestamp = new Map();
        Array.from(this.startTimerWarMap.keys()).forEach(timer => {
            timeStringToTimestamp.set(millisToCETString(timer + this.timeZone), timer);
        });
        if (!timeStringToTimestamp.has(time)) {
            interaction.reply("There's no war scheduled for " + time);
            return;
        }
        const warStartMillis = timeStringToTimestamp.get(time);
        const war = this.startTimerWarMap.get(warStartMillis);
        war.unschedule();
        this.decrementWars();
        this.startTimerWarMap.delete(warStartMillis);
        interaction.reply("War has been successfully unscheduled!");

    }

    handleList(interaction) {
        let res = Array.from(this.startTimerWarMap.keys());
        res = res.map(time => millisToCETString(time + this.timeZone));
        interaction.reply("Current scheduled Wars: " + (res.length ? res.join(", ") : "none"));
    }

    handleGetSettings(interaction) {
        this.getFirstChannelFromName(this.warChannel).then(warChannel => {
            const embed = new EmbedBuilder()
                .setDescription(
                    "All current settings"
                ).setTitle("Settings")
                .setColor(0xAAAAFF)
                .addFields([
                    {
                        name: `\`War Channel\``,
                        value: warChannel ? `<#${warChannel.id}>` : this.warChannel,
                    },
                    {
                        name: `\`Pre Join Timer in seconds\``,
                        value: `${this.preJoinTimer}`,
                    },
                    {
                        name: `\`First Call Timer in seconds\``,
                        value: `${this.firstCallTimer}`,
                    },
                    {
                        name: `\`Call Rate in seconds\``,
                        value: this.callRate.join(", "),
                    },
                    {
                        name: `\`Timezone\``,
                        value: `Time matching your local time ${millisToCETString(new Date().getTime() + this.timeZone)}`,
                    }
                ])
            interaction.reply({ embeds: [embed] })
        });
    }

    setWarChannel(interaction) {
        this.warChannel = interaction.options.data[0].channel.name;
        guildService.save(this);
        interaction.reply(`War Channel has been changed to ${this.warChannel}`);
    }

    setPreJoinTimer(interaction) {
        this.preJoinTimer = interaction.options.data[0].value;
        guildService.save(this);
        interaction.reply(`Pre Join Timer has been changed to ${this.preJoinTimer} seconds`);
    }

    setFirstCallTimer(interaction) {
        this.firstCallTimer = interaction.options.data[0].value;
        guildService.save(this);
        interaction.reply(`First Call Timer has been changed to ${this.firstCallTimer} seconds`);
    }

    setCallRate(interaction) {
        const input = interaction.options.data[0].value;
        const nums = extractCallRate(input)
        if (!nums) {
            interaction.reply(input + " contains non numbers or is in the wrong format. Type /help for a list of commands")
            return;
        }
        this.callRate = nums.sort((a, b) => a - b).reverse();
        guildService.save(this)
        interaction.reply("Call Rate has been changed to " + nums.join(", "));
    }

    setTimezone(interaction) {
        const time = interaction.options.data[0].value;
        if (this.startTimerWarMap.size) {
            interaction.reply("Can't change timezone while scheduling wars. Use /list and /unschedule-war all listed wars.")
            return;
        }
        const millis = timeStringToMillis(time);
        if (!millis) {
            interaction.reply(`${time} is not a valid time`)
            return;
        }
        const strippedDate = new Date();
        strippedDate.setSeconds(0);
        strippedDate.setMilliseconds(0);
        this.timeZone = millis - strippedDate.getTime();
        guildService.save(this);
        interaction.reply(`Timezone has been set to match the current time of ${time}.`)
    }

    handleStats(msg) {
        msg.reply(`Total wars with my assistance: ${this.warCount}`)
    }

    interact(interaction) {
        if (!interaction.channel.permissionsFor(interaction.guild.members.me).has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageMessages
        ])) {
            return;
        }
        const args = interaction.values[0].split("_");
        switch (args[0]) {
            case "scheduling":
                help.helpScheduling(interaction);
                break;
            case "settings":
                help.helpSettings(interaction, settingsDescriptorMap.get(args[1]));
                break;
            case "other":
                help.helpOther(interaction);
                break;
        }
    }
}

function buildSettingsDescriptorMap() {
    const resultMap = new Map();
    [
        {
            name: "war-channel",
            value: "war channel",
            description: "Name of the voice channel the bot should join for war."
        },
        {
            name: "pre-join-timer",
            value: "300",
            description: "Time in seconds before the bot should join the war channel."
        },
        {
            name: "first-call-timer",
            value: "600",
            description: "Time in seconds after the bot starts calling waves in war (to reduce spam for frequent early respawn waves)."
        },
        {
            name: "call-rate",
            value: "5 10 15",
            description: "List of seconds before the bot calls for respawn waves."
        },
        {
            name: "timezone",
            value: "19:30",
            description: "Set the bots time calcluations to match the current time. Either put in your local time or the time of the server you are playing on."
        },
    ].forEach(element => resultMap.set(element.name, element));
    return resultMap;
}

const settingsDescriptorMap = buildSettingsDescriptorMap();

exports.Guild = Guild