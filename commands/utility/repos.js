const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder, ComponentType, StringSelectMenuBuilder } = require('discord.js');

//module.exports is what we use in node to export data to be "require()"-d in other files.

const { Octokit, App } = require("octokit");

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

            const repository = interaction.options.getString('repository')

            //this is so we can get them out of the .then statement
            let allRepoEmbed;
            let row;
            let numOfPages;
            let avatarPic;
            //array that will hold an array of objects:

            //[allRepoInfo... [container... {...content in groups of 5 } ] ]
            //this is the structure of allRepoInfo
            let allReposInfo;

            const response = await octokit.paginate(`Get /users/${username}/repos`, {
                owner: username,
            })
                .then((repos) => {

                    let numOfRepos = repos.length;

                    avatarPic = repos[0].owner.avatar_url;

                    //because we display 5 issues per page, to get our total number of pages, we just total / 5.
                    numOfPages = numOfRepos / 5
                    if (numOfPages < 1) {
                        numOfPages = 1;
                    } else if (numOfPages % 1 != 0) {
                        numOfPages = Math.ceil(numOfPages)
                    }

                    //this array is going to hold all of the issues that we will display
                    allReposInfo = [];

                    //currently set to 10, this is just using our response object to get all of the repo names and url's 
                    //to be pushed to our allRepoInfo array
                    for (let i = 0; i < numOfRepos; i += 5) {

                        //get the next 5 elements from our data
                        const reposSlice = repos.slice(i, i + 5);

                        // Map each repo to an object
                        const repoGroup = reposSlice.map(repo => {
                            return {
                                name: `**Repo Name:**`,
                                value: repo.name
                            };
                        });

                        const repoURLGroup = reposSlice.map(repo => {
                            return {
                                name: `**Repo URL:**`,
                                value: repo.html_url
                            };
                        });

                        // Combine the name and URL objects for each repo
                        const combinedRepos = repoGroup.map((repo, index) => {
                            return {
                                name: repoGroup[index].name,
                                value: `${repoGroup[index].value}\n${repoURLGroup[index].name} \n${repoURLGroup[index].value}`
                            };
                        });

                        // Push the group of 5 into the array
                        allReposInfo.push(combinedRepos);

                    }

                    //this will be used to keep track of what page of repositories we're on.
                    let currentReposPage = 0;

                    //this is the embed where our main content resides.
                    //it is in object format currently.

                    allRepoEmbed = {
                        color: 0x547AA4,
                        title: 'All Public Repositories',
                        author: {
                            name: 'gitCordStreamline',
                            icon_url: 'https://i.imgur.com/VvN7PcF.png',
                            url: 'https://github.com/evan-ebert17/gitCordStreamline',
                        },
                        thumbnail: {
                            url: avatarPic,
                        },
                        //content starts here

                        //to update the text content, just increase the index here.
                        fields: allReposInfo[currentReposPage],

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

                    //this button keeps track of how many pages of information there are.
                    const whatPage = new ButtonBuilder()
                        .setCustomId('whatPage')
                        .setLabel(`1/${numOfPages}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)

                    //constructor for our row, which will contain our prev, next buttons (in that order).
                    row = new ActionRowBuilder()
                        .addComponents(backButton, whatPage, forwardButton)
                })

            //this displays those repo names to the caller
            const message = await interaction.reply({

                //this produces the embed that will hold our information
                embeds: [allRepoEmbed],
                //this contains the prev-next buttons.
                components: [row]
            })

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

            //this button keeps track of how many pages of information there are.
            const whatPage = new ButtonBuilder()
                .setCustomId('whatPage')
                .setLabel(`1/${numOfPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)

            //a collector is a way for us to collect interactions from the user
            //used for whenever we have more than 1 interaction we want to keep track of (in this case, pressing prev and back)
            //we take message, which is our interaction.reply and then we collect every time they press the prev and next button
            //and accordingly progress or regress the page contents. time is a param here to say "after 5 minutes stop trying to collect interactions".
            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 })

            //keep track of current page, starting at 1.
            let currentButtonPagesLeft = 1;


            //keeps track of what page we're currently on
            let currentRepoPage = 0;

            //the i here is shorthand for interacton, or what will be being clicked in our case.
            collector.on('collect', async i => {

                //this is to say "hey, we got an interaction! don't throw an error."
                i.deferUpdate();

                if (i.customId === 'next') {
                    //increment the representation of what repos will populate the papge for the page we're on
                    currentRepoPage++;

                    //if there are no more items
                    if (currentRepoPage >= numOfPages) {

                        //set value equal to last page in event we go too far
                        currentRepoPage = numOfPages - 1;
                    }

                    //disabledButton representing how many pages we have left
                    //in this case, we're incrementing
                    currentButtonPagesLeft++

                    //if we go too far to the right (ran out of pages)
                    if (currentButtonPagesLeft > numOfPages) {
                        //set button text to the max # of repos
                        currentButtonPagesLeft = numOfPages
                    }

                    //this updates the row with the new button text being increased by 1
                    const updatedRow = new ActionRowBuilder()
                        .addComponents(backButton, whatPage.setLabel(`${currentButtonPagesLeft}/${numOfPages}`), forwardButton);

                    //we edit the message with the updated currentRepoPage++
                    await message.edit({
                        embeds: [{
                            color: 0x547AA4,
                            title: 'All Public Repositories',
                            author: {
                                name: 'gitCordStreamline',
                                icon_url: 'https://i.imgur.com/VvN7PcF.png',
                                url: 'https://github.com/evan-ebert17/gitCordStreamline',
                            },
                            thumbnail: {
                                url: avatarPic,
                            },
                            //content starts here

                            //to update the text content, just increase the index here.
                            fields: allReposInfo[currentRepoPage],

                            //content ends here
                            timestamp: new Date().toISOString(),
                            footer: {
                                text: 'Evan Ebert 2024',
                                icon_url: 'https://i.imgur.com/VvN7PcF.png',
                            }
                        }],
                        components: [updatedRow]
                    });

                } else if (i.customId === 'back') {
                    //increment the representation of what repos will populate the papge for the page we're on
                    currentRepoPage--;

                    //if there are no more items
                    if (currentRepoPage < 1) {

                        //set value equal to last page in event we go too far
                        currentRepoPage = 0;
                    }

                    //disabledButton representing how many pages we have left
                    //in this case, we're incrementing
                    currentButtonPagesLeft--;

                    //if we go too far to the right (ran out of pages)
                    if (currentButtonPagesLeft < 1) {
                        //set button text to the max # of repos
                        currentButtonPagesLeft = 1;
                    }

                    //this updates the row with the new button text being increased by 1
                    const updatedRow = new ActionRowBuilder()
                        .addComponents(backButton, whatPage.setLabel(`${currentButtonPagesLeft}/${numOfPages}`), forwardButton);

                    //we edit the message with the updated currentRepoPage--
                    await message.edit({
                        embeds: [{
                            color: 0x547AA4,
                            title: 'All Public Repositories',
                            author: {
                                name: 'gitCordStreamline',
                                icon_url: 'https://i.imgur.com/VvN7PcF.png',
                                url: 'https://github.com/evan-ebert17/gitCordStreamline',
                            },
                            thumbnail: {
                                url: avatarPic,
                            },
                            //content starts here

                            //to update the text content, just increase the index here.
                            fields: allReposInfo[currentRepoPage],

                            //content ends here
                            timestamp: new Date().toISOString(),
                            footer: {
                                text: 'Evan Ebert 2024',
                                icon_url: 'https://i.imgur.com/VvN7PcF.png',
                            }
                        }],
                        components: [updatedRow]
                    });
                }
            });


        }

        //if the user calls the "getspecificrepo" subcommand
        if (interaction.options.getSubcommand() === 'getspecificrepo') {

            //these just hold the user entered values
            const username = interaction.options.getString('username');

            const repoName = interaction.options.getString('repository');

            //this request returns ONE repositiory of the specified user
            const octokitPing = await octokit.request(`GET /repos/${username}/${repoName}`, {
                owner: username,
                repo: repoName,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })

            if (octokitPing.status === 200) {

                const response = octokitPing

                //this is just formatted output of:
                //repo name -> description\n -> language (maybe change this) -> Watchers -> forks -> url

                const allRepoEmbed = {
                    color: 0x547AA4,
                    title: `**${response.data.name}**`,
                    author: {
                        name: 'gitCordStreamline',
                        icon_url: 'https://i.imgur.com/VvN7PcF.png',
                        url: 'https://github.com/evan-ebert17/gitCordStreamline',
                    },
                    thumbnail: {
                        url: `${response.data.owner.avatar_url}`,
                    },

                    //content starts here
                    fields: [
                        {
                            name: '**URL**',
                            value: `${response.data.html_url}`
                        },
                        {
                            name: `**Description**`,
                            value: (response.data.description === null) ? "No description provided" : `${response.data.description}`
                        },

                        //blank space
                        {
                            name: `\u200b`,
                            value: `\u200b`
                        },
                        {
                            name: `**Stars**`,
                            value: `${response.data.stargazers_count}`
                        },
                        {
                            name: `**Issues**`,
                            value: response.data.has_issues ? `https://github.com/${username}/${repoName}/issues` : "None"
                        }
                    ],

                    //content ends here
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: 'Evan Ebert 2024',
                        icon_url: 'https://i.imgur.com/VvN7PcF.png',
                    },
                };

                //const repoInfo = 
                //`**Repository Name**: ${response.data.name}\n**Description**: ${response.data.description}\n\n**Language**: ${response.data.language}\n**Stars**: ${response.data.stargazers_count}\n**Watchers**: ${response.data.watchers_count}\n**Forks**: ${response.data.forks_count}\n**URL**: ${response.data.html_url}`;

                await interaction.reply({
                    embeds: [allRepoEmbed]
                }
                );

            } else {
                console.error("Error fetching repository details:", octokitPing.status)
            }
        }

    },
};