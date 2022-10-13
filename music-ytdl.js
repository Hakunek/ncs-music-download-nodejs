const fs = require("fs");
const ytpl = require("ytpl");
const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");
ffmpeg.setFfmpegPath(ffmpegStatic);

console.clear();
console.time("Job done within");
console.log("Loading...");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
            e.title.endsWith("[NCS Mix]") ||
            e.title.endsWith("(Track & Build 2.0 Winners)") ||
            e.title.endsWith("(Album Mix) [NCS Release]") ||
            e.title == "NCS Mashup - Biggest NoCopyrightSounds Songs" ||
            //this one has just music version so there is no need to have it two times
            e.title == "Unknown Brain - Saviour (feat. Chris Linton) [NCS Official Video]"
        )
            return;
        queue.push(e.url.split(`&list=${config.playlistId}`).shift());
    });
    const ar = [...new Set(queue)];
    return ar;
}

// ------------------------------------------------------------- CLI-PROGRESS SECTION -------------------------------------------------------------

const cliProgress = require("cli-progress");

const multibar = new cliProgress.MultiBar(
    {
        clearOnComplete: false,
        hideCursor: true,
        format: "Thread* {id}: {bar} | {currentVideoLink} | {duration}s | {eta}s | {value}/{total}",
        autopadding: true,
        stopOnComplete: true,
    },
    cliProgress.Presets.shades_classic
);

const bars = [];
const toHandle = [];
const def = {
    currentVideoLink: "-",
    value: 0,
    id: 0,
};
// ------------------------------------------------------------- DOWNLOAD SECTION -------------------------------------------------------------
async function downloading(ar, index = 0, barIndex = 0) {
    if (index >= ar.length) return;
    if (index == 0) {
        if (ar.length == 1) {
            bars.push(
                multibar.create(1, 0, {
                    ...def,
                    id: 0,
                })
            );
            toHandle.push(1);
        } else if (ar.length == 2) {
            bars.push(
                multibar.create(1, 0, {
                    ...def,
                    id: 0,
                })
            );
            bars.push(
                multibar.create(1, 0, {
                    ...def,
                    id: 1,
                })
            );
            toHandle.push(1, 1);
            downloading(ar, 1, 1);
        } else if (ar.length == 3) {
            bars.push(
                multibar.create(1, 0, {
                    ...def,
                    id: 0,
                })
            );
            bars.push(
                multibar.create(1, 0, {
                    ...def,
                    id: 1,
                })
            );
            bars.push(
                multibar.create(1, 0, {
                    ...def,
                    id: 2,
                })
            );
            toHandle.push(1, 1, 1);
            downloading(ar, 1, 1);
            downloading(ar, 2, 2);
        } else {
            let correction = [];
            switch (ar.length % 4) {
                case 0:
                    correction.push(0, 0, 0);
                    break;
                case 1:
                    correction.push(1, 0, 0);
                    break;
                case 2:
                    correction.push(1, 1, 0);
                    break;
                case 3:
                    correction.push(1, 1, 1);
                    break;
            }
            toHandle.push(
                Math.floor(ar.length / 4) + correction[0],
                Math.floor(ar.length / 4) + correction[1],
                Math.floor(ar.length / 4) + correction[2],
                Math.floor(ar.length / 4)
            );
            bars.push(
                multibar.create(toHandle[0], 0, {
                    currentVideoLink: "-",
                    value: 0,
                    total: toHandle[0],
                    id: 0,
                }),
                multibar.create(toHandle[1], 0, {
                    currentVideoLink: "-",
                    value: 0,
                    total: toHandle[1],
                    id: 1,
                }),
                multibar.create(toHandle[2], 0, {
                    currentVideoLink: "-",
                    value: 0,
                    total: toHandle[2],
                    id: 2,
                }),
                multibar.create(toHandle[3], 0, {
                    currentVideoLink: "-",
                    value: 0,
                    total: toHandle[3],
                    id: 3,
                })
            );
            downloading(ar, 1, 1);
            downloading(ar, 2, 2);
            downloading(ar, 3, 3);
        }
    }
    let id = ar[index].split("https://www.youtube.com/watch?v=").pop();
    let stream = ytdl(id, { quality: "highestaudio" });
    let info = await ytdl.getInfo(ar[index], { quality: "highestaudio" });
    ffmpeg(stream)
        .audioBitrate(128)
        .save(`${config.pathForMusicFiles}/${info.videoDetails.title}-${info.videoDetails.videoId}.mp3`)
        .on("start", () => {
            bars[barIndex].update({
                currentVideoLink: `${ar[index]}`,
                value: toHandle[barIndex],
            });
        })
        .on("end", async () => {
            bars[barIndex].increment();
            bars[barIndex].update({
                currentVideoLink: `${ar[index]}`,
                value: toHandle[barIndex],
            });
            index += 4;
            if (index <= ar.length - 1) {
                await sleep(4000);
                downloading(ar, index, barIndex);
            } else console.log(`Thread* ${barIndex} completed it's job`);
        });
}

/*
async function old(download) {
  let one = true,
    two = 0;
  for (const downLink of download) {
    let id = downLink.split("https://www.youtube.com/watch?v=").pop(),
      stream = ytdl(id, { quality: "highestaudio" }),
      info = await ytdl.getInfo(downLink, { quality: "highestaudio" });
    ffmpeg(stream)
      .audioBitrate(128)
      .save(
        `${config.pathForMusicFiles}/${info.videoDetails.title}-${info.videoDetails.videoId}.mp3`
      )
      .on("progress", (p) => {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${p.targetSize}kb downloaded`);
      })
      .on("end", () => {
        two++;
        console.log(
          `${info.videoDetails.title}-${info.videoDetails.videoId} downloaded`
        );
        if (two >= download.length - 1) {
          one = false;
        }
      });
    sleep(1000);
  }
  return console.timeEnd("Job done within");
}*/

async function mniam() {
    console.log("Scanning...");
    // ------------------------------------------------------------- FETCH & FILTER SECTION -------------------------------------------------------------
    const files = fs.readdirSync(`${config.pathForMusicFiles}`).filter((e) => e.endsWith(".mp3"));
    const temp1 = [];
    const temp2 = [];
    const temp3 = [];
    const download = [];
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
    console.log(`Music to download: ${download.length}`);
    console.log("Thread* - Yes I know that this name is not really correct, don't hurt me >.<");
    console.log("Progress:");
    downloading(download, 0);
}

mniam();
