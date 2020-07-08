const { MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const shuffle = require('shuffle-array');
const Entities = require('html-entities').AllHtmlEntities;
require('../../models/user');
require('../../models/questionnaire');
require('../../models/question');

const User = mongoose.model('User');
const Questionnaire = mongoose.model('Questionnaire');
const Question = mongoose.model('Question');
const entities = new Entities();
const { OPENTDB } = process.env;
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
      const questionnaires = await getQuestionnaire(message);
      return await selectQuestionnaire(message, user, questionnaires);
    }

    const question = await sendQuestion(message, user);
    if (question) await handleGuess(message, user, question);

    await user.save();
  }
};

const getQuestionnaire = async message => {
  const response = await fetch(`${OPENTDB}/api_category.php`);
  const { trivia_categories } = await response.json();
  const body = trivia_categories.map((category, index) => `**${index + 1}**: ${category.name}`).join('\n');
  const embed = new MessageEmbed()
    .setColor('WHITE')
    .setAuthor(message.author.username, message.author.displayAvatarURL())
    .setTitle(`Select one questionnaire for free!`)
    .setDescription(body);
  await message.channel.send(embed);
  return trivia_categories;
};

const selectQuestionnaire = async (message, user, questionnaires) => {
  const filter = m => m.author.id === message.author.id;
  const collected = await message.channel.awaitMessages(filter, { max: 1 });
  const msg = await collected.first().content;
  const index = parseInt(msg) - 1;
  if (index >= questionnaires.length)
    return await message.reply(`that's not a correct value, try running the command again...`);
  const { id } = questionnaires[index];
  const questionnaire = await createQuestionnaire(id, user);
  return await message.reply(
    `the ${questionnaire.category} questionnaire has been added to your collection.\nRun the \`!question\` command to start.`
  );
};

const fetchQuestions = async id => {
  const response = await fetch(`${OPENTDB}/api.php?amount=50&category=${id}&type=multiple`);
  return await response.json();
};

const createQuestions = async results => {
  const questions = [];
  results.forEach(q => {
    const question = new Question();
    question.type = q.type;
    question.difficulty = q.difficulty;
    question.question = q.question;
    question.correctAnswer = q.correct_answer;
    question.incorrectAnswers = q.incorrect_answers;
    questions.push(question);
  });
  return questions;
};

const createQuestionnaire = async (id, user) => {
  const { results } = await fetchQuestions(id);
  const questionnaire = new Questionnaire();
  questionnaire.categoryId = id;
  questionnaire.category = results[0].category;
  questionnaire.questions = await createQuestions(results);
  user.questionnaires.push(questionnaire);
  user.activeQuestionnaire = id;
  await user.save();
  return questionnaire;
};

const sendQuestion = async (message, user) => {
  try {
    const questionnaire = user.questionnaires.find(q => q.categoryId == user.activeQuestionnaire);
    if (questionnaire.questions.length <= 0) {
      const { results } = await fetchQuestions(user.activeQuestionnaire);
      questionnaire.questions = await createQuestions(results);
    }
    const questionIndex = Math.floor(Math.random() * questionnaire.questions.length);
    const questionObj = questionnaire.questions[questionIndex];
    const question = {
      incorrectAnswers: [...questionObj.incorrectAnswers],
      type: questionObj.type,
      difficulty: questionObj.difficulty,
      question: questionObj.question,
      correctAnswer: questionObj.correctAnswer
    };
    const answers = shuffle([question.correctAnswer, ...question.incorrectAnswers]);
    const choices = answers
      .map((choice, i) => {
        const key = String.fromCharCode(65 + i);
        if (choice == question.correctAnswer) question.correctAnswerKey = key;
        return `**${key}**: ${entities.decode(choice)}`;
      })
      .join('\n');
    const embed = new MessageEmbed()
      .setColor('WHITE')
      .setAuthor(`${message.author.username}'s question`, message.author.displayAvatarURL())
      .setTitle(entities.decode(question.question))
      .setDescription(choices)
      .addFields(
        { name: `Worth:`, value: `\`${worth[question.difficulty]} coins max.\``, inline: true },
        { name: `Difficulty:`, value: `\`${question.difficulty}\``, inline: true },
        { name: `Category:`, value: `\`${questionnaire.category}\``, inline: true }
      )
      .setFooter(`You've got 15 seconds to answer with the correct letter...`);

    user.questionsAsked++;
    questionnaire.questions.splice(questionIndex, 1);
    await message.channel.send(embed);
    return question;
  } catch (e) {
    console.error(`Error sending question ${e}`);
  }
};

const handleGuess = async (message, user, { correctAnswerKey, correctAnswer, difficulty }) => {
  try {
    const filter = m => m.author.id === message.author.id;
    const collected = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 15000
    });
    const msg = await collected.first();
    const replyTime = Math.floor((msg.createdTimestamp - message.createdTimestamp) / 1000);

    if (msg.content.toLowerCase() != correctAnswerKey.toLowerCase()) {
      return await message.reply(
        `that's not the correct answer... The correct answer is: **${correctAnswerKey}**: ${entities.decode(
          correctAnswer
        )}.`
      );
    }

    const coins = worth[difficulty] - replyTime * 2;
    user.balance += coins;
    user.questionsCorrect++;
    await message.reply(`that's correct, you earned ${coins} coins!`);
  } catch (e) {
    message.reply(`you didn't answer the question in time...`);
  }
};
