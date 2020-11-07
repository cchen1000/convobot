const Discord = require('discord.js');
const speech = require('@google-cloud/speech');
const fs = require('fs');

const token = 'Nzc0NzI1OTEyMzYwMjU1NTQw.X6b9uw.75FB9gls06g15t2Nqmc8BRQNVV8';

const client = new Discord.Client();
const speechClient = new speech.SpeechClient();


client.once('ready', () => {
    console.log('Ready!');
});

client.login(token);

const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US';

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  },
  interimResults: true, // If you want interim results, set this to true
};

// Create a recognize stream
const recognizeStream = speechClient
  .streamingRecognize(request)
  .on('error', console.error)
  .on('data', data =>
    console.log(data.results[0])
    // process.stdout.write(
    //   data.results[0] && data.results[0].alternatives[0]
    //     ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
    //     : '\n\nReached transcription time limit, press Ctrl+C\n'
    // );
  );

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
            const audio = connection.receiver.createStream(message, {mode: 'pcm',end: 'manual'});
            audio.pipe(recognizeStream);
            // const audio = connection.receiver.createStream(message, {end: "manual"});
			// audio.pipe(fs.createWriteStream('audio'));
			// const broadcast = client.voice.createBroadcast();
			// const dispatcher = broadcast.play(fs.createReadStream('audio'));
			// connection.play(audio, {type: 'opus'})
        }
        else {
            message.reply('You need to join a voice channel first!');
        }
    }
    else if(message.content === '!leave') {
        message.guild.voice.channel.leave();
    }
    else if(message.content === '!play') {
		
		// message.guild.voice.
    }
    else if(message.content === '!kill') {
        client.destroy()
    }
});