let fs = require("fs"),
    readline = require("readline"),
    fetch = require("node-fetch"),
    parseTitle = (body) => {
        let match = body.match(/<title>([^<]*)<\/title>/); // regular expression to parse contents of the <title> tag
        if (!match || typeof match[1] !== "string") throw new Error("Unable to parse the title tag");
        return match[1];
    },
    check = async (urlCheck) => {
        let value = await fetch(urlCheck)
            .then(async (res) => await res.text()) // parse response's body as text
            .then(async (body) => parseTitle(body)) // extract <title> from body
            .then(async (title) => {
                return await title;
            });
        return value != " - YouTube";
    },
    testAll = async () => {
        const inFolder = fs.readdirSync("./mp3").filter((f) => f.endsWith(".mp3"));
        let rese = [];
        let o = 0;
        for (const file of inFolder) {
            let res = "https://www.youtube.com/watch?v=";
            if (file.includes("Release]-")) res += file.split("Release]-").pop().split(".mp3").shift();
            else if (file.includes("Video]-")) res += file.split("Video]-").pop().split(".mp3").shift();
            else if (file.includes("Video-")) res += file.split("Video-").pop().split(".mp3").shift();
            else if (file.includes("Release-")) res += file.split("Release-").pop().split(".mp3").shift();
            else if (file.includes("Winners)-")) res += file.split("Winners)-").pop().split(".mp3").shift();
            else if (file.includes("Launchpad-")) res += file.split("Launchpad-").pop().split(".mp3").shift();
            else if (file.includes("Music]-")) res += file.split("Music]-").pop().split(".mp3").shift();
            else {
                console.log("\n" + file + " !needs attention!\n");
            }
            rese.push({ filename: file, url: res, isAvailable: await check(res) });

            o++;
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`${parseInt(o) / parseInt(inFolder)}%                     `);
        }
        await console.table(rese);
    };
if (process.argv[2] == "all") testAll();
module.exports = check;
