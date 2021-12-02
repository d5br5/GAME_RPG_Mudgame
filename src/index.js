const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config();
const port = process.env.PORT || 4000;
const {constantManager} = require("./datas/Manager");
const mongoURI = process.env.mongoURI;
const {action} = require("./controller/action");
const {signup} = require("./controller/sign");
const {authentication} = require("./middle/auth");
const {ranking} = require("./controller/ranking");

const app = express();
app.use(express.urlencoded({extended: true}));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static("./img/"));
app.engine("html", require("ejs").renderFile);

mongoose
	.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true})
	.then(() => console.log("Successfully connected to mongodb")) // mongodb connection success
	.catch((e) => console.error(e));

app.get("/", async (req, res) => {
	res.render("index", {
		gameName: constantManager.gameName,
		rankList: await ranking(),
	});
});

app.get("/music", (req, res) => {
	fs.readFile("./music/AcientForest.mp3", (error, data) => {
		res.writeHead(200, {"Content-Type": "audio/mp3"});
		res.end(data);
	});
});

app.get("/game", (req, res) => {
	res.render("game");
});
app.post("/signup", signup, (req, res) => {});
app.post("/action", authentication, action);
app.get("/ending", (req, res) => {
	res.render("ending", {score: req.score});
});
app.listen(port, () => {
	console.log(`listening at http://localhost:${port}`);
});
