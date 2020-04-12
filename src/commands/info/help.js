const { MessageEmbed } = require('discord.js');
const { stripIndents } = require('common-tags');

module.exports = {
  name: 'help',
  aliases: ['h'],
  category: 'info',
  description: `Does show the available commands.`,
  run: async (client, message, args) => {
    if (args[0]) {
      return getCommand(client, message, args[0]);
    } else {
      return getAll(client, message);
    }
  },
};

const getAll = (client, message) => {
  const embed = new MessageEmbed().setColor('WHITE');

  const commands = category => {
    return client.commands
      .filter(cmd => cmd.category === category)
      .map(cmd => `- \`${cmd.name}\``)
      .join('\n');
  };

  const info = client.categories
    .map(cat => stripIndents`**${cat[0].toUpperCase() + cat.slice(1)}** \n${commands(cat)}`)
    .reduce((string, category) => string + '\n' + category);

  return message.channel.send(embed.setDescription(info));
};

const getCommand = (client, message, input) => {
  const embed = new MessageEmbed();

  const cmd = client.commands.get(input.toLowerCase()) || client.commands.get(client.aliases.get(input.toLowerCase()));

  let info = `No information found for command **${input.toLowerCase()}**`;

  if (!cmd) return message.channel.send(embed.setColor('RED').setDescription(info));

  if (cmd.name) info = `**Command name**: ${cmd.name}`;
  if (cmd.aliases) info += `\n**Aliases**: ${cmd.aliases.map(a => `\`${a}\``).join(', ')}`;
  if (cmd.description) info += `\n**Description**: ${cmd.description}`;

  return message.channel.send(embed.setColor('GREEN').setDescription(info));
};
