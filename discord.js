const Discord = require('discord.js');

const token = '';

const client = new Discord.Client()

client.once('ready', () => {
    console.log('Ready!');
});

client.login(token)

client.on('message', async message => {
    if(message.author == client.user) {
        console.log('bot')
        return;
    }
    console.log(message.content);
    if(message.content === '!echo') {
        message.channel.send('echo');
    }
    else if(message.content === '!join') {
        const voiceChannel = message.member.voice.channel
        if(voiceChannel != null) {
            const connection = await voiceChannel.join()
        }
        else {
            message.reply('You need to join a voice channel first!');
        }
    }
    else if(message.content === '!leave') {
        console.log(message.guild.voice.channel)
        message.guild.voice.channel.leave();
    }
    else if(message.content === '!kill') {
        client.destroy()
    }
});