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
  { key: 2, id: 10, value: 'Entertainment: Books' },
  { key: 3, id: 11, value: 'Entertainment: Film' },
  { key: 4, id: 12, value: 'Entertainment: Music' },
  { key: 5, id: 13, value: 'Entertainment: Musicals & Theatres' },
  { key: 6, id: 14, value: 'Entertainment: Television' },
  { key: 7, id: 15, value: 'Entertainment: Video Games' },
  { key: 8, id: 16, value: 'Entertainment: Board Games' },
  { key: 9, id: 17, value: 'Science & Nature' },
  { key: 10, id: 18, value: 'Science: Computers' },
  { key: 11, id: 19, value: 'Science: Mathematics' },
  { key: 12, id: 20, value: 'Mythology' },
  { key: 13, id: 21, value: 'Sports' },
  { key: 14, id: 22, value: 'Geography' },
  { key: 15, id: 23, value: 'History' },
  { key: 16, id: 24, value: 'Politics' },
  { key: 17, id: 25, value: 'Art' },
  { key: 18, id: 26, value: 'Celebrities' },
  { key: 19, id: 27, value: 'Animals' },
  { key: 20, id: 28, value: 'Vehicles' },
  { key: 21, id: 29, value: 'Entertainment: Comics' },
  { key: 22, id: 30, value: 'Science: Gadgets' },
  { key: 23, id: 31, value: 'Entertainment: Japanese Anime & Manga' },
  { key: 24, id: 32, value: 'Entertainment: Cartoon & Animations' },
];
const worth = { easy: 50, medium: 75, hard: 100 };

module.exports = {
  name: 'question',
  aliases: ['q'],
  category: 'fun',
  description: 'Answer the question correctly as fast as possible to earn coins.',
  run: async (client, message, args) => {
    let user = await User.findOne({ user: message.author.id });
    if (!user) user = new User({ user: message.author.id });

    if (user.questionnaires.length == 0) {
      await getQuestionnaire(message);
      return await selectQuestionnaire(message, user);
    }

    const question = await sendQuestion(message, user);
    if (question) await handleGuess(client, message, user, question);

    await user.save();
  },
};

const getQuestionnaire = async message => {
  const body = questionnaires.map(questionnaire => `**${questionnaire.key}**: ${questionnaire.value}`).join('\n');

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
  if (!id) return await message.reply(`that's not a correct value, try running the command again...`);
  const questionnaire = await fetchQuestionnaire(id, user);
  return await message.reply(
    `the ${questionnaire.category} questionnaire has been added to your collection.\nRun the \`!question\` command to start.`
  );
};

const fetchQuestionnaire = async (id, user) => {
  const response = await fetch(`https://opentdb.com/api.php?amount=50&category=${id}&type=multiple`);
  const data = await response.json();

  const questionnaire = new Questionnaire();
  questionnaire.categoryId = id;
  questionnaire.category = data.results[0].category;
  data.results.forEach(q => {
    const question = new Question();
    question.type = q.type;
    question.difficulty = q.difficulty;
    question.question = q.question;
    question.correctAnswer = q.correct_answer;
    question.incorrectAnswers = q.incorrect_answers;
    questionnaire.questions.push(question);
  });
  user.questionnaires.push(questionnaire);
  user.activeQuestionnaire = id;

  return questionnaire;
};

const sendQuestion = async (message, user) => {
  try {
    const { questions, category } = user.questionnaires.find(q => q.categoryId == user.activeQuestionnaire);
    const questionIndex = Math.floor(Math.random() * questions.length);
    const question = questions[questionIndex];
    // TODO: 1. Fix splice bug
    // const questionObj = questionnaire.questions[questionIndex];
    // const question = {
    //   incorrectAnswers: [...questionObj.incorrectAnswers],
    //   type: questionObj.type,
    //   difficulty: questionObj.difficulty,
    //   question: questionObj.question,
    //   correctAnswer: questionObj.correctAnswer,
    // };
    const answers = shuffle([question.correctAnswer, ...question.incorrectAnswers]);
    const choices = answers
      .map((choice, i) => {
        const key = String.fromCharCode(65 + i);
        if (choice == question.correctAnswer) question.correctAnswerKey = key;
        return `**${key}**: ${choice}`;
      })
      .join('\n');
    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setAuthor(`${message.author.username}'s question`, message.author.displayAvatarURL())
      .setTitle(question.question)
      .setDescription(choices)
      .addFields(
        { name: `Worth:`, value: `\`${worth[question.difficulty]} coins max.\``, inline: true },
        { name: `Difficulty:`, value: `\`${question.difficulty}\``, inline: true },
        { name: `Category:`, value: `\`${category}\``, inline: true }
      )
      .setFooter(`You've got 15 seconds to answer with the correct letter...`);

    user.questionsAsked++;
    console.log(user.questionsAsked);
    // TODO: 1. Fix splice bug
    // questions.splice(questionIndex, 1);
    await message.channel.send(embed);
    return question;
  } catch (e) {
    console.error(`Error sending question ${e}`);
  }
};

const handleGuess = async ({ emojis }, message, user, { correctAnswerKey, correctAnswer, difficulty }) => {
  try {
    const filter = m => m.author.id === message.author.id;
    const kekw = await emojis.cache.find(({ name }) => name.toLowerCase() == 'kekw');
    const pogyou = await emojis.cache.find(({ name }) => name.toLowerCase() == 'pogyou');
    const collected = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 15000,
    });
    const msg = await collected.first();
    const replyTime = Math.floor((msg.createdTimestamp - message.createdTimestamp) / 1000);

    if (msg.content.toLowerCase() != correctAnswerKey.toLowerCase()) {
      await message.reply(
        `that's not the correct answer... The correct answer is: **${correctAnswerKey}**: ${correctAnswer}.`
      );
      return await message.channel.send(`${kekw}`);
    }

    const coins = worth[difficulty] - replyTime * 2;
    user.balance += coins;
    user.questionsCorrect++;
    await message.reply(`that's correct, you earned ${coins} coins!`);
    await message.channel.send(`${pogyou}`);
  } catch (e) {
    message.reply(`you didn't answer the question in time...`);
    console.error(`Error awaiting reply on question ${e}`);
  }
};
