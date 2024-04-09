const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder, ComponentType, StringSelectMenuBuilder } = require('discord.js');

//module.exports is what we use in node to export data to be "require()"-d in other files.

const {Octokit, App} = require("octokit");

require('dotenv').config()

//creating an octokit instance

const octokit = new Octokit({
	auth: process.env.OCTOKIT_AUTH
})

module.exports = {

    //an example slash command.
    //the minimum requirements for a slash command -> a name and a description
    //below it, we define an async method (named execute) and we await the ping (unrelated to the name 'ping')
    //the most basic application of this is interaction.reply() which will just send X message back.

    //data: provides the command definiton 
    //execute: contain the functionality to run from our event handler when the command is used.
    cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('issues')
		.setDescription('Gets information on issues of the specified GitHub repository.')

        //subcommands are just branching commands that require different options depending on the subcommand chosen
        //this subcommand gets the repository from a user and gets all of the issues associated with that repository.
        .addSubcommand(subcommand =>
            subcommand
                    //getallissues is the name of one of the subcommands, and is what we'll use to call in the execute block
                    .setName('getallissues')
                    .setDescription('Gets all issues of a repository we want.')
                    
                    //this specifies the information we're asking from the user, and we added .setRequired to say "you have to put this".
                    .addStringOption(option => 
                        option.setName('repository')
                        .setDescription('The GitHub repository containing the issues we want.')
                        .setRequired(true))

                    //this is just a thing asking "hey do you want this private or not".
                    .addBooleanOption(option =>
                        option.setName('private')
                        .setDescription('Whether or not this command should be for your eyes only'))
                )
        .addSubcommand(subcommand =>
            subcommand
                    //gets issue of specific name
                    .setName('getspecificissue')
                    .setDescription('Gets a specific issue from a specific repository.')

                    .addStringOption(option =>
                        option.setName('repository')
                        .setDescription('The GitHub repository containing the issue we want.')
                        .setRequired(true))
                    
                    .addStringOption(option => 
                        option.setName('issuetitle')
                        .setDescription('The name of the issue we want.')
                        .setRequired(true))),

	    async execute(interaction) {

        }
    }