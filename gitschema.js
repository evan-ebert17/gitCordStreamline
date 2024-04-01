const { Octokit } = require("@octokit/core");
require('dotenv').config()

// Create an Octokit instance with your GitHub personal access token
const octokit = new Octokit({
  auth: process.env.OCTOKIT_AUTH
});

// This function creates a repo named "Alphabet-Soup"
async function createRepo() {
  try {
    const response = await octokit.request('POST /user/repos', {
      name: 'Alphabet-Soup',
      description: 'This is your first repo!',
      homepage: 'https://github.com',
      'private': false,
      is_template: true,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    console.log(`Repository created: ${response.data.html_url}`);
  } catch (error) {
    console.error('Error creating repository:', error.message);
  };
}