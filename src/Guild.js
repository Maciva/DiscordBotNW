const { createAudioPlayer, NoSubscriberBehavior, getVoiceConnection, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const help = require("./help");
const { splitArgs, validateTimeArgs, getRandomLeaveFile, millisToCETString } = require("./utils");
const { War } = require("./War");

class Guild {

    constructor(id, preJoinTimer, channelName, warChannel, callRate, firstCallTimer) {
        this.id = id
        this.preJoinTimer = preJoinTimer;
        this.channelName = channelName;
        this.warChannel = warChannel;
        this.callRate = callRate;
        this.firstCallTimer = firstCallTimer;
        console.log(`Guild connected with id ${this.id}!`)
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });
        this.startTimerWarMap = new Map();
        this.activeWar = null;
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
                } else {
                    msg.reply("Channel " + this.warChannel + " is not a voice channel")
                }
    
            } else {
                msg.reply("No existing Channel " + this.warChannel)
            }
        });
        
    }

    scheduleWar(msg, args) {
        if (args.length !== 1) {
            msg.reply("Illegal number of arguments for war scheduling. Required: 1, Received: " + args.length + ". Type !help for a list of commands");
            return;
        }
        const timeArgs = args[0].split(":");
        if (!validateTimeArgs(timeArgs)) {
            msg.reply(args[0] + " is not a valid time. Type !help for a list of commands")
            return;
        }
        const current = new Date()
        const warStartMillis = new Date(current.getFullYear(), current.getMonth(), current.getDate(), timeArgs[0], timeArgs[1], 0).getTime();
        const collidingTimers = [...this.startTimerWarMap.keys()].filter(time => Math.abs(warStartMillis - warStartMillis) < 1000 * 60 * 30 + this.preJoinTimer * 1000 ).length != 0
        if(collidingTimers) {
            msg.reply(args[0] + " collides with a different war. Use !list and !unscheduleWar unwanted wars.")
            return;
        }
        const war = new War(this, msg, warStartMillis, this.startCallback, this.leaveCallback);
        this.startTimerWarMap.set(warStartMillis, war);
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
        const timeArgs = args[0].split(":");
        const current = new Date()
        const warStartMillis = new Date(current.getFullYear(), current.getMonth(), current.getDate(), timeArgs[0], timeArgs[1], 0).getTime();
        if (!this.startTimerWarMap.has(warStartMillis)) {
            msg.reply("There's no war scheduled for " + args[0]);
            return;
        }
        const war = this.startTimerWarMap.get(warStartMillis);
        war.unschedule();
        this.startTimerWarMap.delete(warStartMillis);
        msg.reply("War has been successfully unscheduled!");

    }

    handleList(msg) {
        let res = Array.from(this.startTimerWarMap.keys());
        res = res.map(millisToCETString);
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
                msg.reply("Current call rates: " + this.firstCallTimer);
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
                    msg.reply(args[1] + " contains non numbers. Type !help for a list of commands")
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

    dispatch(msg) {
        if (msg.channel.name === this.channelName) {
            if (msg.content.startsWith("!")) {
                const args = splitArgs(msg.content)
                switch (args[0].substr(1)) {
                    case "scheduleWar":
                        this.handleScheduleWar(msg, args.slice(1));
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
                    default:
                        msg.reply("Invalid command. Type !help.")
    
                }
            }
        }
    }

}

exports.Guild = Guild