const express = require("express");
const app = express();
const cors = require("cors");
const bodyparser = require("body-parser");
const upload = require("express-fileupload");
const download = require("download");
const port = process.env.PORT || 3000;
const fs = require("fs");
const { runInNewContext } = require("vm");
require("dotenv").config();

//middlewares

app.use(cors());
app.use(express.static("./"));
app.use(upload());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

//video streaming route

app.get("/api/v1/video/:name", async (req, res) => {
  const range = await req.headers.range;
  if (!range) {
    res.json({
      message:
        "requires range header try putting < range= bytes 0 > in postman",
    });
  } else {
    try {
      const videoPath = `./video/${req.params.name}.mp4`;
      const videoSize = fs.statSync(videoPath).size;
      console.log(videoSize);
      const Chunk = 10 ** 6;
      const start = Number(range.replace(/\D/g, ""));
      const end = Math.min(start + Chunk, videoSize - 1);
      const VideoLength = end - start + 1;
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": VideoLength,
        "Content-Type": "video/mp4",
      };
      res.writeHead(206, headers);
      const readstream = fs.createReadStream(videoPath, { start, end });
      readstream.pipe(res);
    } catch (err) {
      res.json({ message: "file not found" });
    }
  }
});

//Video Upload route
app.post("/api/v1/video/upload", (req, res) => {
  if (req.files) {
    console.log(req.files);
    var file = req.files.file;
    var fileName = file.name;
    console.log(fileName);
    file.mv("./video/" + fileName, function (err) {
      if (err) {
        res.json({ message: err });
      } else {
        res.json({ message: "file uploaded" });
      }
    });
  }
});

//video download route

app.get("/api/v1/video/download/:name", (req, res) => {
  res.download(`./video/${req.params.name}.mp4`);
});

//Starting server
const start = async () => {
  try {
    //    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log("server running at port", port);
    });
  } catch (err) {
    console.log(err);
  }
};
start();
