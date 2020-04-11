require('dotenv').config();
const { Client, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');

const client = new Client();
const { MONGODB_HOST, MONGODB_PORT, DB_NAME, DISCORD_TOKEN } = process.env;

client.commands = new Collection();
client.aliases = new Collection();
client.categories = fs.readdirSync('./src/commands/');

['command'].forEach(handler => {
  require(`./handlers/${handler}`)(client);
});

client.on('ready', async () => {
  try {
    await client.user.setPresence({
      status: 'online',
      activity: {
        name: 'Trivia | !question',
        type: 'PLAYING',
      },
    });

    await mongoose.connect(
      `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${DB_NAME}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
      }
    );

    console.log(`Logged in as ${client.user.tag}!`);
  } catch (e) {
    console.error(`Error getting ready: ${e}`);
  }
});

client.on('message', async msg => {
  const prefix = '!';

  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;
  if (!msg.member) msg.member = await msg.guild.fetchMember(msg);

  const args = msg.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();

  if (cmd.length === 0) return;

  const command =
    client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));

  if (command) await command.run(client, msg, args);
});

client.login(DISCORD_TOKEN);
