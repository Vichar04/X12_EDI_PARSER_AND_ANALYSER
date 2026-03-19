require('dotenv').config()
const express = require('express');
const multer = require('multer');
const app = express(); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder must exist
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), (req, res) => {
    console.log("Hello")
  console.log(req.file); // file info
  res.send("File uploaded successfully");
});

app.get('/server-health', (req, res) => {
    res.send(`Server is Healthy`);
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running fine on the Port ${process.env.PORT}`);
})