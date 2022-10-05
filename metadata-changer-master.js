const config = require("./config");
const fs = require("fs"),
    NodeID3 = require("node-id3"),
    child_process = require("child_process"),
    readline = require("readline"),
    dir = fs.readdirSync(config.pathForMusicFiles).filter((file) => file.endsWith(".mp3")),
    colors = require("colors"),
    express = require("express"),
    app = express();

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

app.listen(3000, function (...a) {
    console.log("Listener on port 3000");
});
try {
    if (!fs.existsSync(`${config.pathForMusicFiles}`)) {
        // Directory does not exist.
        // Create new one
        console.log(`Directory ${config.pathForMusicFiles} does not exist.\nCreating...`);
        fs.mkdirSync(config.pathForMusicFiles);
    }
} catch (e) {
    console.log("An error occurred. " + e);
    process.exit(1);
}
console.log("Loading files for metadata changing...");

let leftovers = [];

let toUpdate = [];
async function dealWithLeftovers() {
    let splitted = [];

    for (let i = 0; i < Math.round(toUpdate.length / 100); i++) {
        splitted[i] = toUpdate.slice(i * 100, (i + 1) * 100);
    }
    let active = splitted.length;
    if (splitted.length == 0) process.kill(0);

    for (let i = 0; i < splitted.length; i++)
        splitted[1] = splitted[i].map((element) => {
            return { file: element.file, url: element.url };
        });

    console.log(`Spawning ${splitted.length} children...`);
    let a = 0;
    for (let i = 0; i < splitted.length; i++) {
        a--;
        app.get(`/${a}`, function (req, res) {
            console.log(`Passed: ${splitted[i].length} to free labour force: ${`#${i}`.cyan}`);
            res.send(JSON.stringify(splitted[i]));
        });
        let child = child_process.spawn("node", ["./metadata-changer-child.js", `${i}`]);
        child.stdout.on("data", function (data) {
            let text = data.toString();
            if (text == 1) {
                c++;
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`${Math.round((c / b) * 1000) / 10}%\t`);
                return;
            }
            console.log(colors.green(`[CHILD ${`#${i}`.cyan}] => `), text);
        });
        child.stderr.on("data", function (data) {
            console.log(`[CHILD-BACKUP #${i} ${`!!!ERROR!!!`.underline.red}] => `.green, colors.red(data.toString()));
        });
        child.on("exit", (c) => {
            console.log(`CHILD-BACKUP ${i} died, code: ${c}`);
            active--;
            if (active == 0) {
                process.kill(0);
            }
        });
    }
}

app.put(`/leftover`, (request, result) => {
    console.log(request.body);
});

(async () => {
    let a = 0,
        b = 0,
        c = 0;
    for (const file of dir) {
        const filepath = config.pathForMusicFiles+"/" + file;
        const readTags = NodeID3.read(filepath);
        a++;
        if (
            (readTags.album != "NCS" || readTags.publisher != "NoCopyrightSounds" || !readTags.userDefinedText || !readTags.artistUrl) &&
            !file.endsWith("AOeY-nDp7hI.mp3") &&
            !file.endsWith("xshEZzpS4CQ.mp3") &&
            !file.endsWith("bM7SZ5SBzyY.mp3")
        ) {
            let res = "https://www.youtube.com/watch?v=";
            if (file.includes("Release]-")) res += file.split("Release]-").pop().split(".mp3").shift();
            else if (file.includes("release]-")) res += file.split("release]-").pop().split(".mp3").shift();
            else if (file.includes("Video]-")) res += file.split("Video]-").pop().split(".mp3").shift();
            else if (file.includes("Video-")) res += file.split("Video-").pop().split(".mp3").shift();
            else if (file.includes("Release-")) res += file.split("Release-").pop().split(".mp3").shift();
            else if (file.includes("Winners)-")) res += file.split("Winners)-").pop().split(".mp3").shift();
            else if (file.includes("Launchpad-")) res += file.split("Launchpad-").pop().split(".mp3").shift();
            else if (file.includes("Music]-")) res += file.split("Music]-").pop().split(".mp3").shift();
            else {
                console.log("\n" + file + " !needs attention!\n");
                continue;
            }
            b++;
            toUpdate.push({ file: file, url: res });
        }
    }
    console.log(`\n${a} Scanned\n${b} Need Update\n`);

    let splitted = [];
    for (let i = 0; i * 250 < b; i++) {
        splitted[i] = toUpdate.slice(i * 250, (i + 1) * 250);
    }
    let active = splitted.length;
    if (splitted.length == 0) process.kill(0);

    for (let i = 0; i < splitted.length; i++)
        splitted[1] = splitted[i].map((element) => {
            return { file: element.file, url: element.url };
        });

    console.log(`Spawning ${splitted.length} children...`);
    for (let i = 0; i < splitted.length; i++) {
        app.get(`/${i}`, function (req, res) {
            console.log(`Passed: ${splitted[i].length} to free labour force: ${`#${i}`.cyan}`);
            res.send(JSON.stringify(splitted[i]));
        });
        await sleep(10);
        let child = child_process.spawn("node", ["./metadata-changer-child.js", `${i}`]);
        child.stdout.on("data", function (data) {
            let text = data.toString();
            if (text == 1) {
                c++;
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`${Math.round((c / b) * 1000) / 10}%\t`);
                return;
            } else if (text.startsWith(`{"url":"`)) {
                let parsed = JSON.parse(text);
                leftovers.push(parsed);
                return;
            }
            console.log(colors.green(`[CHILD ${`#${i}`.cyan}] => `), text);
        });
        child.stderr.on("data", function (data) {
            console.log(`[CHILD #${i} ${`!!!ERROR!!!`.underline.red}] => `.green, colors.red(data.toString()));
        });
        child.on("exit", (c) => {
            console.log(`Child ${i} died, code: ${c}`);
            active--;
            if (active == 0) {
                if (leftovers.length == 0) process.kill(0);
                else dealWithLeftovers();
            }
        });
    }
})();
