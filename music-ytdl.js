const fs = require("fs");
const ytpl = require("ytpl");
//var exec = require("child_process").exec;
const readline = require("readline");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");
console.log(ffmpegStatic)
ffmpeg.setFfmpegPath(ffmpegStatic)
console.log("Loadin...");

async function sleep(ms){
    return new Promise(setTimeout(()=>{},ms))
}


async function musicLinks() {
    const playlist = await ytpl("UU_aEa8K-EOJ3D6gOs7HcyNg", {
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
            e.title == "The Creation of NCS"
        )
            return;
        queue.push(e.url.split("&list=UU_aEa8K-EOJ3D6gOs7HcyNg").shift());
    });
    const ar = [...new Set(queue)];
    return ar;
}

async function downloading(download) {
    // ------------------------------------------------------------- DOWNLOAD SECTION -------------------------------------------------------------
    download.forEach(async downLink =>{
        let id = downLink.split("https://www.youtube.com/watch?v=").pop(),
            stream = ytdl(id, { quality: "highestaudio" }),
            info = await ytdl.getInfo(downLink, { quality: "highestaudio" });
        let start = Date.now();
        ffmpeg(stream)
             .audioBitrate(128)
             .save(`./mp3/${info.videoDetails.title}-${info.videoDetails.videoId}.mp3`)
             .on("progress", (p) => {
                 readline.cursorTo(process.stdout, 0);
                 process.stdout.write(`${p.targetSize}kb downloaded`);
             })
             .on("end", () => {
                 console.log(`\ndone, ${(Date.now() - start) / 1000}s`);
             });
        await sleep(1000)
    })
}

async function mniam() {
    console.log("Scanning...");
    // ------------------------------------------------------------- FETCH & FILTER SECTION -------------------------------------------------------------
    const files = fs.readdirSync("./mp3").filter((e) => e.endsWith(".mp3"));
    const temp1 = [],
        temp2 = [],
        temp3 = [],
        download = [];
    let res;
    for (const file of files) {
        if (file.includes("Release]-")) res = file.split("Release]-").pop();
        else if (file.includes("Video]-")) res = file.split("Video]-").pop();
        else if (file.includes("Video-")) res = file.split("Video-").pop();
        else if (file.includes("Release-")) res = file.split("Release-").pop();
        else if (file.includes("Winners)-")) res = file.split("Winners)-").pop();
        else if (file.includes("Launchpad-")) res = file.split("Launchpad-").pop();
        else if (file.includes("Music]-")) res = file.split("Music]-").pop();
        else console.log(file + " !needs attention!");
        temp1.push(res);
    }

    for (const file of temp1) {
        temp2.push(file.split(".mp3").shift());
    }
    const links = await musicLinks();
    for (const file of links) {
        temp3.push(file.split("https://www.youtube.com/watch?v=").pop());
    }
    console.log(links.length);
    console.log(temp2.length);
    console.log(temp3.length);
    console.log("Getting Music links");
    temp3.filter((n) => !temp2.includes(n)).forEach((e) => download.push("https://www.youtube.com/watch?v=" + e));
    console.log(`Music to download: ${download.length}\n`, download);

    downloading(download);
}
//musicLinks()
mniam();
