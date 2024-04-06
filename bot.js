//filesystem used to read commands
const fs = require('node:fs');

//path
const path = require('node:path');

const { Client, Collection, GatewayIntentBits } = require('discord.js');

require('dotenv').config();

// Create a new client instance
//the guilds intent is neccesary to cache: guilds (servers), channels and roles.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

//extends the map class and inclused more useful (for discord) functionality.
client.commands = new Collection();

//constructs a path to the commands directory
const foldersPath = path.join(__dirname, 'commands');

//reads the path to the directory and returns an array of all the folder names it contains.
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {

    //constructs a path to the commands directory, another layer deep
	const commandsPath = path.join(foldersPath, folder);

    //reads the path to the directory and returns an array of all the files it contains.
    //applies a filter on to the files to make sure only the javascript files get read.

    //this reads as:

    //dynamically set each commands to the client.commands Collection.
    //for each file being loaded:
    //check that it has at least a data and execute property (this helps to prevent errors resulting from loading unfinished commands.)
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {

		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

//constructs a path to the events directory
const eventsPath = path.join(__dirname, 'events');

//reads the path to the directory and returns an array of all the files it contains
//applies a filter on to the files to make sure only the javascript files get read.
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

//this is reading through our file array we made above
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);

	//this is saying if the event has the once tag, execute it client.once.
	//otherwise...
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		//take the name of the event, and its arguments and then execute the event
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Log in to Discord with token
client.login(process.env.BOT_TOKEN);