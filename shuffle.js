const config = require("./config");const fs = require("fs"),
    getSortedFiles = (dir) => {
        const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mp3"));

        return files
            .map((fileName) => ({
                name: fileName,
                time: fs.statSync(`${dir}/${fileName}`).mtime.getTime(),
            }))
            .sort((a, b) => b.time - a.time)
            .map((file) => file.name);
    };
Promise.resolve()
    .then(() => getSortedFiles(config.pathForMusicFiles))
    .then((files) => {
        fs.writeFileSync(config.pathForMusicFiles+"/../playlist.txt", config.pathForMusicFiles + files.join("\n"+config.pathForMusicFiles));
    });
