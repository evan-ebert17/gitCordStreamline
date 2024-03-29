# This example requires the 'message_content' intent.

import os
from dotenv import load_dotenv

##discord related
import discord
import logging

##

#make dotenv notation accessable
load_dotenv()

bot_token = os.getenv("BOT_TOKEN")
app_id = os.getenv("APPLICATION_ID")

intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)
handler = logging.FileHandler(filename='discord.log', encoding='utf-8', mode='w')

@client.event
async def on_ready():
    print(f'We have logged in as {client.user}')

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    if message.content.startswith('$hello'):
        await message.channel.send('Hello!')

client.run(bot_token)