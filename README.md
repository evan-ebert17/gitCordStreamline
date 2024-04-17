# gitCordStreamline

[Github](https://github.com/evan-ebert17/gitCordStreamline)

## Screen Shots
![gitCordStreamline](assets/getspecificcommit%20command.PNG)

##### Table of Contents  
[Purpose](#purpose)  
[Features](#features)  
[Technologies Used](#technologies-used)  
[Installation](#installation)  
[Usage](#usage)  
[Planned Additions](#planned-addtions)  
[Credits](#credits)  
[License](#license)  

## Purpose  
A Discord bot designed to give you access to GitHub repositories, commits, and issues directly in Discord. Using slash commands, you can make requests through the Octokit API to any public repository and get information on that repository.

## Features 
- /repos getallrepos, provide the username of the user you want to get all of their (public) repositories for
- /repos specifcallrepos, provide the username and repository name to get detailed information on the given (public) repository.
- /repos getallissues, provide the username and repository name to get all issues for that (public) repository.
- /repos getspecificissue, provide the username, repository name and issue number to get detailed information on the given issue.
- /repos getallcommits, provide the username and repository name to get all commits for that (public) repository.
- /repos getspecificcommit, provide the username, repository name and sha ID (produced in getallcommits!) to get detailed information on the given commit.
- /repos getlastcommit, provide the username and repository name detailed information on the most recent commit.

## Technologies-Used  
This bot was made using Discord.js, Octokit (GitHub's API which provides information from GitHub repositories) and dotenv.

## Installation  
To add this discord bot to your server, click this link https://discord.com/oauth2/authorize?client_id=1217285588944687115&permissions=8&scope=bot+applications.commands and then select which server you would like for it to join.

## Usage  
Using slash commands, you can make requests through the Octokit API to any public repository and get information on that repository.

## Planned-Additions
- Adding labels to the issues embed
- Ability to post issues

## Credits
This project was made by  
[Evan Ebert](https://github.com/evan-ebert17)

## License

Copyright 2024 Evan Ebert

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
