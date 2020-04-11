require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
require('../src/models/question');

const Question = mongoose.model('Question');
const { MONGODB_HOST, MONGODB_PORT, DB_NAME } = process.env;

const seedQuestion = async () => {
  await Question.deleteMany();

  const questions = [];

  const questionsJson = JSON.parse(fs.readFileSync('./data/questions.json'));
  questions.push(...questionsJson.map(q => ({ ...q })));

  await Question.insertMany(questions);
};

mongoose
  .connect(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    return Promise.all([seedQuestion()]);
  })
  .catch(error => {
    console.error(error);
  })
  .then(() => {
    return mongoose.connection.close();
  });
