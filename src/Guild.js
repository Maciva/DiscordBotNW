const { createAudioPlayer, NoSubscriberBehavior, getVoiceConnection, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const help = require("./help");
const { splitArgs, validateTimeArgs, getRandomLeaveFile, millisToCETString, validateTimeArgsMinuteSeconds, isInt, extractCallRate, timeStringToMillis } = require("./utils");
const { War } = require("./War");
const guildService = require("./guildService");
const { Permissions } = require("discord.js");

class Guild {

    constructor(id, preJoinTimer, channelName, warChannel, callRate, firstCallTimer, warCount, timeZone) {
        this.id = id
        this.preJoinTimer = preJoinTimer;
        this.channelName = channelName;
        this.warChannel = warChannel;
        this.callRate = callRate;
        this.firstCallTimer = firstCallTimer;
        this.warCount = warCount;
        this.timeZone = timeZone;
        console.log(`Guild connected with id ${this.id}!`)
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });
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
                        resolve(channels.find(channel => channel.name == name))
                    })
                })
            })
        })
    }

    handleScheduleWar(msg, args) {
        this.getFirstChannelFromName(this.warChannel).then((warChannel) => {
            if (warChannel) {
                if (warChannel.type === 'GUILD_VOICE') {
                    this.scheduleWar(msg, args);
                    if(warChannel.permissionsFor(msg.guild.me).has([
                        Permissions.FLAGS.SPEAK,
                        Permissions.FLAGS.CONNECT,
                    ])) {
                        msg.reply(`Missing permissions to speak and/or join in ${this.warChannel}`)
                        return;
                    }
                } else {
                    msg.reply("Channel " + this.warChannel + " is not a voice channel")
                }

            } else {
                msg.reply("No existing Channel " + this.warChannel)
            }
        });

    }

    handleStartWar(msg, args) {
        this.getFirstChannelFromName(this.warChannel).then((warChannel) => {
            if (warChannel) {
                if (warChannel.type === 'GUILD_VOICE') {
                    this.startWar(msg, args);
                } else {
                    msg.reply("Channel " + this.warChannel + " is not a voice channel")
                }

            } else {
                msg.reply("No existing Channel " + this.warChannel)
            }
        });

    }

    startWar(msg, args) {
        if (args.length !== 1) {
            msg.reply("Illegal number of arguments for war scheduling. Required: 1, Received: " + args.length + ". Type !help for a list of commands");
            return;
        }
        const timeArgs = args[0].split(":");
        if (!validateTimeArgsMinuteSeconds(timeArgs)) {
            msg.reply(args[0] + " is not a valid time. Type !help for a list of commands")
            return;
        }
        const current = new Date()
        const warStartMillis = new Date(current.getFullYear(), current.getMonth(), current.getDate(), current.getHours(), current.getMinutes() + parseInt(timeArgs[0]), current.getSeconds() + parseInt(timeArgs[1])).getTime();
        const collidingTimers = [...this.startTimerWarMap.keys()].filter(time => Math.abs(time - warStartMillis) < 1000 * 60 * 30 + this.preJoinTimer * 1000).length != 0
        if (collidingTimers) {
            msg.reply(args[0] + " collides with a different war. Use !list and !unscheduleWar unwanted wars.")
            return;
        }
        const war = new War(this, msg, warStartMillis, this.startCallback, this.leaveCallback);
        this.startTimerWarMap.set(warStartMillis - this.timeZone, war);
        this.incrementWars();
        msg.reply("The war starts in " + args[0] + "(mm:ss)")
    }

    scheduleWar(msg, args) {
        if (args.length !== 1) {
            msg.reply("Illegal number of arguments for war scheduling. Required: 1, Received: " + args.length + ". Type !help for a list of commands");
            return;
        }
        const warStartMillis = timeStringToMillis(args[0]) - this.timeZone;
        if (!warStartMillis) {
            msg.reply(`${args[0]} is not a valid time.`)
        }
        const collidingTimers = [...this.startTimerWarMap.keys()].filter(time => Math.abs(time - warStartMillis) < 1000 * 60 * 30 + this.preJoinTimer * 1000).length != 0
        if (collidingTimers) {
            msg.reply(args[0] + " collides with a different war. Use !list and !unscheduleWar unwanted wars.")
            return;
        }
        const war = new War(this, msg, warStartMillis, this.startCallback, this.leaveCallback);
        this.startTimerWarMap.set(warStartMillis, war);
        this.incrementWars();
        msg.reply("The war has been scheduled for " + args[0])
    }

    startCallback = (war) => {
        this.startTimerWarMap.delete(war.warStart);
        this.activeWar = war;
    }

    handleLeave() {
        this.activeWar?.leaveWar();
    }

    leaveCallback = () => {
        this.activeWar = null;
        var con = getVoiceConnection(this.id);
        if (con) {
            this.playFile(getRandomLeaveFile())
            this.player.once(AudioPlayerStatus.Idle, () => con.destroy())
        }
    }

    playFile(file) {
        const resource = createAudioResource(file);
        if (this.player) {
            this.player.play(resource)
        }
    }

    handleSettings(msg, args) {
        switch (args[0]) {
            case 'get':
                this.handleSettingsGet(msg, args.slice(1));
                break;
            case 'set':
                this.handleSettingsSet(msg, args.slice(1));
                break;
            default:
                msg.reply(args[0] + " is not a valid argument. Type !help for a list of commands")
        }
    }

    handleHelp(msg) {
        help.handleHelp(msg);
    }

    handleRemoveSchedule(msg, args) {
        if (args.length !== 1) {
            msg.reply("Illegal number of argument. Type !help for a list of commands")
            return;
        }
        const timeStringToTimestamp = new Map();
        Array.from(this.startTimerWarMap.keys()).forEach(timer => {
            timeStringToTimestamp.set(millisToCETString(timer + this.timeZone), timer);
        });
        if (!timeStringToTimestamp.has(args[0])) {
            msg.reply("There's no war scheduled for " + args[0]);
            return;
        }
        const warStartMillis = timeStringToTimestamp.get(args[0]);
        const war = this.startTimerWarMap.get(warStartMillis);
        war.unschedule();
        this.decrementWars();
        this.startTimerWarMap.delete(warStartMillis);
        msg.reply("War has been successfully unscheduled!");

    }

    handleList(msg) {
        let res = Array.from(this.startTimerWarMap.keys());
        res = res.map(time => millisToCETString(time + this.timeZone));
        msg.reply("Current scheduled Wars: " + (res.length ? res.join(", ") : "none"));
    }

    handleSettingsGet(msg, args) {
        switch (args[0]) {
            case 'channelName':
                msg.reply("Current Channel Name to read commands from: " + this.channelName);
                break;
            case 'warChannel':
                msg.reply("Current War Channel: " + this.warChannel)
                break;
            case 'preJoinTimer':
                msg.reply("Current pre join timer (in Seconds): " + this.preJoinTimer);
                break;
            case 'callRate':
                msg.reply("Current call rates: " + this.callRate.join(", "));
                break;
            case 'firstCallTimer':
                msg.reply("Current first call timer: " + this.firstCallTimer);
                break;
            case 'timeZone':
                msg.reply(`Current time: ${millisToCETString(new Date().getTime() + this.timeZone)}`);
                break;
            default:
                msg.reply(args[0] + " is not a valid argument. Type !help for a list of commands");
        }
    }

    handleSettingsSet(msg, args) {
        if (args.length !== 2) {
            msg.reply("Illegal number of Arguments. Make sure to put arguments including whitespaces in qoutes. I.E: !settings set warChannel \"War 1\"");
            return;
        }
        switch (args[0]) {
            case 'channelName': {
                this[args[0]] = args[1];
                guildService.save(this)
                msg.reply("Channel Name has been changed to " + args[1]);
                break;
            }
            case 'warChannel': {
                this[args[0]] = args[1];
                guildService.save(this)
                msg.reply("warChannel has been changed to " + args[1]);
                break;
            }
            case 'preJoinTimer': {
                if (isInt(args[1])) {
                    this[args[0]] = args[1];
                    guildService.save(this)
                    msg.reply("preJoinTimer (in Seconds) has been changed to " + args[1]);
                } else {
                    msg.reply(args[1] + " is not an integer");

                }

                break;
            }
            case 'timeZone': {
                if (this.startTimerWarMap.size) {
                    msg.reply("Can't change time zone while scheduling wars. Use !list and !unscheduleWar all listed wars.")
                    return;
                }
                const millis = timeStringToMillis(args[1]);
                if (!millis) {
                    msg.reply(`${args[1]} is not a valid time`)
                    return;
                }
                const strippedDate = new Date();
                strippedDate.setSeconds(0);
                strippedDate.setMilliseconds(0);
                this.timeZone = millis - strippedDate.getTime();
                guildService.save(this);
                msg.reply(`Timezone has been set to match the current time of ${args[1]}.`)
                break;
            }
            case 'firstCallTimer': {
                if (isInt(args[1])) {
                    this[args[0]] = args[1];
                    guildService.save(this)
                    msg.reply("firstCallTimer (in Seconds) has been changed to " + args[1]);
                } else {
                    msg.reply(args[1] + " is not an integer");

                }

                break;
            }
            case 'callRate': {
                const nums = extractCallRate(args[1])
                if (!nums) {
                    msg.reply(args[1] + " contains non numbers or is in the wrong format. Type !help for a list of commands")
                    return;
                }
                this[args[0]] = nums.sort((a, b) => a - b).reverse();
                guildService.save(this)
                msg.reply("callRate has been changed to " + nums.join(", "));
                break;
            }
            default:
                msg.reply(args[0] + " is not a valid argument. Type !help for a list of commands")
        }
    }

    handleStats(msg) {
        msg.reply(`Total wars with my assistance: ${this.warCount}`)
    }

    dispatch(msg) {
        if (msg.channel.name === this.channelName) {

            if(msg.channel.permissionsFor(msg.guild.me).has([
                    Permissions.FLAGS.SEND_MESSAGES,
                    Permissions.FLAGS.MANAGE_MESSAGES,
                ])) {
                    return;
                }
            if (msg.content.startsWith("!")) {
                const args = splitArgs(msg.content)
                switch (args[0].substr(1)) {
                    case "scheduleWar":
                        this.handleScheduleWar(msg, args.slice(1));
                        break;
                    case "startWar":
                        this.handleStartWar(msg, args.slice(1));
                        break;
                    case "leaveWar":
                        this.handleLeave();
                        break;
                    case "settings":
                        this.handleSettings(msg, args.slice(1));
                        break;
                    case "help":
                        this.handleHelp(msg);
                        break;
                    case "unscheduleWar":
                        this.handleRemoveSchedule(msg, args.slice(1));
                        break;
                    case "list":
                        this.handleList(msg);
                        break;
                    case "stats":
                        this.handleStats(msg);
                        break;
                    default:
                        msg.reply("Invalid command. Type !help.")

                }
            }
        }
    }

    interact(interaction) {
        if (interaction.channel.name !== this.channelName) return;
        if(msg.channel.permissionsFor(msg.guild.me).has([
            Permissions.FLAGS.SEND_MESSAGES,
            Permissions.FLAGS.MANAGE_MESSAGES,
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
            name: "channelName",
            value: "\"war bot\"",
            description: "Name of the channel the bot should listen for commands on."
        },
        {
            name: "warChannel",
            value: "\"war channel\"",
            description: "Name of the voice channel the bot should join for war."
        },
        {
            name: "preJoinTimer",
            value: "300",
            description: "Time in seconds before the bot should join the war channel."
        },
        {
            name: "firstCallTimer",
            value: "600",
            description: "Time in seconds after the bot starts calling waves in war (to reduce spam for frequent early respawn waves)."
        },
        {
            name: "callRate",
            value: "\"5 10 15\"",
            description: "List of seconds before the bot calls for respawn waves."
        },
        {
            name: "timeZone",
            value: "19:30",
            description: "Set the bots time calcluations to match the current time. Either put in your local time or the time of the server you are playing on."
        },
    ].forEach(element => resultMap.set(element.name, element));
    return resultMap;
}

const settingsDescriptorMap = buildSettingsDescriptorMap();

exports.Guild = Guild