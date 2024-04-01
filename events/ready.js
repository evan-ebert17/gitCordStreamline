const { Events } = require('discord.js');

module.exports = {
    //name: states which event this file is for
	name: Events.ClientReady,
    //once: holds a boolean value that specifies if the event should run only once.
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};