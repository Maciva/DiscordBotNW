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
                        "value": `Command for scheduling wars.`
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
                        "name": `startWar`,
                        "value": `Command for starting a war after a given delay.`
                    },
                    {
                        "name": `Usage:`,
                        "value": `!startWar [MM:SS]`,
                        "inline": true
                    },
                    {
                        "name": `Example:`,
                        "value": `!startWar 05:30`,
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
                        "name": `stats`,
                        "value": `Command for listing stats.`
                    },
                    {
                        "name": `Usage:`,
                        "value": `!stats`,
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
                        "value": `channel which the bot listens to. \n **Example:** !settings set channelName "Channel name" `
                    },
                    {
                        "name": `warChanel:`,
                        "value": `channel which the bot will join and speak in. \n **Example:** !settings set warChannel "War channel" `
                    },
                    {
                        "name": `preJoinTimer:`,
                        "value": `Time before the warbot joins the Warchannel (in seconds). \n **Example:** !settings set preJoinTimer 300`
                    },
                    {
                        "name": `firstCallTimer:`,
                        "value": `Time before the warbot starts calling waves (in seconds). \n **Example:** !settings set firstCallTimer 600`
                    },
                    {
                        "name": `callRate`,
                        "value": `The bot will be sending a reminder in the voice Channel before given seconds. \n **Example:** !settings set callRate "15 10 5"`
                    },
                ]
            }
        ]
    })
}

exports.handleHelp = handleHelp;