const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder } = require('discord.js');

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
                // inside a command, event listener, etc.

                const username = interaction.options.getString('username');

                const response = await octokit.request(`GET /users/${username}/repos`, {
                                    username: username,
                                    headers: {
                                        'X-Github-Api-Version': '2022-11-28'
                                    }
                                })

                //this is just the num of json objects that get returned from our call.
                //make this a menu later that when the number of repos goes over 5-10, make another page the user can go to.
                //currently holds ~30 repos (me)
                let numOfRepos = response.data.length;
                
                //array that will hold all of our repositories to be appended
                let allRepoInfo = [];

                let nameUrlObject = {}

                //this is saying (named boolean):
                //if we have 5 elements (0,1,2,3,4) or
                //we've run out of elements to iterate over
                //push that object to the array

                //const fiveAtATimeOrNoneLeft = (i / 5 == 0 || i == numOfRepos) 

                //currently set to 10, this is just using our response object to get all of the repo names and url's 
                //to be pushed to our allRepoInfo array
                for (let i = 0; i < numOfRepos; i += 5) {

                    //get the next 5 elements from our data
                    const reposSlice = response.data.slice(i, i + 5);

                    // Map each repo to an object
                    const reposGroup = reposSlice.map(repo => {
                        return {
                            name: `**Repository Name:**`,
                            value: repo.name
                        };
                    });
                
                    const reposUrlGroup = reposSlice.map(repo => {
                        return {
                            name: `**Repository URL:**`,
                            value: repo.html_url
                        };
                    });
                
                    // Combine the name and URL objects for each repo
                    const combinedRepos = reposGroup.map((repo, index) => {
                        return {
                            name: reposGroup[index].name,
                            value: `${reposGroup[index].value}\n${reposUrlGroup[index].name} \n${reposUrlGroup[index].value}`
                        };
                    });

                    // Push the group of 5 into the array
                    allRepoInfo.push(combinedRepos);

                }


                //this is the embed where our main content resides.
                //it is in object format currently.

                const allRepoEmbed = {
                    color: 0x547AA4, 
                    title: 'All Repositories',
                    author: {
                        name: 'gitCordStreamline',
                        icon_url: 'https://i.imgur.com/VvN7PcF.png',
                        url: 'https://github.com/evan-ebert17/gitCordStreamline',
                    },
                    //content starts here

                    //to update the text content, just increase the index here.
                    fields: allRepoInfo[0],
                    
                    //content ends here
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: 'Evan Ebert 2024',
                        icon_url: 'https://i.imgur.com/VvN7PcF.png',
                    },
                };

                //this button just contains "next" for the main embed, so when we click it we get the 5 next items (if there are any) to the embed
                const forwardButton = new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next Page')
                    .setStyle(ButtonStyle.Primary)

                //this button just contains "back" for the main embed, so when we click it we get the 5 previous items (if there are any) to the embed
                const backButton = new ButtonBuilder()
                    .setCustomId('back')
                    .setLabel('Previous Page')
                    .setStyle(ButtonStyle.Secondary)

                //constructor for our row, which will contain our prev, next buttons (in that order).
                const row = new ActionRowBuilder()
                    .addComponents(backButton, forwardButton)

                //removing the ,'s from our array for printing.
                const formattedString =  outputFormatter(allRepoInfo.toString());

                //this displays those repo names to the caller
                await interaction.reply({
                   
                   //content: `${username}'s (public) Repositories: \n\n` + outputFormatter(allRepoInfo.toString()),
                   //this produces the embed that will hold our information
                   embeds: [allRepoEmbed],
                   //this contains the prev-next buttons.
                   components: [row]
                })

                
            }

            //if the user calls the "getspecificrepo" subcommand
            if (interaction.options.getSubcommand() === 'getspecificrepo') {

                //these just hold the user entered values
                const username = interaction.options.getString('username');

                const repoName = interaction.options.getString('repository');

                //this request returns ONE repositiory of the specified user
                const response = await octokit.request(`GET /repos/${username}/${repoName}`, {
                                    owner: username,
                                    repo: repoName,
                                    headers: {
                                        'X-GitHub-Api-Version': '2022-11-28'
                                    }
                                })

                //this is just formatted output of:
                //repo name -> description\n -> language (maybe change this) -> Watchers -> forks -> url
                const repoInfo = 
                `**Repository Name**: ${response.data.name}\n**Description**: ${response.data.description}\n\n**Language**: ${response.data.language}\n**Stars**: ${response.data.stargazers_count}\n**Watchers**: ${response.data.watchers_count}\n**Forks**: ${response.data.forks_count}\n**URL**: ${response.data.html_url}`;

                await interaction.reply(repoInfo);

            }

	},
};

//all this function does is take the ,'s in a formatted string for our array and remove them.
function outputFormatter(thingToFormat) {
    const formattedOutput = thingToFormat.replaceAll(',',"")
    return formattedOutput
};