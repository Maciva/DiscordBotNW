const persistance = require('./persistance')
const { Guild } = require('./Guild')

const defaultServer = {
    "preJoinTimer": 300,
    "warChannel": "war-channel",
    "callRate": [15, 10, 5],
    "firstCallTimer": 600,
    "warCount": 0,
    "timeZone": 0
}

function createDefault(id) {
    server = { ...defaultServer }
    server["id"] = id
    return new Promise((resolve, reject) => {
        persistance.create(server).then((data, err) => {
            if (err) {
                reject(err);
                return;
            }
            const tmp = new Guild(data.id, data.preJoinTimer, data.warChannel, data.callRate, data.warCount, data.timeZone)
            resolve(tmp);
        })
    })
}

function deleteServer(id) {
    persistance.deleteServer(id);
}

function save(guild) {
    const obj = {
        "id": guild.id,
        "preJoinTimer": guild.preJoinTimer,
        "warChannel": guild.warChannel,
        "callRate": guild.callRate,
        "firstCallTimer": guild.firstCallTimer,
        "warCount": guild.warCount,
        "timeZone": guild.timeZone
    }
    return persistance.save(obj);
}

const idToServerMap = new Map();

function get(id) {
    return new Promise((resolve, reject) => {
        persistance.find(id).then((data, err) => {
            if (err) {
                reject(err);
            } else {
                if (!data) {
                    resolve(data);
                    return;
                }
                const tmp = new Guild(data.id, data.preJoinTimer, data.warChannel, data.callRate, data.firstCallTimer, data.warCount, data.timeZone)
                resolve(tmp);
            }
        })
    })
}



function getOrCreate(id) {
    return new Promise(resolve => {
        if (!idToServerMap.has(id)) {
            get(id).then(resultGuild => {
                if (resultGuild) {
                    idToServerMap.set(id, resultGuild)
                    resolve(idToServerMap.get(id));
                } else {
                    createDefault(id).then((resultDefault) => {
                        idToServerMap.set(id, resultDefault);
                        resolve(idToServerMap.get(id));
                    })
                }
            })
        } else {
            resolve(idToServerMap.get(id));
        }
    })

}

function interact(id, interaction) {
    if (!idToServerMap.has(id)) {
        get(id).then(resultGuild => {
            if (resultGuild) {
                idToServerMap.set(id, resultGuild)
                idToServerMap.get(id).interact(interaction);
            } else {
                createDefault(id).then((resultDefault) => {
                    idToServerMap.set(id, resultDefault);
                    idToServerMap.get(id).interact(interaction);
                })
            }
        })
    } else {
        idToServerMap.get(id).interact(interaction);
    }

}

exports.createDefault = createDefault;
exports.get = get;
exports.getOrCreate = getOrCreate;
exports.interact = interact;
exports.deleteServer = deleteServer;
exports.save = save;