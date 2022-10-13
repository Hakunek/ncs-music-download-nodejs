const fs = require("fs");
const NodeID3 = require("node-id3");
const img = fs.readFileSync("./mp3.jpeg");
const ytdl = require("@distube/ytdl-core");
const check = require("./vidProperitesChecker");
const fetch = require("node-fetch");
const id = parseInt(process.argv[2]);

const config = require("./config");
(async () => {
  console.log(`Spawned: ${id}`);
  let res = await fetch(`http://localhost:3000/${id}`);
  let arr = await JSON.parse(await res.text());
  arr.forEach(async ({ url, file }) => {
    try {
      if (await check(url)) {
        let info = await ytdl.getInfo(url, { quality: "highestaudio" });
        //*

        const filepath = `${config.pathForMusicFiles}/${file}`;
        const readTags = NodeID3.read(filepath);
        NodeID3.removeTags(filepath);
        NodeID3.write(
          {
            artist: info.videoDetails.media.artist,
            title: info.videoDetails.title,
            artistUrl: [
              "https://www.youtube.com/channel/UC_aEa8K-EOJ3D6gOs7HcyNg",
            ],
            author: "NoCopyrightSounds",
            publisher: "NoCopyrightSounds",
            album: "NCS",
            year: info.videoDetails.publishDate.split("-").shift(),
            userDefinedText: [
              {
                description: "Notice",
                value: "Remember to give a link when using in a video",
              },
              { description: "DATE", value: info.videoDetails.publishDate },
              { description: "VIDEOURL", value: info.videoDetails.video_url },
            ],
            encodingTechnology: readTags.encodingTechnology
              ? readTags.encodingTechnology
              : "Lavf58.76.100",
            image: {
              mime: "image/jpeg",
              type: { id: 6, name: "media" },
              imageBuffer: img,
            },
          },
          filepath
        );
        //*/
        console.log(1);
      }
    } catch (e) {
      console.log(e, file);
      let res = JSON.stringify({ url: url, file: file });
      console.log(res);
    }
  });
})();

//         let displ = c.map((el) => {
//             return {
//                 name: el.name.split(".mp3").shift(),
//                 album: el.tags.album,
//                 userDefinedText: el.tags.userDefinedText[0].description + ": " + el.tags.userDefinedText[0].value,
//                 encodingTechnology: el.tags.encodingTechnology,
//                 image: el.tags.image.mime,
//                 type: el.tags.image.type.id + "-" + el.tags.image.type.name,
//             };
//         });
//         console.log("\n\nChanged:");
//         console.table(displ);
