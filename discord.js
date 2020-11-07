const Discord = require('discord.js')
const client = new Discord.Client()

client.once('ready', () => {
    console.log('Ready!');
});

client.login("Nzc0NzI1OTEyMzYwMjU1NTQw.X6b9uw.s8a-o8NabXQTNwhgx-5BIxkfmGM")

client.on('message', message => {
    console.log(message.content);
    if (message.content === '!echo') {
        // send back "Pong." to the channel the message was sent in
        message.channel.send('echo');
    }
});

client.on('message', async message => {
    // Voice only works in guilds, if the message does not come from a guild,
    // we ignore it
    if (!message.guild) return;
  
    if (message.content === '!join') {
      // Only try to join the sender's voice channel if they are in one themselves
      if (message.member.voice.channel) {
        const connection = await message.member.voice.channel.join();
      } else {
        message.reply('You need to join a voice channel first!');
      }
      //This is going to be the stream that can go with Google stuff?
      const ReadableStream = connection.voiceReceiver.createStream(message.member.user);
    }
  });
