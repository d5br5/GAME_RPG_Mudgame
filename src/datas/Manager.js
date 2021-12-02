const constant = require("./constants.json");
const item = require("./items.json");
const monster = require("./monsters.json");

const constantManager = {
	gameName: constant.gameName,
};

const itemManager = {
	getRandom() {
		const i = Math.floor(Math.random() * item.length);
		return item[i];
	},
};

const monsterManager = {
	getRandom() {
		const i = Math.floor(Math.random() * monster.length);
		return monster[i];
	},
	get(name) {
		return monster.find((x) => x.name.includes(name));
	},
};

module.exports = {
	constantManager,
	itemManager,
	monsterManager,
};
