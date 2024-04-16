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
		.setName('issues')
		.setDescription('Gets information on issues of the specified GitHub repository.')

		//subcommands are just branching commands that require different options depending on the subcommand chosen
		//this subcommand gets the repository from a user and gets all of the issues associated with that repository.
		.addSubcommand(subcommand =>
			subcommand
				//getallissues is the name of one of the subcommands, and is what we'll use to call in the execute block
				.setName('getallissues')
				.setDescription('Gets all issues of a repository we want.')

				.addStringOption(option =>
					option.setName('username')
						.setDescription('The GitHub username of the user whose repository we`re looking at.')
						.setRequired(true))

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
					option.setName('username')
						.setDescription('The GitHub username of the user whose repository we`re looking at.')
						.setRequired(true))

				.addStringOption(option =>
					option.setName('repository')
						.setDescription('The GitHub repository containing the issue we want.')
						.setRequired(true))

				.addStringOption(option =>
					option.setName('issuenumber')
						.setDescription('The number of the issue we want (1, 2, 3 etc).')
						.setRequired(true))),

	async execute(interaction) {

		if (interaction.options.getSubcommand() === 'getallissues') {

			const username = interaction.options.getString('username');

			const repository = interaction.options.getString('repository');


			//this is so we can get them out of the .then statement
			let allIssueEmbed;
			let row;
			let numOfPages;
			let allIssuesInfo;

			const response = await octokit.paginate(`Get /repos/${username}/${repository}/issues`, {
				owner: username,
				repo: repository,
			})
				.then((issues) => {

					console.log(issues)

					let numOfIssues = issues.length;

					//because we display 5 issues per page, to get our total number of pages, we just total / 5.
					numOfPages = numOfIssues / 5
					if (numOfPages < 1) {
						numOfPages = 1;
					} else if (numOfPages % 1 != 0) {
						numOfPages = Math.ceil(numOfPages)
					}

					//this array is going to hold all of the issues that we will display
					allIssuesInfo = [];

					//currently set to 10, this is just using our response object to get all of the repo names and url's 
					//to be pushed to our allRepoInfo array
					for (let i = 0; i < numOfIssues; i += 5) {

						//get the next 5 elements from our data
						const issuesSlice = issues.slice(i, i + 5);

						// Map each repo to an object
						const issueGroup = issuesSlice.map(issue => {
							return {
								name: `**Issue Name:**`,
								value: issue.title + ` (*Issue Number:* #**`+ issue.number +`**, **` + issue.state + `**)`
							};
						});

						const issueBodyGroup = issuesSlice.map(issue => {
							return {
								name: `**Issue Description:**`,
								value: (issue.body === null) ? "No description provided" : `${issue.body}`
							};
						});

						// Combine the name and URL objects for each repo
						const combinedIssues = issueGroup.map((issue, index) => {
							return {
								name: issueGroup[index].name,
								value: `${issueGroup[index].value}\n${issueBodyGroup[index].name} \n${issueBodyGroup[index].value}`
							};
						});

						// Push the group of 5 into the array
						allIssuesInfo.push(combinedIssues);

					}

					//this will be used to keep track of what page of repositories we're on.
					let currentIssuesPage = 0;

					//this is the embed where our main content resides.
					//it is in object format currently.

					allIssueEmbed = {
						color: 0x547AA4,
						title: 'All Public Issues',
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
						fields: allIssuesInfo[currentIssuesPage],

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
				embeds: [allIssueEmbed],
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
			let currentIssuesPage = 0;

			//the i here is shorthand for interacton, or what will be being clicked in our case.
			collector.on('collect', async i => {

				//this is to say "hey, we got an interaction! don't throw an error."
				i.deferUpdate();


				if (i.customId === 'next') {
					//increment the representation of what repos will populate the papge for the page we're on
					currentIssuesPage++;

					//if there are no more items
					if (currentIssuesPage >= numOfPages) {

						//set value equal to last page in event we go too far
						currentIssuesPage = numOfPages - 1;
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
							title: 'All Public Issues',
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
							fields: allIssuesInfo[currentIssuesPage],

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
					currentIssuesPage--;

					//if there are no more items
					if (currentIssuesPage < 1) {

						//set value equal to last page in event we go too far
						currentIssuesPage = 0;
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

					//we edit the message with the updated currentRepoPage++
					await message.edit({
						embeds: [{
							color: 0x547AA4,
							title: 'All Public Issues',
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
							fields: allIssuesInfo[currentIssuesPage],

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
		if (interaction.options.getSubcommand() === 'getspecificissue') {

			//these just hold the user entered values
			const username = interaction.options.getString('username');

			const repoName = interaction.options.getString('repository');

			const issueNumber = interaction.options.getString('issuenumber')

			//this request returns ONE issue of the specified user
			const octokitPing = await octokit.request(`GET /repos/${username}/${repoName}/issues/${issueNumber}`, {
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

				//this is cleaning up the date created with regex
				const dateTimeString = response.data.created_at;
				const cleanedDateTimeString = dateTimeString.replace(/T\d{2}:\d{2}:\d{2}Z$/, '')

				const allIssueEmbed = {
					color: 0x547AA4,
					title: `**${response.data.title}**`,
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
							name: '**Status**',
							value: `${response.data.state}`
						},
						{
							name: `**Description**`,
							value: (response.data.body === null) ? "No description provided" : `${response.data.body}`
						},

						//blank space
						{
							name: `\u200b`,
							value: `\u200b`
						},
						{
							name: `**Date Created**`,
							value: cleanedDateTimeString
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
					embeds: [allIssueEmbed]
				}
				);

			} else {
				console.error("Error fetching repository details:", octokitPing.status)
			}
		}

	}
}