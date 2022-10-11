const fs = require("fs"),
    ytpl = require("ytpl"),
    readline = require("readline"),
    ytdl = require("@distube/ytdl-core"),
    ffmpeg = require("fluent-ffmpeg"),
    ffmpegStatic = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegStatic);
console.time("Job done within");
console.log("Loadin...");

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
let config = require("./config.js");
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

async function musicLinks() {
    const playlist = await ytpl(config.playlistId, {
        limit: Infinity,
    });
    let queue = [];
    playlist.items.forEach((e) => {
        if (
            e.title.startsWith("NCS Reloaded:") ||
            e.title.startsWith("Cartoon") ||
            e.title.startsWith("THANK") ||
            e.title.startsWith("NCS:") ||
            e.title.includes("Album Mix") ||
            e.title.includes("NCS is") ||
            e.title.includes("Free EDM Music Mix") ||
            e.title.includes("NoCopyrightSounds 10 Year Mix (Copyright Free Gaming Music)") ||
            e.title == "The Creation of NCS" ||
            e.title == "NoCopyrightSounds Live Stream" ||
            e.title.startsWith("10 Years Of NCS") ||
            e.title.startsWith("NCS Mashup") ||
            e.title.endsWith("[NCS Mix]") ||
            e.title.endsWith("(Track & Build 2.0 Winners)") ||
            e.title.endsWith("(Album Mix) [NCS Release]")
        )
            return;
        queue.push(e.url.split(`&list=${config.playlistId}`).shift());
    });
    const ar = [...new Set(queue)];
    return ar;
}

async function downloading(download) {
    // ------------------------------------------------------------- DOWNLOAD SECTION -------------------------------------------------------------
    let one = true,
        two = 0;
    for (const downLink of download) {
        let id = downLink.split("https://www.youtube.com/watch?v=").pop(),
            stream = ytdl(id, { quality: "highestaudio" }),
            info = await ytdl.getInfo(downLink, { quality: "highestaudio" });
        ffmpeg(stream)
            .audioBitrate(128)
            .save(`${config.pathForMusicFiles}/${info.videoDetails.title}-${info.videoDetails.videoId}.mp3`)
            .on("progress", (p) => {
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`${p.targetSize}kb downloaded`);
            })
            .on("end", () => {
                two++;
                console.log(`${info.videoDetails.title}-${info.videoDetails.videoId} downloaded`);
                if (two >= download.length - 1) {
                    one = false;
                }
            });
        sleep(1000);
    }
    return console.timeEnd("Job done within");
}

async function mniam() {
    console.log("Scanning...");
    // ------------------------------------------------------------- FETCH & FILTER SECTION -------------------------------------------------------------
    const files = fs.readdirSync(`${config.pathForMusicFiles}`).filter((e) => e.endsWith(".mp3"));
    const temp1 = [],
        temp2 = [],
        temp3 = [],
        download = [];
    let res;
    for (const file of files) {
        if (file.includes("Release]-")) res = file.split("Release]-").pop();
        else if (file.includes("release]-")) res = file.split("release]-").pop();
        else if (file.includes("Video]-")) res = file.split("Video]-").pop();
        else if (file.includes("Video-")) res = file.split("Video-").pop();
        else if (file.includes("Release-")) res = file.split("Release-").pop();
        else if (file.includes("Winners)-")) res = file.split("Winners)-").pop();
        else if (file.includes("Launchpad-")) res = file.split("Launchpad-").pop();
        else if (file.includes("Music]-")) res = file.split("Music]-").pop();
        else console.log("\n" + file + " !needs attention!\n");
        temp1.push(res);
    }

    for (const file of temp1) {
        temp2.push(file.split(".mp3").shift());
    }
    const links = await musicLinks();
    for (const file of links) {
        temp3.push(file.split("https://www.youtube.com/watch?v=").pop());
    }
    console.log(`Local: ${temp2.length}`);
    console.log(`Cloud: ${temp3.length}`);
    temp3.filter((n) => !temp2.includes(n)).forEach((e) => download.push("https://www.youtube.com/watch?v=" + e));
    console.log(`Music to download: ${download.length}\n`, download);

    downloading(download);
}

mniam();
