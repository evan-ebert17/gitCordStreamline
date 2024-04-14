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
					option.setName('repository')
						.setDescription('The GitHub repository containing the issue we want.')
						.setRequired(true))

				.addStringOption(option =>
					option.setName('issuetitle')
						.setDescription('The name of the issue we want.')
						.setRequired(true))),

	async execute(interaction) {

		if (interaction.options.getSubcommand() === 'getallissues') {

			const username = interaction.options.getString('username');

			const repository = interaction.options.getString('repository');


			//this is so we can get them out of the .then statement
			let allIssueEmbed;
			let row;

			const response = await octokit.paginate(`Get /repos/${username}/${repository}/issues`, {
				owner: username,
				repo: repository,
			})
				.then((issues) => {

					console.log(issues)

					let numOfIssues = issues.length;

					//because we display 5 issues per page, to get our total number of pages, we just total / 5.
					let itemsPerPage = numOfIssues / 5
					if(itemsPerPage < 1) {
						itemsPerPage = 1;
					}

					//this array is going to hold all of the issues that we will display
					let allIssuesInfo = [];

					//currently set to 10, this is just using our response object to get all of the repo names and url's 
					//to be pushed to our allRepoInfo array
					for (let i = 0; i < numOfIssues; i += 5) {

						//get the next 5 elements from our data
						const issuesSlice = issues.slice(i, i + 5);

						// Map each repo to an object
						const issueGroup = issuesSlice.map(issue => {
							return {
								name: `**Issue Name:**`,
								value: issue.title
							};
						});

						const issueBodyGroup = issuesSlice.map(issue => {
							return {
								name: `**Issue Content:**`,
								value: issue.body
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
						.setLabel(`1/${itemsPerPage}`)
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


		}

	}
}