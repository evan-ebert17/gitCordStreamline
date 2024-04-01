//filesystem used to read commands
const fs = require('node:fs');

//path
const path = require('node:path');

const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config()

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

    //dynamically set each commands to the clinet.commands Collection.
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

// Create a new client instance
//the guilds intent is neccesary to cache: guilds (servers), channels and roles.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(process.env.BOT_TOKEN);