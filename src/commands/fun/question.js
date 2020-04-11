const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const shuffle = require('shuffle-array');
require('../../models/user');
require('../../models/questionnaire');
require('../../models/question');

const User = mongoose.model('User');
const Questionnaire = mongoose.model('Questionnaire');
const Question = mongoose.model('Question');

const questionnaires = [
  { key: 1, id: 9, value: 'General Knowledge' },
  { key: 2, id: 21, value: 'Sports' },
];

module.exports = {
  name: 'question',
  aliases: ['q'],
  category: 'fun',
  description:
    'Answer the question correctly as fast as possible to earn coins.',
  run: async (client, message, args) => {
    let user = await User.findOne({ user: message.author.id });
    if (!user) {
      user = new User({ user: message.author.id });
      await user.save();
    }

    if (user.questionnaires.length == 0) {
      await getQuestionnaire(message);
      await selectQuestionnaire(message, user);
    }

    const answer = await sendQuestion(message, user);
    if (answer) await handleGuess(client, message, answer);
  },
};

const getQuestionnaire = async message => {
  const body = questionnaires
    .map(questionnaire => `${questionnaire.key}) ${questionnaire.value}`)
    .join('\n');

  const embed = new MessageEmbed()
    .setColor('WHITE')
    .setAuthor(message.author.username, message.author.displayAvatarURL())
    .setTitle(`Select one questionnaire for free!`)
    .setDescription(body);

  await message.channel.send(embed);
};

const selectQuestionnaire = async (message, user) => {
  const filter = m => m.author.id === message.author.id;
  const collected = await message.channel.awaitMessages(filter, { max: 1 });
  const msg = await collected.first().content;
  const { id } = questionnaires.find(q => q.key == parseInt(msg)) || {};
  if (!id) {
    return message.reply(
      `that's not a correct value, try running the command again...`
    );
  }
  const response = await fetch(
    `https://opentdb.com/api.php?amount=50&category=${id}&type=multiple`
  );
  const data = await response.json();

  const questionnaire = new Questionnaire();
  questionnaire.category_id = id;
  questionnaire.category = data.results[0].category;
  data.results.forEach(q => {
    const question = new Question();
    questionnaire.category = q.category;
    question.type = q.type;
    question.difficulty = q.difficulty;
    question.question = q.question;
    question.correct_answer = q.correct_answer;
    question.incorrect_answers = q.incorrect_answers;
    questionnaire.questions.push(question);
  });
  user.questionnaires.push(questionnaire);
  user.active_questionnaire = id;
  user.save();
  return message.reply(
    `the ${questionnaire.category} questionnaire has been added to your collection.`
  );
};

const sendQuestion = async (message, user) => {
  try {
    const { questions } = user.questionnaires.find(
      questionnaire => questionnaire.category_id == user.active_questionnaire
    );
    const question = questions[Math.floor(Math.random() * questions.length)];
    const choices = shuffle([
      question.correct_answer,
      ...question.incorrect_answers,
    ]);
    let answer;
    const multipleChoices = choices
      .map((choice, i) => {
        const key = String.fromCharCode(65 + i);
        if (choice == question.correct_answer)
          answer = { key, value: question.correct_answer };
        return `${key}) ${choice}`;
      })
      .join('\n');

    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setAuthor(
        `${message.author.username}'s question`,
        message.author.displayAvatarURL()
      )
      .setTitle(question.question)
      .setDescription(multipleChoices)
      .setFooter(`You've got 10 seconds to answer the question...`);
    await message.channel.send(embed);

    return answer;
  } catch (e) {
    console.error(`Error sending question ${e}`);
  }
};

const handleGuess = async (client, message, answer) => {
  try {
    const filter = m => m.author.id === message.author.id;
    const kekw = await client.emojis.cache.find(
      emoji => emoji.name.toLowerCase() == 'kekw'
    );
    const pogyou = await client.emojis.cache.find(
      emoji => emoji.name.toLowerCase() == 'pogyou'
    );

    const collected = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 10000,
    });

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

    if (guess != answer.key.toLowerCase()) {
      await message.reply(
        `that's not the correct answer... The correct answer is: ${answer.key}, ${answer.value}.`
      );
      return await message.channel.send(`${kekw}`);
    }

    const coins = 15 - replyTime;
    await User.updateOne(
      { user: message.author.id },
      { balance: user.balance + coins }
    );
    await message.reply(`that's correct, you earned ${coins} coins!`);
    await message.channel.send(`${pogyou}`);
  } catch (e) {
    message.reply(`you didn't answer the question in time...`);
    console.error(`Error awaiting reply on question ${e}`);
  }
};
