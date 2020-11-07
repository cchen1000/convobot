const Discord = require('discord.js')
const client = new Discord.Client()

client.once('ready', () => {
    console.log('Ready!');
});

client.login('token')

client.on('message', message => {
    console.log(message.content);
    if (message.content === '!echo') {
        // send back "Pong." to the channel the message was sent in
        message.channel.send('echo');
    }
});