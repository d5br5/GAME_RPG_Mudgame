const { Player } = require("../models/Player");
const crypto = require("crypto");



async function signup(req, res) {
    const { name } = req.body;
  
    if (await Player.exists({ name })) {
      return res.status(400).send({ error: "Player already exists" });
    }
  
    const player = new Player({
      name,
      maxHP: 10,
      HP: 10,
      str: 5,
      def: 5,
      x: 0,
      y: 0
    });
  
    const key = crypto.randomBytes(24).toString("hex");
    player.key = key;
  
    await player.save();

    return res.send({ key });
  };


  module.exports = {
      signup
  }