const { SlashCommandBuilder } = require('discord.js');

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
		.setName('repos')
		.setDescription('Gets information on repos of the specified GitHub account.')

        //subcommands are just branching commands that require different options depending on the subcommand chosen
        //this subcommand gets the username from a user and gets all of the (public) repos associated with that username
        .addSubcommand(subcommand =>
            subcommand
                    //get repos is the name of one of the subcommands, and is what we'll use to call in the execute block
                    .setName('getallrepos')
                    .setDescription('Gets all repos of user whose repos we want.')
                    
                    //this specifies the information we're asking from the user, and we added .setRequired to say "you have to put this".
                    .addStringOption(option => 
                        option.setName('username')
                        .setDescription('The GitHub username of the user whose repos we want.')
                        .setRequired(true))

                    //this is just a thing asking "hey do you want this private or not".
                    .addBooleanOption(option =>
                        option.setName('private')
                        .setDescription('Whether or not this command should be for your eyes only'))
                )
        .addSubcommand(subcommand =>
            subcommand
                    //gets repo of specific name
                    .setName('getspecificrepo')
                    .setDescription('Gets a specific repo from a specific user.')

                    .addStringOption(option =>
                        option.setName('username')
                        .setDescription('The GitHub username of the user whose repo we want.')
                        .setRequired(true))
                    
                    .addStringOption(option => 
                        option.setName('repository')
                        .setDescription('The name of the repository we want.')
                        .setRequired(true))),

	    async execute(interaction) {
            //if we have subcommands, we need to set this "CommandInteractionOptionResolver#getSubcommand()" to tell us which subcommand was used.
		    if (interaction.options.getSubcommand() === 'getallrepos') {

                const username = interaction.options.getString('username');

                const response = await octokit.request(`GET /users/${username}/repos`, {
                                    username: username,
                                    headers: {
                                        'X-Github-Api-Version': '2022-11-28'
                                    }
                                })
                //this is just the num of json objects that get returned from our call.
                //make this a menu later that when the number of repos goes over 5-10, make another page the user can go to.

                //currently holds 30 repos (me)
                let numOfRepos = response.data.length;

                let allRepoInfo = [];

                for (i = 0; i < 5; i++) {
                    let someRepoInfo = 
                    `Repository Name: ${response.data[i].name}\nURL: ${response.data[i].html_url}\n`

                    allRepoInfo.push(someRepoInfo)
                }

                await interaction.reply(`${username}'s Repositories: \n` + allRepoInfo.toString())
            }

            if (interaction.options.getSubcommand() === 'getspecificrepo') {

                const username = interaction.options.getString('username');

                const repoName = interaction.options.getString('repository');

                const response = await octokit.request(`GET /repos/${username}/${repoName}`, {
                                    owner: username,
                                    repo: repoName,
                                    headers: {
                                        'X-GitHub-Api-Version': '2022-11-28'
                                    }
                                })


                const repoInfo = 
                `Repository Name: ${response.data.name}\nDescription: ${response.data.description}\n\nLanguage: ${response.data.language}\nStars: ${response.data.stargazers_count}\nWatchers: ${response.data.watchers_count}\nForks: ${response.data.forks_count}\nURL: ${response.data.html_url}`;

                await interaction.reply(repoInfo);

            }

	},
};