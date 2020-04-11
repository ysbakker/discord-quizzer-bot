const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
require('../../models/user');
const User = mongoose.model('User');

const questions = JSON.parse(fs.readFileSync('./data/questions.json'));

module.exports = {
  name: 'vraag',
  aliases: ['v'],
  category: 'fun',
  description: 'Answer the question',
  run: async (client, message, args) => {
    const kekw = client.emojis.cache.find(
      emoji => emoji.name.toLowerCase() == 'kekw'
    );
    const pogu = client.emojis.cache.find(
      emoji => emoji.name.toLowerCase() == 'pogyou'
    );

    const question = questions[Math.floor(Math.random() * questions.length)];

    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setAuthor(message.author.username, message.author.displayAvatarURL())
      .setTitle(question.question)
      .setDescription(question.category)
      .setFooter('Je hebt 10 seconden om te antwoorden...');

    await message.channel.send(embed);

    try {
      const collected = await message.channel.awaitMessages(
        m => m.author.id === message.author.id,
        {
          max: 1,
          time: 10000,
        }
      );
      let user = await User.findOne({ user: message.author.id });
      if (!user) {
        user = new User({ user: message.author.id });
        await user.save();
      }

      const msg = await collected.first();

      const replyTime = Math.floor(
        (msg.createdTimestamp - message.createdTimestamp) / 1000
      );

      const guess = msg.content.toLowerCase();

      if (guess == 'idk') return await message.reply(`mmmkay ${kekw}`);

      if (guess != question.answer.toLowerCase()) {
        return await message.reply(
          `fout! Het antwoord is: ${question.answer} ${kekw}`
        );
      }

      const score = 15 - replyTime;

      await User.updateOne(
        { user: message.author.id },
        { score: user.score + score }
      );
      await message.reply(`${pogu} +${score} punten!`);
    } catch (e) {
      message.reply(`te laat ${kekw}`);
      console.error(`Awaiting reply on question ${e}`);
    }
  },
};
