const path = require('path');
const fs = require('fs');

let files = fs.readdirSync(path.join("files")).filter(file => file.includes(".mp3"));
let counterSounds = {}
files.forEach(file => {
        let parts = file.split(".");
        counterSounds[parts[0]] = path.join("files" ,file)
    }
)

exports.counterSounds = counterSounds;

