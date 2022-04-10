const path = require('path');
const properties = require(path.join("..", 'config', 'config.json'));
const fs = require('fs')

function getProperties() {
    return properties
}

function setProperty(key, value) {
    properties[key] = value;
    savePropertiesFile()
}

function savePropertiesFile() {
    fs.writeFile(path.join('config', 'config.json'), JSON.stringify(properties), err => {
        if (err) {
            console.log(err)
        }
    })
}

exports.getProperties = getProperties;
exports.setProperty = setProperty;