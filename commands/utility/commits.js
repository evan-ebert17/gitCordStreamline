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
        .setName('commits')
        .setDescription('Gets information on commits of the specified GitHub repository.')

        //subcommands are just branching commands that require different options depending on the subcommand chosen
        //this subcommand gets the repository from a user and gets all of the issues associated with that repository.
        .addSubcommand(subcommand =>
            subcommand
                //getallissues is the name of one of the subcommands, and is what we'll use to call in the execute block
                .setName('getallcommits')
                .setDescription('Gets all commits of a repository we want.')

                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('The GitHub username of the user whose repository we`re looking at.')
                        .setRequired(true))

                //this specifies the information we're asking from the user, and we added .setRequired to say "you have to put this".
                .addStringOption(option =>
                    option.setName('repository')
                        .setDescription('The GitHub repository containing the commits we want.')
                        .setRequired(true))

                //this is just a thing asking "hey do you want this private or not".
                .addBooleanOption(option =>
                    option.setName('private')
                        .setDescription('Whether or not this command should be for your eyes only'))
        )
        .addSubcommand(subcommand =>
            subcommand
                //gets issue of specific name
                .setName('getspecificcommit')
                .setDescription('Gets a specific issue from a specific repository.')

                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('The GitHub username of the user whose repository we`re looking at.')
                        .setRequired(true))

                .addStringOption(option =>
                    option.setName('repository')
                        .setDescription('The GitHub repository containing the commit we want.')
                        .setRequired(true))

                .addStringOption(option =>
                    option.setName('commitid')
                        .setDescription('The id of the commit we want.')
                        .setRequired(true)))

        .addSubcommand(subcommand =>
            subcommand
                //gets issue of specific name
                .setName('getlastcommit')
                .setDescription('Gets the last commit from a specific repository.')

                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('The GitHub username of the user whose repository we`re looking at.')
                        .setRequired(true))

                .addStringOption(option =>
                    option.setName('repository')
                        .setDescription('The GitHub repository containing the commit we want.')
                        .setRequired(true))),



    async execute(interaction) {
        //if we have subcommands, we need to set this "CommandInteractionOptionResolver#getSubcommand()" to tell us which subcommand was used.
        if (interaction.options.getSubcommand() === 'getallcommits') {
            // inside a command, event listener, etc.

            const username = interaction.options.getString('username');

            const repository = interaction.options.getString('repository')

            //this is so we can get them out of the .then statement
            let allCommitsEmbed;
            let row;
            let numOfPages;
            //array that will hold an array of objects:

            //[allRepoInfo... [container... {...content in groups of 5 } ] ]
            //this is the structure of allCommitsInfo
            let allCommitsInfo;

            const response = await octokit.paginate(`Get /repos/${username}/${repository}/commits`, {
                owner: username,
            })
                .then((commits) => {

                    let numOfCommits = commits.length;

                    //because we display 5 issues per page, to get our total number of pages, we just total / 5.
                    numOfPages = numOfCommits / 5
                    if (numOfPages < 1) {
                        numOfPages = 1;
                    } else if (numOfPages % 1 != 0) {
                        numOfPages = Math.ceil(numOfPages)
                    }

                    //this array is going to hold all of the issues that we will display
                    allCommitsInfo = [];

                    //currently set to 10, this is just using our response object to get all of the commit names and url's 
                    //to be pushed to our allcommitInfo array
                    for (let i = 0; i < numOfCommits; i += 5) {

                        //get the next 5 elements from our data
                        const commitsSlice = commits.slice(i, i + 5);


                        // Map each commit to an object
                        const commitsGroup = commitsSlice.map(commit => {
                            const committerName = commit.committer && commit.committer.login ? commit.committer.login : "Unknown";
                            const commitID = commit.sha ? commit.sha : "Unknown";
                            return {
                                name: `**Commit Author:**`,
                                value: committerName + '\n' + ` (ID: *` + commitID + `*)`
                            };
                        });

                        const commitsDescriptionGroup = commitsSlice.map(commit => {
                            return {
                                name: `**Commit Description:**`,
                                value: commit.commit.message
                            };
                        });

                        // Combine the author and description objects for each repo
                        const combinedCommits = commitsGroup.map((commit, index) => {
                            return {
                                name: commitsGroup[index].name,
                                value: `${commitsGroup[index].value}\n${commitsDescriptionGroup[index].name} \n${commitsDescriptionGroup[index].value}`
                            };
                        });

                        // Push the group of 5 into the array
                        allCommitsInfo.push(combinedCommits);

                    }

                    //this will be used to keep track of what page of commits we're on.
                    let currentCommitsPage = 0;

                    //this is the embed where our main content resides.
                    //it is in object format currently.

                    allCommitsEmbed = {
                        color: 0x547AA4,
                        title: 'All Public Commits',
                        author: {
                            name: 'gitCordStreamline',
                            icon_url: 'https://i.imgur.com/VvN7PcF.png',
                            url: 'https://github.com/evan-ebert17/gitCordStreamline',
                        },
                        thumbnail: {
                            url: `https://i.imgur.com/VvN7PcF.png`,
                        },
                        //content starts here

                        //to update the text content, just increase the index here.
                        fields: allCommitsInfo[currentCommitsPage],

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
                embeds: [allCommitsEmbed],
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
            let currentCommitsPage = 0;

            //the i here is shorthand for interacton, or what will be being clicked in our case.
            collector.on('collect', async i => {

                //this is to say "hey, we got an interaction! don't throw an error."
                i.deferUpdate();

                if (i.customId === 'next') {
                    //increment the representation of what commits will populate the page for the page we're on
                    currentCommitsPage++;

                    //if there are no more items
                    if (currentCommitsPage >= numOfPages) {

                        //set value equal to last page in event we go too far
                        currentCommitsPage = numOfPages - 1;
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

                    //we edit the message with the updated currentCommitsPage++
                    await message.edit({
                        embeds: [{
                            color: 0x547AA4,
                            title: 'All Public Commits',
                            author: {
                                name: 'gitCordStreamline',
                                icon_url: 'https://i.imgur.com/VvN7PcF.png',
                                url: 'https://github.com/evan-ebert17/gitCordStreamline',
                            },
                            thumbnail: {
                                url: `https://i.imgur.com/VvN7PcF.png`,
                            },
                            //content starts here

                            //to update the text content, just increase the index here.
                            fields: allCommitsInfo[currentCommitsPage],

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
                    //increment the representation of what commits will populate the page for the page we're on
                    currentCommitsPage--;

                    //if there are no more items
                    if (currentCommitsPage < 1) {

                        //set value equal to last page in event we go too far
                        currentCommitsPage = 0;
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

                    //we edit the message with the updated currentCommitsPage--
                    await message.edit({
                        embeds: [{
                            color: 0x547AA4,
                            title: 'All Public Commits',
                            author: {
                                name: 'gitCordStreamline',
                                icon_url: 'https://i.imgur.com/VvN7PcF.png',
                                url: 'https://github.com/evan-ebert17/gitCordStreamline',
                            },
                            thumbnail: {
                                url: `https://i.imgur.com/VvN7PcF.png`,
                            },
                            //content starts here

                            //to update the text content, just increase the index here.
                            fields: allCommitsInfo[currentCommitsPage],

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
        if (interaction.options.getSubcommand() === 'getspecificcommit') {

            //these just hold the user entered values
            const username = interaction.options.getString('username');

            const repoName = interaction.options.getString('repository');

            const ID = interaction.options.getString('commitid');

            //this request returns ONE repositiory of the specified user
            const octokitPing = await octokit.request(`GET /repos/${username}/${repoName}/commits/${ID}`, {
                owner: username,
                repo: repoName,
                ref: ID,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })

            if (octokitPing.status === 200) {

                const response = octokitPing

                //this is just formatted output of:
                //repo name -> description\n -> language (maybe change this) -> Watchers -> forks -> url

                //console.log(response.data.files)

                //this array is going to hold all of the issues that we will display
                let filesData = response.data.files;

                let filesArray = [];

                for (let i = 0; i < filesData.length; i++) {
                    let strippedFileObject = {
                        name: `*Changes made to ${filesData[i].filename}*`,
                        value: `Changes: **` + filesData[i].changes + '**\n' + `Addtions: **` + filesData[i].additions + `, ** Deletions: **` + filesData[i].deletions + `**`
                    };

                    filesArray.push(strippedFileObject);
                }



                const allCommitsEmbed = {
                    color: 0x547AA4,
                    title: `**${response.data.author.login}**`,
                    author: {
                        name: 'gitCordStreamline',
                        icon_url: 'https://i.imgur.com/VvN7PcF.png',
                        url: 'https://github.com/evan-ebert17/gitCordStreamline',
                    },
                    thumbnail: {
                        url: `https://i.imgur.com/VvN7PcF.png`,
                    },

                    //content starts here
                    fields: [
                        {
                            name: '**URL**',
                            value: `${response.data.html_url}`
                        },
                        {
                            name: `**Description**`,
                            value: (response.data.commit.message === null) ? "No message provided" : `${response.data.commit.message}`
                        },
                        //filesArray content
                        ...filesArray,

                        //blank space
                        {
                            name: `\u200b`,
                            value: `\u200b`
                        },

                        {
                            name: `**Stats:**`,
                            value: 'Total: **' + response.data.stats.total + '** Additions: **' + response.data.stats.additions + ', ** Deletions: **' + response.data.stats.deletions + '**'
                        },
                        {
                            name: `**Commit ID:**`,
                            value: `${response.data.sha}`
                        },
                    ],

                    //content ends here
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: 'Evan Ebert 2024',
                        icon_url: 'https://i.imgur.com/VvN7PcF.png',
                    },
                };


                await interaction.reply({
                    embeds: [allCommitsEmbed]
                }
                );

            } else {
                console.error("Error fetching repository details:", octokitPing.status)
            }
        }
        if (interaction.options.getSubcommand() === 'getlastcommit') {
            //these just hold the user entered values
            const username = interaction.options.getString('username');

            const repoName = interaction.options.getString('repository');

            let lastCommitID;

            //this request returns ONE repositiory of the specified user
            const getAllCommits = await octokit.paginate(`Get /repos/${username}/${repoName}/commits`, {
                owner: username,
            })
                .then((commits) => {

                    console.log(commits.length)

                    lastCommitID = commits[0].sha
                })

            const octokitPing = await octokit.request(`GET /repos/${username}/${repoName}/commits/${lastCommitID}`, {
                owner: username,
                repo: repoName,
                ref: lastCommitID,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })

            if (octokitPing.status === 200) {

                const response = octokitPing

                //this is just formatted output of:
                //repo name -> description\n -> language (maybe change this) -> Watchers -> forks -> url

                //console.log(response.data.files)

                //this array is going to hold all of the issues that we will display
                let filesData = response.data.files;

                let filesArray = [];

                for (let i = 0; i < filesData.length; i++) {
                    let strippedFileObject = {
                        name: `*Changes made to ${filesData[i].filename}*`,
                        value: `Changes: **` + filesData[i].changes + '**\n' + `Addtions: **` + filesData[i].additions + `, ** Deletions: **` + filesData[i].deletions + `**`
                    };

                    filesArray.push(strippedFileObject);
                }



                const allCommitsEmbed = {
                    color: 0x547AA4,
                    title: `**${response.data.author.login}**`,
                    author: {
                        name: 'gitCordStreamline',
                        icon_url: 'https://i.imgur.com/VvN7PcF.png',
                        url: 'https://github.com/evan-ebert17/gitCordStreamline',
                    },
                    thumbnail: {
                        url: `https://i.imgur.com/VvN7PcF.png`,
                    },

                    //content starts here
                    fields: [
                        {
                            name: '**URL**',
                            value: `${response.data.html_url}`
                        },
                        {
                            name: `**Description**`,
                            value: (response.data.commit.message === null) ? "No message provided" : `${response.data.commit.message}`
                        },
                        //filesArray content
                        ...filesArray,

                        //blank space
                        {
                            name: `\u200b`,
                            value: `\u200b`
                        },

                        {
                            name: `**Stats:**`,
                            value: 'Total: **' + response.data.stats.total + '** Additions: **' + response.data.stats.additions + ', ** Deletions: **' + response.data.stats.deletions + '**'
                        },
                        {
                            name: `**Commit ID:**`,
                            value: `${response.data.sha}`
                        },
                    ],

                    //content ends here
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: 'Evan Ebert 2024',
                        icon_url: 'https://i.imgur.com/VvN7PcF.png',
                    },
                };


                await interaction.reply({
                    embeds: [allCommitsEmbed]
                })
            }
        }
    }
}