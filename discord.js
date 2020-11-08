const Discord = require('discord.js');
const speech = require('@google-cloud/speech');
const text = require('@google-cloud/text-to-speech');
const dialogflow = require('@google-cloud/dialogflow-cx');
const { Readable } = require('stream');
const { Transform } = require('stream')
const fs = require('fs');
const util = require('util');

const token = 'Nzc0NzI1OTEyMzYwMjU1NTQw.X6b9uw.zVQSDMxApTTzl7DfmtBWZZGgusc';

const client = new Discord.Client();
const speechClient = new speech.SpeechClient();
const textClient = new text.TextToSpeechClient();
const sessionClient = new dialogflow.SessionsClient();
const sessionId = Math.random().toString(36).substring(7);

const servers = new Map();

function convertBufferTo1Channel(buffer) {
  const convertedBuffer = Buffer.alloc(buffer.length / 2)

  for (let i = 0; i < convertedBuffer.length / 2; i++) {
    const uint16 = buffer.readUInt16LE(i * 4)
    convertedBuffer.writeUInt16LE(uint16, i * 2)
  }

  return convertedBuffer
}

class ConvertTo1ChannelStream extends Transform {
  constructor(source, options) {
    super(options)
  }

  _transform(data, encoding, next) {
    next(null, convertBufferTo1Channel(data))
  }
}

class Silence extends Readable {
  _read() {
    this.push(Buffer.from([0xF8, 0xFF, 0xFE]));
  }
}


client.once('ready', () => {
	console.log('ready!');
	client.user.setActivity("watching civilization burn"); 
});

client.login(token);

const encoding = 'LINEAR16';
const sampleRateHertz = 48000;
const languageCode = 'en-US';

const speechRequest = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  },
  single_utterance: true,
  interimResults: true, // If you want interim results, set this to true
};


client.on('message', async message => {
	if(message.author.bot) return;
	
    console.log(message.content);
    if(message.content === '!echo') {
        message.channel.send('echo');
    }
    else if(message.content === '!join') {
		join(message);
    }
    else if(message.content === '!leave') {
        leave(message);
    }
    else if(message.content === '!play') {
		
		// message.guild.voice.
    }
    else if(message.content === '!kill') {
		leave(message);
        client.destroy()
    }
});

async function join(message){
	const voiceChannel = message.member.voice.channel
	if(!voiceChannel) {
		return message.channel.send('you need to be in a voice channel for me to join');
	}
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if(!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
		return message.channel.send('i need perms bro');
	}

	const voiceConstruct = {
		voiceChannel: voiceChannel,
		connection: null,
		stream: null,
	};
	servers.set(message.guild.id, voiceConstruct);
	
	try {
		const connection = await voiceChannel.join()
		connection.play(new Silence(), { type: 'opus' });

		connection.on('speaking', (user, speaking) => {
			console.log(user + ' is ' + speaking);
			
			if(speaking == 1) {
				const audioStream = connection.receiver.createStream(user, {mode: 'pcm'})
				let transcription = null;
				voiceConstruct.stream = audioStream;
				const recognizeStream = speechClient
				.streamingRecognize(speechRequest)
				.on('error', () =>{
					console.log('recognizer error')
					message.channel.send("i ain't got forever buddy");
					leave(message);
				})
				.on('data', data => {
					transcription = data.results
					.map(result => result.alternatives[0].transcript)
					.join(' ')
					.replace(/ + +/," ")
					.toLowerCase();
					console.log(`Transcription: ${transcription}`)
				});

				const convert = new ConvertTo1ChannelStream();
				audioStream.pipe(convert).pipe(recognizeStream);

				audioStream.on('end', () => {
					if(transcription) {
						// message.channel.send(transcription);
						dialog(message, transcription, connection);
						// speak(message, transcription, connection);
					}
					// recognizeStream.destroy();
					console.log('audio end')
				})
				.on('close', () => {
					// if(transcription) message.channel.send(transcription);
					// recognizeStream.destroy();
					console.log('audio close')
				})
				.on('error',error => console.error(error));
			}
		});
		
		
		// voiceConstruct.connection = connection
		// const audio = connection.receiver.createStream(message, {end: 'manual'})
		

	} catch (err) {
		console.log(err);
		servers.delete(message.guild.id);
		return message.channel.send('oopsie');
	}
}

async function dialog(message, text, connection) {
	
	const sessionPath = sessionClient.projectLocationAgentSessionPath(
		'hackrpidiscordbot',
		'global',
		'cf6e3571-68c4-4698-8413-44ff07229567',
		sessionId
		);
	const dialogRequest = {
		session: sessionPath,
		queryInput: {
		  	text: {
				// The query to send to the dialogflow agent
				text: text,

			},
			// The language used by the client (en-US)
			languageCode: 'en',
		},
	};
	const [response] = await sessionClient.detectIntent(dialogRequest);
	console.log('Detected intent');
	for (const m of response.queryResult.responseMessages) {
		if (m.text) {
			console.log(`Agent Response: ${m.text.text}`);
			speak(message, m.text.text, connection);
		}
	}
	if (response.queryResult.match.intent) {
		console.log(`Matched Intent: ${response.queryResult.match.intent.displayName}`);
	}
	console.log(`Current Page: ${response.queryResult.currentPage.displayName}`);
}

async function speak(message, text, connection) {
	console.log('speak')
	const textRequest = {
		input: {text: text},
		// Select the language and SSML voice gender (optional)
		voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
		// select the type of audio encoding
		audioConfig: {audioEncoding: 'MP3'},
	};
	const [response] = await textClient.synthesizeSpeech(textRequest);
	const writeFile = util.promisify(fs.writeFile);
	await writeFile('output.mp3', response.audioContent, 'binary');
	console.log('done writing')
	connection.play('output.mp3');
}

async function leave(message) {
	const voiceConstruct = servers.get(message.guild.id);
	if(!voiceConstruct) return message.channel.send('oopsie whoopsie');
	voiceConstruct.stream.destroy();
	voiceConstruct.voiceChannel.leave();
}
