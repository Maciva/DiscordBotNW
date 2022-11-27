const { createAudioResource, joinVoiceChannel, AudioPlayerStatus, createAudioPlayer, getVoiceConnection } = require('@discordjs/voice');
const path = require('path');
const sounds = require('./sounds');
const { getRandomJoinFile, getRandomLeaveFile } = require('./utils');
const respawns = require(path.join("..", 'config', 'respawns.json'));

class War {


    constructor(guild, msg, warStart, startCallback, leaveCallback) {
        this.guild = guild;
        this.msg = msg;
        this.warStart = warStart;
        this.timeouts = new Set()
        this.timeoutId = null;
        this.leaveCallback = leaveCallback;
        this.startCallback = startCallback;
        this.player = createAudioPlayer();
        this.scheduleWar();
    }


    scheduleWar() {
        const joinTimer = this.warStart - this.guild.preJoinTimer * 1000;
        let id = this.setTimeoutWrapper(() => {
            this.startCallback(this);
            this.joinWarChannel(this.msg);
            this.scheduleTimers(this.warStart, this.msg);
        }, joinTimer - new Date().getTime(), true)
        this.timeoutId = id;
    }

    unschedule() {
        clearTimeout(this.timeoutId);
    }

    leaveWar() {
        this.clearTimeouts();
        this.playFile(getRandomLeaveFile());
        var con = getVoiceConnection(this.guild.id);
        this.player.once(AudioPlayerStatus.Idle, () => {
            this.player.stop();
            con.destroy();
            this.leaveCallback();
        })
    }

    playFile(file) {
        const resource = createAudioResource(file);
        if (this.player) {
            this.player.play(resource)
        }
    }

    scheduleTimers() {
        const filteredRespawns = respawns.timers.filter(timer => timer >= this.guild.firstCallTimer);
        for (let i = 0; i < filteredRespawns.length; i++) {
            let previous = i ? filteredRespawns[i - 1] : null
            this.scheduleTimerForWave(previous, filteredRespawns[i], this.warStart, i === filteredRespawns.length - 1);
        }
        this.setTimeoutWrapper(() => {
            this.leaveWar();
        }, (30 * 60 + parseInt(this.guild.preJoinTimer) + 10) * 1000, true)
    }

    joinWarChannel() {
        this.getFirstChannelFromName(this.guild.warChannel).then(warChannel => {
            if (!warChannel) {
                this.guild.getFirstChannelFromName(this.guild.channelName).then(channel => {
                    channel.send(`Something went wrong joining the war channel. Couldn't find warChannel with name ${this.guild.warChannel}`)
                });
                return;
            }
            var con = joinVoiceChannel({
                channelId: warChannel.id,
                guildId: this.msg.guild.id,
                adapterCreator: this.msg.guild.voiceAdapterCreator,
                selfMute: false,
                selfDeaf: false
            })
                con.subscribe(this.player)
                this.playFile(getRandomJoinFile())
        });
    }

    getFirstChannelFromName(name) {
        return new Promise((resolve, reject) => {
            global.client.guilds.fetch().then(data => {
                data.get(this.guild.id).fetch().then(guild => {
                    guild.channels.fetch().then(channels => {
                        resolve(channels.filter(channel => channel).find(channel => channel.name == name))
                    })
                })
            })
        })

    }

    scheduleTimerForWave(previousTimer, currentTimer, warStartMillis, last) {
        if (previousTimer) {
            let diff = currentTimer - previousTimer
            let flooredDiff = diff - diff % 5 - 5;
            let filteredCallTimers = this.guild.callRate.filter(callTimer => callTimer < flooredDiff);
            [flooredDiff, ...filteredCallTimers]
                .forEach(timer => this.scheduleCallTimer(timer, currentTimer, warStartMillis))
        } else {
            this.guild.callRate.filter(callTimer => callTimer < currentTimer)
                .forEach(timer => this.scheduleCallTimer(timer, currentTimer, warStartMillis))
        }
        this.scheduleCallTimer(0, currentTimer, warStartMillis, sounds.counterSounds.respawn, last)
    }

    scheduleCallTimer(timer, currentTimer, warStartMillis, optionalFile, last) {
        let file = optionalFile ? optionalFile : sounds.counterSounds[timer]
        const callTimer = warStartMillis + (currentTimer - timer) * 1000;
        const timeFromNow = callTimer - new Date().getTime()
        this.setTimeoutWrapper(() => {
            this.playFile(file);
            if (last) {
                this.player.once(AudioPlayerStatus.Idle, () => {
                    this.playFile(sounds.counterSounds.noRespawn)
                })
            }
        }, timeFromNow, false);

    }

    playFile(file) {
        if(!file) {
            return;
        }
        const resource = createAudioResource(file);
        if (this.player) {
            this.player.play(resource)
        }
    }

    setTimeoutWrapper(f, time, executeIfPast) {
        if (!executeIfPast && time < 0) {
            return;
        }

        const id = setTimeout(() => {
            try {
                f();
                this.timeouts.delete(id)
            } catch (ignore) {
                console.log(ignore)
            }
        }, time);
        this.timeouts.add(id);
        return id;

    }

    clearTimeouts() {
        this.timeouts.forEach(id => clearTimeout(id))
        this.timeouts.clear();
    }

}

exports.War = War;