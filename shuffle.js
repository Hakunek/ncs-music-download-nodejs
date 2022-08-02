const fs = require("fs"),
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
    .then(() => getSortedFiles("./mp3"))
    .then((files) => {
        fs.writeFileSync("./playlist.txt", "E:\\.github-package-dev\\music\\mp3\\" + files.join("\nE:\\.github-package-dev\\music\\mp3\\"));
    });
