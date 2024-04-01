const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {

        //this if statement is just making sure our command IS a slash command
		if (!interaction.isChatInputCommand()) return;

        //interaction.commandName is stored in the Collection we made with line 11.
        //so command is just... our command's name we're about to use.
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {

            //this is where we try and run our command, assuming everything is good
			await command.execute(interaction);
		} catch (error) {

            //discord error handling
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	},
};