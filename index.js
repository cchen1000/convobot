//to hide token
//require("dotenv").config()
//need discord API library
const fs = require('fs');
const Discord = require("discord.js");
const { prefix, token } = require('./config.json');
const client = new Discord.Client();

//turn on
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

//login
client.login(token)
