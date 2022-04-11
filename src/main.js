const path = require('path');
const {Client, Intents} = require("discord.js");
const {
    getVoiceConnection,
    joinVoiceChannel,
    createAudioPlayer,
    AudioPlayerStatus,
    createAudioResource,
    NoSubscriberBehavior
} = require("@discordjs/voice");
const config = require('./configHandler');
const sounds = require('./sounds');
const fs = require('fs');

const respawns = require(path.join("..", 'config', 'respawns.json'));


const props = config.getProperties()
const intents = new Intents();
intents.add(Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES)
const client = new Client({intents: intents})
const timeouts = new Set();
const timeWarTimeoutIdMap = new Map();
var player;

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
    player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });

})

function handleHelp(msg) {
    msg.reply({
        embeds: [
            {
                "type": "rich",
                "title": `Help`,
                "description": `List of Commands`,
                "color": 0x078f00,
                "fields": [
                    {
                        "name": `scheduleWar`,
                        "value": `Command for scheduling wars. The bot will automatically join a defined voice channel \nand call respawn timers`
                    },
                    {
                        "name": `Usage:`,
                        "value": `!scheduleWar [TIME (CET)]`,
                        "inline": true
                    },
                    {
                        "name": `Example:`,
                        "value": `!scheduleWar 20:30`,
                        "inline": true
                    },
                    {
                        "name": `unscheduleWar`,
                        "value": `Command for unscheduling wars.`
                    },
                    {
                        "name": `Usage:`,
                        "value": `!unscheduleWar [TIME (CET)]`,
                        "inline": true
                    },
                    {
                        "name": `Example:`,
                        "value": `!unscheduleWar 20:30`,
                        "inline": true
                    },
                    {
                        "name": `list`,
                        "value": `Command for listing scheduled wars.`
                    },
                    {
                        "name": `Usage:`,
                        "value": `!list`,
                        "inline": true
                    },
                    {
                        "name": `leaveWar`,
                        "value": `Command to make the bot leave the war channel and stop its timer`
                    },
                    {
                        "name": `Usage:`,
                        "value": `!leaveWar`,
                        "inline": true
                    },
                    {
                        "name": `Settings:`,
                        "value": `commands for reading and writing configurations for the bot.\n**Arguments containing whitespaces must be wrapped in double qoutes**`
                    },
                    {
                        "name": `Usage get:`,
                        "value": `!settings get [value]`,
                        "inline": true
                    },
                    {
                        "name": `Values:`,
                        "value": "\u200B"
                    },
                    {
                        "name": `channelName:`,
                        "value": `channel which the bot listens to`
                    },
                    {
                        "name": `Usage set:`,
                        "value": `!settings set channelName [NAME] `,
                        "inline": true
                    },
                    {
                        "name": `Example set:`,
                        "value": `!settings set channelName \"war channel 1\"`,
                        "inline": true
                    },
                    {
                        "name": `warChanel:`,
                        "value": `channel which the bot will join and speak in`
                    },
                    {
                        "name": `Usage set:`,
                        "value": `!settings set warChannel [NAME]`,
                        "inline": true
                    },
                    {
                        "name": `Example set:`,
                        "value": `!settings set warChannel \"war channel 1\"`,
                        "inline": true
                    },
                    {
                        "name": `preJoinTimer:`,
                        "value": `Time before the warbot joins the Warchannel (in seconds)`
                    },
                    {
                        "name": `Usage set:`,
                        "value": `!settings set preJoinTimer [SECONDS]`,
                        "inline": true
                    },
                    {
                        "name": `Example set:`,
                        "value": `!settings set preJoinTimer 300`,
                        "inline": true
                    },
                    {
                        "name": `callRate`,
                        "value": `The bot will be sending a reminder in the voice Channel before given seconds.`
                    },
                    {
                        "name": `Usage set:`,
                        "value": `!settings set callRate \"[LIST OF SECONDS]\"`,
                        "inline": true
                    },
                    {
                        "name": `Example set:`,
                        "value": `!settings set callRate [\"5 10 15\"]\nThe Bot will speak 5, 10 and 15 seconds before the next respawn wave`,
                        "inline": true
                    }
                ]
            }
        ]
    })
}

function handleRemoveSchedule(msg, args) {
    if (args.length !== 1) {
        msg.reply("Illegal number of argument. Type !help for a list of commands")
        return;
    }
    if (!timeWarTimeoutIdMap.has(args[0])) {
        msg.reply("There's no war scheduled for " + args[0]);
    }
    clearTimeouts(timeWarTimeoutIdMap.get(args[0]));
    timeWarTimeoutIdMap.delete(args[0]);
    msg.reply("War has been successfully unscheduled!");
}

function handleList(msg) {
    const res = Array.from(timeWarTimeoutIdMap.keys());
    msg.reply("Current scheduled Wars: " + (res.length ? res.join(", ") : "none"));
}

client.on("message", msg => {
    if (msg.channel.name === props.channelName) {
        if (msg.content.startsWith(props.prefix)) {
            const args = splitArgs(msg.content)
            switch (args[0].substr(1)) {
                case "scheduleWar":
                    handleScheduleWar(msg, args.slice(1));
                    break;
                case "leaveWar":
                    handleLeave(msg);
                    break;
                case "settings":
                    handleSettings(msg, args.slice(1));
                    break;
                case "help":
                    handleHelp(msg);
                    break;
                case "unscheduleWar":
                    handleRemoveSchedule(msg, args.slice(1));
                    break;
                case "list":
                    handleList(msg);
                    break;
            }
        }
    }
})

function splitArgs(string) {
    return string.match(/\\?.|^$/g).reduce((p, c) => {
        if (c === '"') {
            p.quote ^= 1;
        } else if (!p.quote && c === ' ') {
            p.a.push('');
        } else {
            p.a[p.a.length - 1] += c.replace(/\\(.)/, "$1");
        }
        return p;
    }, {a: ['']}).a
}

function getRandomJoinFile() {
    var files = fs.readdirSync(path.join("files", "join"));
    return path.join('files', 'join', files[getRandomInt(files.length)])
}

function getRandomLeaveFile() {
    var files = fs.readdirSync(path.join("files", "leave"));
    return path.join('files', 'leave', files[getRandomInt(files.length)])
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function scheduleTimerForWave(previousTimer, currentTimer, warStartMillis, last) {
    if (previousTimer) {
        let diff = currentTimer - previousTimer
        let flooredDiff = diff - diff % 5 - 5;
        let filteredCallTimers = props.callRate.filter(callTimer => callTimer < flooredDiff);
        [flooredDiff, ...filteredCallTimers]
            .forEach(timer => scheduleCallTimer(timer, currentTimer, warStartMillis))
    } else {
        props.callRate.filter(callTimer => callTimer < currentTimer)
            .forEach(timer => scheduleCallTimer(timer, currentTimer, warStartMillis))
    }
    scheduleCallTimer(0, currentTimer, warStartMillis, sounds.counterSounds.respawn, last)
}

function scheduleCallTimer(timer, currentTimer, warStartMillis, optionalFile, last) {
    let file = optionalFile ? optionalFile : sounds.counterSounds[timer]
    const callTimer = warStartMillis + (currentTimer - timer) * 1000;
    const timeFromNow = callTimer - new Date().getTime()
    setTimeoutWrapper(() => {
        playFile(file);
        if (last) {
            player.once(AudioPlayerStatus.Idle, () => {
                playFile(sounds.counterSounds.noRespawn)
            })
        }
    }, timeFromNow, false);


}

function setTimeoutWrapper(f, time, executeIfPast) {
    if (!executeIfPast && time < 0) {
        return;
    }

    const id = setTimeout(() => {
        f();
        timeouts.delete(id)
    }, time);
    timeouts.add(id);
    return id;
}

function playFile(file) {
    const resource = createAudioResource(file);
    if (player) {
        player.play(resource)
    }
}

function scheduleTimers(warStartMillis, msg) {
    for (let i = 0; i < respawns.timers.length; i++) {
        let previous = i ? respawns.timers[i - 1] : null
        scheduleTimerForWave(previous, respawns.timers[i], warStartMillis, i === respawns.timers.length - 1);
    }
    setTimeoutWrapper(() => {
        handleLeave(msg);
    }, (30 * 60 + parseInt(props.preJoinTimer) + 10) * 1000, true)
}

function scheduleWar(msg, args) {
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
    const joinTimer = warStartMillis - props.preJoinTimer * 1000;
    let id = setTimeoutWrapper(() => {
        joinWarChannel(msg);
        clearTimeouts(id);
        timeWarTimeoutIdMap.delete(args[0]);
        scheduleTimers(warStartMillis, msg);
    }, joinTimer - new Date().getTime(), true)
    timeWarTimeoutIdMap.set(args[0], id);
    return true;
}

function validateTimeArgs(timeArgs) {
    if (timeArgs.length !== 2) {
        return false;
    }
    try {
        const h = parseInt(timeArgs[0])
        const m = parseInt(timeArgs[1])
        return h <= 24 && h >= 0 && m <= 60 && m >= 0;
    } catch (err) {
        return false;
    }
}

function joinWarChannel(msg) {
    let warChannel = getFirstChannelFromName(props.warChannel);
    var con = joinVoiceChannel({
        channelId: warChannel.id,
        guildId: msg.guild.id,
        adapterCreator: msg.guild.voiceAdapterCreator,
        selfMute: false,
        selfDeaf: false
    })
    con.subscribe(player)
    playFile(getRandomJoinFile())
}

function handleScheduleWar(msg, args) {
    let warChannel = getFirstChannelFromName(props.warChannel);
    if (warChannel) {
        if (warChannel.type === 'GUILD_VOICE') {
            const scheduled = scheduleWar(msg, args);
            if (scheduled) {
                msg.reply("The war has been scheduled for " + args[0])
            }
        } else {
            msg.reply("Channel " + props.warChannel + " is not a voice channel")
        }

    } else {
        msg.reply("No existing Channel " + props.warChannel)
    }
}

function handleSettings(msg, args) {
    switch (args[0]) {
        case 'get':
            handleSettingsGet(msg, args.slice(1));
            break;
        case 'set':
            handleSettingsSet(msg, args.slice(1));
            break;
        default:
            msg.reply(args[0] + " is not a valid argument. Type !help for a list of commands")
    }
}

function handleSettingsGet(msg, args) {
    switch (args[0]) {
        case 'channelName':
            msg.reply("Current Channel Name to read commands from: " + props.channelName);
            break;
        case 'warChannel':
            msg.reply("Current War Channel: " + props.warChannel)
            break;
        case 'preJoinTimer':
            msg.reply("Current pre join timer (in Seconds): " + props.preJoinTimer);
            break;
        case 'callRate':
            msg.reply("Current call rates: " + props.callRate.join(", "));
            break;
        default:
            msg.reply(args[0] + " is not a valid argument. Type !help for a list of commands");
    }
}

function handleSettingsSet(msg, args) {
    if (args.length !== 2) {
        msg.reply("Illegal number of Arguments. Make sure to put arguments including whitespaces in qoutes. I.E: !settings set warChannel \"War 1\"");
        return;
    }
    switch (args[0]) {
        case 'channelName': {
            config.setProperty(args[0], args[1]);
            msg.reply("Channel Name has been changed to " + args[1]);
            break;
        }
        case 'warChannel': {
            config.setProperty(args[0], args[1]);
            msg.reply("warChannel has been changed to " + args[1]);
            break;
        }
        case 'preJoinTimer': {
            if (isInt(args[1])) {
                config.setProperty(args[0], args[1]);
                msg.reply("preJoinTimer (in Seconds) has been changed to " + args[1]);
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
            config.setProperty(args[0], nums.sort((a, b) => a - b).reverse())
            msg.reply("callRate has been changed to " + nums.join(", "));
            break;
        }
        default:
            msg.reply(args[0] + " is not a valid argument. Type !help for a list of commands")
    }
}

function extractCallRate(arg) {
    try {
        return arg.split(" ").map(element => parseInt(element));
    } catch (err) {

    }
    return undefined;
}

function isInt(input) {
    try {
        parseInt(input);
        return true;
    } catch (err) {
        return false;
    }
}

function clearTimeouts() {
    timeouts.forEach(id => clearTimeout(id))
    timeouts.clear();
}

function handleLeave(msg) {
    var con = getVoiceConnection(msg.guild.id);
    clearTimeouts();
    if (con) {
        playFile(getRandomLeaveFile())
        player.once(AudioPlayerStatus.Idle, () => con.destroy())
    }
}


function getFirstChannelFromName(name) {
    return Array.from(client.channels.cache.values()).find(channel => channel.name === name)
}

client.login(props.token)